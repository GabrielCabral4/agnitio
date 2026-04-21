import os

files = {
    "app/services/ai.py": """import json
from google import genai
from app.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)
MODEL = "gemini-2.0-flash-lite"


def _parse_json(text: str) -> dict | list:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\\n", 1)[-1]
        cleaned = cleaned.rsplit("```", 1)[0]
    return json.loads(cleaned)


def generate_study_material(content: str) -> dict:
    prompt = f\"\"\"
Você é um assistente de estudos. A partir do conteúdo abaixo, gere:
1. Uma lista de flashcards (mínimo 5, máximo 15)
2. Um resumo estruturado do conteúdo

Responda APENAS com um JSON válido, sem texto adicional, sem markdown, exatamente neste formato:
{{
  "flashcards": [
    {{"front": "pergunta ou conceito", "back": "resposta ou explicação"}}
  ],
  "summary": "resumo completo em parágrafos"
}}

CONTEÚDO:
{content}
\"\"\"
    response = client.models.generate_content(model=MODEL, contents=prompt)
    return _parse_json(response.text)


def generate_quiz(content: str) -> list:
    prompt = f\"\"\"
Você é um assistente de estudos. A partir do conteúdo abaixo, gere um quiz com 5 questões de múltipla escolha.

Responda APENAS com um JSON válido, sem texto adicional, sem markdown, exatamente neste formato:
[
  {{
    "question": "texto da pergunta",
    "options": ["opção A", "opção B", "opção C", "opção D"],
    "correct_index": 0
  }}
]

O campo correct_index deve ser o índice (0-3) da opção correta dentro do array options.

CONTEÚDO:
{content}
\"\"\"
    response = client.models.generate_content(model=MODEL, contents=prompt)
    return _parse_json(response.text)


def analyze_answers(questions: list, answers: list) -> dict:
    pairs = []
    for i, (q, a) in enumerate(zip(questions, answers)):
        pairs.append(
            f"Questão {i+1}: {q['question']}\\n"
            f"Resposta correta: {q['options'][q['correct_index']]}\\n"
            f"Resposta do usuário: {q['options'][a]}"
        )
    pairs_text = "\\n\\n".join(pairs)

    prompt = f\"\"\"
Você é um tutor avaliando o desempenho de um estudante em um quiz.

Abaixo estão as questões, as respostas corretas e as respostas do estudante:

{pairs_text}

Gere um feedback construtivo e personalizado. Responda APENAS com JSON válido neste formato:
{{
  "score": <número de acertos>,
  "feedback": "feedback geral sobre o desempenho",
  "review": [
    {{
      "question": "texto da questão",
      "correct": true,
      "explanation": "explicação breve sobre a resposta"
    }}
  ]
}}
\"\"\"
    response = client.models.generate_content(model=MODEL, contents=prompt)
    return _parse_json(response.text)
""",
}

for path, content in files.items():
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

print("Verificando null bytes...")
all_ok = True
for path in files:
    with open(path, "rb") as f:
        data = f.read()
    if b"\x00" in data:
        print(f"NULL BYTES: {path}")
        all_ok = False
    else:
        print(f"OK: {path}")

if all_ok:
    print("\nTodos os arquivos estão limpos. Pode rodar o uvicorn.")