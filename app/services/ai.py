import json
from google import genai
from app.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)
MODEL = "gemini-2.5-flash"


def _parse_json(text: str) -> dict | list:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1]
        cleaned = cleaned.rsplit("```", 1)[0]
    return json.loads(cleaned)


def generate_study_material(content: str) -> dict:
    prompt = f"""
Você é um assistente de estudos especializado em criar material didático de alta qualidade.

TAREFAS:
1. Crie 5-15 flashcards com perguntas conceituais e respostas explicativas
2. Gere um resumo estruturado em parágrafos coerentes

REGRAS PARA FLASHCARDS:
- Frente: perguntas claras que testam compreensão, não apenas memorização
- Verso: explicações completas mas concisas (2-4 frases)
- Evite perguntas de sim/não
- Priorize conceitos fundamentais do conteúdo

REGRAS PARA RESUMO:
- Escreva em português do Brasil
- Use parágrafos bem estruturados
- Destaque conceitos-chave e relações entre eles

FORMATO DE SAÍDA (JSON válido, sem markdown, sem texto adicional):
{{
  "flashcards": [
    {{"front": "O que é X?", "back": "X é... porque..."}}
  ],
  "summary": "texto do resumo aqui"
}}

CONTEÚDO PARA ANALISAR:
{content}
"""
    response = client.models.generate_content(model=MODEL, contents=prompt)
    return _parse_json(response.text)


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
    response = client.models.generate_content(model=MODEL, contents=prompt)
    return _parse_json(response.text)


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
    response = client.models.generate_content(model=MODEL, contents=prompt)
    return _parse_json(response.text)
