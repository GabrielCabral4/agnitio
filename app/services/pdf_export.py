from weasyprint import HTML
from io import BytesIO
from app.models.session import StudySession, StudyMaterial, QuizAttempt

def generate_session_pdf(session: StudySession):
    material = session.material
    if not material:
        raise ValueError("Session has no generated material to export.")

    last_attempt = None
    if session.quiz_attempts:
        last_attempt = sorted(session.quiz_attempts, key=lambda x: x.created_at, reverse=True)[0]

    html_content = f"""
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
        <meta charset="UTF-8">
        <style>
            @page {{
                size: A4;
                margin: 2cm;
            }}
            body {{
                font-family: 'Helvetica', 'Arial', sans-serif;
                color: #334155;
                line-height: 1.6;
                margin: 0;
                padding: 0;
            }}
            .header {{
                border-bottom: 3px solid #6366f1;
                padding-bottom: 20px;
                margin-bottom: 30px;
                display: flex;
                justify-content: space-between;
                align-items: baseline;
            }}
            .title {{
                font-size: 24pt;
                font-weight: bold;
                color: #1e293b;
                margin: 0;
            }}
            .subtitle {{
                font-size: 10pt;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 1px;
            }}
            .snapshot {{
                font-size: 10pt;
                text-align: right;
                color: #6366f1;
                font-weight: 500;
            }}
            h2 {{
                font-size: 18pt;
                color: #1e293b;
                border-left: 5px solid #6366f1;
                padding-left: 15px;
                margin-top: 30px;
                margin-bottom: 15px;
            }}
            .summary-box {{
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                white-space: pre-wrap;
                font-size: 11pt;
            }}
            .card-grid {{
                display: block;
            }}
            .card {{
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
                page-break-inside: avoid;
            }}
            .card-label {{
                font-weight: bold;
                color: #6366f1;
                font-size: 9pt;
                text-transform: uppercase;
                margin-bottom: 5px;
                display: block;
            }}
            .card-content {{
                font-size: 11pt;
            }}
            .quiz-item {{
                margin-bottom: 20px;
                page-break-inside: avoid;
                border-bottom: 1px solid #f1f5f9;
                padding-bottom: 10px;
            }}
            .quiz-q {{
                font-weight: bold;
                font-size: 11pt;
                color: #1e293b;
            }}
            .quiz-a {{
                font-size: 11pt;
                color: #059669;
                margin-top: 5px;
            }}
            .footer {{
                position: fixed;
                bottom: 0;
                width: 100%;
                text-align: center;
                font-size: 9pt;
                color: #94a3b8;
                border-top: 1px solid #e2e8f0;
                padding-top: 10px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <p class="subtitle">{session.source_type}</p>
                <h1 class="title">{session.title}</h1>
            </div>
            <div class="snapshot">
                {f"Último Quiz: {last_attempt.score}%" if last_attempt else "Guia de Estudos"}
            </div>
        </div>

        <section>
            <h2>Resumo</h2>
            <div class="summary-box">{material.summary}</div>
        </section>

        <section>
            <h2>Flashcards</h2>
            <div class="card-grid">
                {"".join([f'''
                <div class="card">
                    <span class="card-label text-rose-500">Frente</span>
                    <div class="card-content">{card['front']}</div>
                    <div style="margin-top: 10px;">
                        <span class="card-label">Verso</span>
                        <div class="card-content">{card['back']}</div>
                    </div>
                </div>
                ''' for card in material.flashcards])}
            </div>
        </section>

        <section>
            <h2>Banco de Questões</h2>
            {"".join([f'''
            <div class="quiz-item">
                <div class="quiz-q">Pergunta: {q['question']}</div>
                <div class="quiz-a">Resposta Correta: {q['options'][q['correct_index']]}</div>
            </div>
            ''' for q in last_attempt.questions]) if last_attempt else "<p>Faça o quiz para ver as questões aqui.</p>"}
        </section>

        <div class="footer">
            Gerado por Agnitio AI • {session.created_at.strftime('%d/%m/%Y')}
        </div>
    </body>
    </html>
    """

    pdf_bytes = HTML(string=html_content).write_pdf()
    return pdf_bytes
