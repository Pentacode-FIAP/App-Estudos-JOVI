# JOVI Cam — câmera inteligente com app de estudos

Projeto desenvolvido pelo grupo **Pentacode** para o **Challenge FIAP x JOVI Mobile (2026)**. O grupo ficou entre os **10 melhores de mais de 120 grupos** do curso.

O Challenge é uma avaliação anual da FIAP feita em parceria com uma empresa. No kickoff, um representante da empresa apresenta problemas reais da marca. Ao longo de 4 sprints, cada grupo propõe, prototipa e apresenta uma solução para a banca.

## O problema

A JOVI Mobile apresentou dois problemas ligados entre si:

1. **Câmera excelente, mas difícil de usar.** O hardware das câmeras dos aparelhos JOVI é tecnicamente muito bom. Já a interface tem mais de 15 modos e configurações complexas. O usuário comum não consegue aproveitar o que o aparelho entrega, e a experiência fica ruim.
2. **Nenhum diferencial para o público-alvo.** A marca quer alcançar estudantes em tempo integral, mas o aparelho não oferecia nada pensado para a rotina de estudo.

## A solução

Juntamos os dois problemas em um único produto: uma **câmera simplificada, guiada por IA, integrada a um app de estudos**.

**Câmera (JOVI Cam)**

- **Modo IA Auto** como ponto de partida: a câmera identifica o ambiente e escolhe o modo ideal, sem o usuário precisar entender dezenas de opções.
- **Poucos modos visíveis** (IA, Estudo, Foto, Noite, Vídeo), com navegação por toque ou arrasto.
- **Modo Estudo:** o estudante fotografa o caderno ou a lousa, a foto vai para a galeria de estudos e o texto é extraído com IA.
- **Onboarding curto**, que apresenta os modos no primeiro uso.

**App de estudos**

- **Resumos com IA:** transforma fotos de anotações ou texto colado em resumos revisáveis e editáveis.
- **Exercícios:** questões de múltipla escolha geradas a partir dos resumos, com quantidade e nível ajustáveis, correção imediata, dicas antes de responder e explicação do erro.
- **Simulados:** prova com tempo, nota final e revisão das questões.
- **Plano para provas:** no calendário, o estudante cadastra a prova e recebe um plano com revisão, treino e simulado até a véspera, priorizando os conteúdos com mais erros.
- **Progresso:** sequência de estudos, meta diária, gráficos e uma fila de revisão dos erros recentes.
- **Chat IA:** tutor para tirar dúvidas sobre o material salvo.

## Tecnologias

- **React 18 + TypeScript**, com build em **Vite**
- **Dexie / IndexedDB** para guardar os dados no navegador, sem backend
- **Google Gemini** para OCR, resumos, questões, simulados, dicas e chat
- **Vitest** para os testes da lógica de geração, plano de prova e progresso

O app roda no navegador dentro de uma moldura de celular, simulando a experiência no aparelho.

## Como executar

Requisitos: Node.js 18+ e uma chave da API do Google Gemini.

```sh
npm install
```

Crie um arquivo `.env` na raiz:

```env
VITE_GEMINI_API_KEY=sua_chave_aqui
```

Inicie o projeto:

```sh
npm run dev
```

O Vite mostra a URL no terminal (normalmente `http://localhost:5173`).

Outros comandos:

```sh
npm test         # testes
npm run build    # build de produção
npm run preview  # pré-visualiza o build
```

Para uma demonstração rápida, a tela **Progresso** permite preencher o app com dados de exemplo.

## Estrutura

```
src/
├── features/
│   ├── camera/       # JOVI Cam: onboarding, modos, captura e OCR
│   ├── estudar/      # resumos (foto ou texto)
│   ├── exercicios/   # séries de questões, dicas e fila de revisão
│   ├── simulado/     # configuração, prova e resultado
│   ├── calendario/   # eventos e plano de preparação para provas
│   ├── progresso/    # dashboard, metas e insights
│   ├── galeria/      # fotos salvas
│   └── chat/         # tutor com IA
├── components/       # componentes de interface compartilhados
└── lib/              # banco local, integração Gemini e regras de negócio
```

## Limitações

- Os dados ficam só no navegador: não há conta de usuário nem sincronização.
- Revisão espaçada e retomada de simulado interrompido ficaram fora do escopo. Finalize o simulado antes de sair para registrar as respostas.

## Equipe Pentacode — FIAP, turma 1ESPH

| Integrante        | RM     |
| ----------------- | ------ |
| Arthur Jircik     | 570754 |
| Andre Luiz        | 573575 |
| Felipe Garcia     | 571741 |
| Guilherme Amorim  | 569024 |
| Matheus Marcelino | 571472 |
