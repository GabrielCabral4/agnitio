import json
import time
from google import genai
from google.genai.errors import APIError
from app.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)
MODEL_PRIMARY = "gemini-2.5-flash"
MODEL_FALLBACK = "gemini-1.5-flash"
MAX_RETRIES = 3
BASE_DELAY = 1  # seconds


def _parse_json(text: str) -> dict | list:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1]
        cleaned = cleaned.rsplit("```", 1)[0]
    return json.loads(cleaned)


def _generate_with_retry(prompt: str, model: str = MODEL_PRIMARY) -> str:
    """
    Gera conteúdo com retry exponencial e fallback para modelo alternativo.
    Lança HTTPException(status_code=503) se tudo falhar.
    """
    from fastapi import HTTPException

    last_error = None

    # Tenta com o modelo primário
    for attempt in range(MAX_RETRIES):
        try:
            response = client.models.generate_content(model=model, contents=prompt)
            return response.text
        except APIError as e:
            last_error = e
            if e.code == 503 or "unavailable" in str(e).lower():
                if attempt < MAX_RETRIES - 1:
                    delay = BASE_DELAY * (2 ** attempt)
                    time.sleep(delay)
                    continue
                # Esgotou tentativas com modelo primário, tenta fallback
                break
            else:
                # Erro não recuperável
                raise

    # Tenta com modelo fallback
    for attempt in range(MAX_RETRIES):
        try:
            response = client.models.generate_content(model=MODEL_FALLBACK, contents=prompt)
            return response.text
        except APIError as e:
            last_error = e
            if e.code == 503 or "unavailable" in str(e).lower():
                if attempt < MAX_RETRIES - 1:
                    delay = BASE_DELAY * (2 ** attempt)
                    time.sleep(delay)
                    continue
                break

    # Tudo falhou
    raise HTTPException(
        status_code=503,
        detail="Serviço de IA temporariamente indisponível. Por favor, tente novamente em alguns instantes."
    )


def generate_study_material(content: str) -> dict:
    prompt = f"""
Você é um assistente de estudos especializado em criar material didático de alta qualidade.

TAREFAS:
1. Crie 5-15 flashcards com perguntas conceituais e respostas diretas
2. Gere um resumo estruturado em parágrafos coerentes

REGRAS PARA FLASHCARDS:
- Frente: perguntas claras e objetivas que testam compreensão conceitual
- Verso: respostas DIRETAS e CONCISAS (1-2 frases, máximo 40 palavras)
- Cada flashcard deve testar UM único conceito
- Evite perguntas de sim/não ou muito genéricas
- Priorize conceitos fundamentais e definições-chave
- Respostas devem caber em um cartão físico — seja sucinto, vá direto ao ponto

REGRAS PARA RESUMO:
- Escreva em português do Brasil
- Use parágrafos bem estruturados
- Destaque conceitos-chave e relações entre eles

FORMATO DE SAÍDA (JSON válido, sem markdown, sem texto adicional):
{{
  "flashcards": [
    {{"front": "O que é X?", "back": "X é [definição direta]. [contexto opcional breve]."}}
  ],
  "summary": "texto do resumo aqui"
}}

CONTEÚDO PARA ANALISAR:
{content}
"""
    response_text = _generate_with_retry(prompt)
    return _parse_json(response_text)


def generate_quiz(content: str) -> list:
    prompt = f"""
Você é um especialista em avaliação educacional criando questões de múltipla escolha.

TAREFA:
Crie 5 questões de múltipla escolha baseadas no conteúdo fornecido.

REGRAS PARA AS QUESTÕES:
- Escreva tudo em português do Brasil
- Cada questão deve testar compreensão ou aplicação, não apenas memorização
- Use 4 opções (A, B, C, D) por questão
- Apenas UMA opção deve estar correta
- Distratores devem ser plausíveis, não obviamente errados
- Evite "todas as anteriores" ou "nenhuma das anteriores"
- Varie a posição da resposta correta entre as questões

DIFICULDADE:
- 2 questões fáceis (conceitos básicos)
- 2 questões médias (aplicação direta)
- 1 questão difícil (análise ou síntese)

FORMATO DE SAÍDA (JSON válido, sem markdown, sem texto adicional):
[
  {{
    "question": "texto da pergunta",
    "options": ["opção A", "opção B", "opção C", "opção D"],
    "correct_index": 0
  }}
]

CONTEÚDO PARA ANALISAR:
{content}
"""
    response_text = _generate_with_retry(prompt)
    return _parse_json(response_text)


def analyze_answers(questions: list, answers: list) -> dict:
    pairs = []
    for i, (q, a) in enumerate(zip(questions, answers)):
        pairs.append(
            f"Questão {i+1}: {q['question']}\n"
            f"Resposta correta: {q['options'][q['correct_index']]}\n"
            f"Resposta do usuário: {q['options'][a]}\n"
            f"O usuário {'acertou' if a == q['correct_index'] else 'errou'}"
        )
    pairs_text = "\n\n".join(pairs)

    prompt = f"""
Você é um tutor encorajador e construtivo avaliando o desempenho de um estudante.

TAREFA:
Analise as respostas do estudante e gere feedback personalizado.

REGRAS PARA O FEEDBACK:
- Escreva tudo em português do Brasil
- Tom encorajador, focado em aprendizado, não em julgamento
- Comece destacando o que o estudante acertou
- Para erros: explique POR QUE a resposta correta está certa, não apenas qual é
- Inclua dicas específicas para melhorar nos tópicos onde errou
- Seja específico, evite frases genéricas como "continue estudando"

FORMATO DE SAÍDA (JSON válido, sem markdown, sem texto adicional):
{{
  "score": <número de acertos, inteiro>,
  "feedback": "feedback geral motivador e específico",
  "review": [
    {{
      "question": "texto da questão",
      "correct": true/false,
      "explanation": "explicação educativa de 2-3 frases"
    }}
  ]
}}

QUESTÕES E RESPOSTAS:
{pairs_text}
"""
    response_text = _generate_with_retry(prompt)
    return _parse_json(response_text)
