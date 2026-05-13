# Agnitio — Inteligência Artificial para Estudos Ativos 🧠

Agnitio é uma plataforma de aprendizado de alta performance que utiliza Inteligência Artificial para transformar conteúdos passivos (textos e PDFs) em materiais de estudo ativos, combatendo a curva do esquecimento e otimizando a retenção de conhecimento.

## 🚀 Funcionalidades Principais

### 🤖 Geração Inteligente de Materiais
- **Transformação de Conteúdo**: Upload de PDFs ou colagem de textos que são processados por LLMs para extração de conceitos chave.
- **Resumos Estruturados**: Geração de resumos condensados e organizados para revisão rápida.
- **Flashcards Automáticos**: Criação de pares de pergunta/resposta focados nos pontos mais importantes do conteúdo.

### 📈 Sistema de Retenção e Performance
- **Repetição Espaçada (SRS)**: Implementação de algoritmo de *Spaced Repetition System* para agendar a revisão de flashcards com base na dificuldade e performance do usuário.
- **Quizzes Adaptativos**: Geração de testes de múltipla escolha com feedback imediato.
- **Análise de Desempenho**: Monitoramento de progresso com estatísticas de memorização (cards novos, pendentes e consolidados).
- **Feedback da IA**: Análise personalizada do desempenho no quiz, sugerindo pontos de melhoria.

### 🛠️ Ferramentas de Produtividade
- **Exportação para PDF**: Geração de documentos PDF com o conteúdo da sessão para consulta offline.
- **Gestão de Sessões**: Organização de diferentes temas de estudo em sessões independentes.
- **Autenticação Segura**: Sistema de contas para persistência de progresso e sincronização de dados.

## 🛠️ Stack Tecnológica

### Backend
- **Linguagem**: Python 3.11+
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (API REST de alta performance)
- **IA**: [Google Gemini](https://ai.google.dev/) (`gemini-2.5-flash`) via `google-genai`
- **Banco de Dados**: PostgreSQL (via [Supabase](https://supabase.com/))
- **ORM & Migrations**: SQLAlchemy 2.0 e Alembic
- **Gerenciador de Pacotes**: `uv` (estatisticamente mais rápido que pip/poetry)

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Componentes & Ícones**: Lucide React, Sonner (Toasts)

## 📐 Arquitetura e Decisões Técnicas

O projeto foi desenhado focando em robustez e experiência do usuário:

- **Structured Output (LLM)**: Implementação de prompts rigorosos e validação via Pydantic para garantir que a IA retorne JSONs previsíveis, eliminando erros de parsing no frontend.
- **Estratégia de Dados**: Uso de colunas JSON no PostgreSQL para armazenar flashcards e questões, equilibrando a flexibilidade de esquemas não-relacionais com a consistência do SQL.
- **Algoritmo SRS**: Implementação de lógica de repetição espaçada para otimizar o tempo de estudo, focando nos cards com maior probabilidade de esquecimento.
- **UX/UI Modern**: Interface responsiva com animações fluidas, estados de loading granulares e feedback instantâneo.

## 🎯 Desafios Técnicos Superados

- **Consistência da IA**: Superação da natureza não-determinística de LLMs através de *few-shot prompting* e validação de esquemas.
- **Performance de PDF**: Implementação de extração de texto eficiente para lidar com documentos extensos sem degradar a performance da API.
- **Sincronização de Estado**: Gestão de estado complexa no frontend para lidar com a alternância entre visualização de cards, quizzes e estatísticas em tempo real.

## 🛠️ CI/CD e Qualidade de Código

Para garantir a estabilidade do projeto e a qualidade do código, implementei um pipeline de **Integração Contínua (CI)** via GitHub Actions:

- **Backend**: Execução automática de testes de integração com `pytest` em cada push ou pull request.
- **Frontend**: Verificação de tipagem (TypeScript) e linting automático para garantir consistência e evitar bugs em runtime.
- **Validação**: Bloqueio de merges que quebrem os testes ou a build do frontend.

## ⚙️ Como Executar o Projeto


### Pré-requisitos
- Python 3.11+
- Node.js 18+
- Uma chave de API do Google Gemini

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/agnitio.git
   cd agnitio
   ```

2. **Configuração do Backend**
   ```bash
   # Instale o uv
   curl -LsSf https://astral.sh/uv/install.sh | sh

   # Instale as dependências
   uv sync

   # Configure as variáveis de ambiente no arquivo .env
   # DATABASE_URL=...
   # GEMINI_API_KEY=...

   # Execute as migrações do banco
   uv run alembic upgrade head

   # Inicie o servidor
   uv run uvicorn app.main:app --reload
   ```

3. **Configuração do Frontend**
   ```bash
   cd web
   npm install

   # Configure .env.local
   # NEXT_PUBLIC_API_URL=http://localhost:8000

   npm run dev
   ```

## 📌 Status do Projeto
✅ MVP Completo | 🔄 Em evolução (Novas integrações de IA e melhorias de UX)

---
**Engenharia de Software**, **Integração de LLMs** e **Desenvolvimento Fullstack**.
