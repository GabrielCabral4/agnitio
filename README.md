# Agnitio

Agnitio é uma plataforma de aprendizado baseada em IA que automatiza a transformação de conteúdos em materiais de estudo ativos.

A partir de um texto ou arquivo PDF, a aplicação gera automaticamente:

- Resumos estruturados
- Flashcards para revisão espaçada
- Quizzes para autoavaliação

## 🎯 Problema

Grande parte do tempo de estudo é gasto organizando conteúdo, e não aprendendo de fato.

## 💡 Solução

Agnitio reduz esse esforço ao gerar automaticamente materiais de revisão, permitindo foco em retenção e prática ativa.

## ⚙️ Como funciona

1. O usuário envia um texto ou PDF  
2. O sistema processa o conteúdo  
3. Modelos de IA geram:
   - Resumo condensado
   - Flashcards (pergunta/resposta)
   - Quiz com múltiplas questões  
4. Os resultados são armazenados para consultas futuras  

## 🧱 Arquitetura (visão geral)

- Backend: API REST (FastAPI)
- Processamento de documentos: parsing de PDF + limpeza de texto
- Camada de IA: integração com modelos de linguagem
- Persistência: PostgreSQL
- Frontend: interface web (React/Next.js)

## 📈 Possíveis evoluções

- Sistema de repetição espaçada (SRS)
- Personalização por nível do usuário
- Análise de desempenho em quizzes
- Integração com plataformas externas (Notion, Anki, etc.)

## 📌 Status do projeto

MVP em desenvolvimento

## 🤝 Contribuição

Pull requests são bem-vindos. Para mudanças maiores, abra uma issue antes para discussão.
