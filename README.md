# BioSchedule - Interface de Agendamento (Front-end)

![React](https://img.shields.io/badge/React_19-UI-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=for-the-badge&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Styling-06B6D4?style=for-the-badge&logo=tailwindcss)
![Axios](https://img.shields.io/badge/Axios-HTTP_Client-5A29E4?style=for-the-badge&logo=axios)

A interface de usuário (UI) do sistema **BioSchedule** é uma aplicação web **interativa e responsiva** (SPA) para um SaaS de agendamento de clínicas de estética. Operando de forma **desacoplada**, ela consome a API do back-end e atende dois públicos: a equipe da clínica, por um painel administrativo completo, e o paciente, por um portal público de autoatendimento.

## 💻 Stack Tecnológica

A interface foi construída sobre o ecossistema TypeScript, com foco em performance e componentização:
*   **Biblioteca de UI:** React 19.
*   **Build Tool:** Vite (build veloz e hot-reload).
*   **Estilização:** Tailwind CSS (responsivo, Mobile-First).
*   **Consumo de API:** Axios (com interceptors de autenticação).
*   **Apoio:** React Router 7 (rotas), Recharts (gráficos) e SweetAlert2 (alertas).

## 🎨 Destaques de UI/UX e Arquitetura

A interface foi pensada para ser limpa, reutilizável e fácil de manter:
*   **Componentização:** a UI é dividida em componentes reaproveitáveis, mantendo o código organizado e simples de evoluir.
*   **Design Responsivo (Mobile-First):** com Tailwind CSS, o layout se adapta de telas de celular a desktops.
*   **Consumo Eficiente da API:** uma única instância do Axios centraliza as chamadas; *interceptors* anexam o token JWT automaticamente e tratam sessões expiradas (redirecionando ao login em respostas `401`).
*   **Gerenciamento de Estado:** o estado e a sessão do usuário são controlados com os recursos nativos do React, persistindo o login localmente entre as visitas.

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz da pasta com o seguinte formato:

```env
# URL base da API do back-end
VITE_API_URL="http://localhost:3000"
```

*(No Vite, apenas variáveis com o prefixo `VITE_` ficam acessíveis no cliente. Sem essa variável, a aplicação usa `http://localhost:3000` como padrão.)*

## 🚀 Passo a Passo de Execução

Siga as instruções abaixo para executar a interface localmente (de preferência com o back-end já rodando):

**1. Instalar Dependências:** instale os pacotes do ecossistema:
```bash
npm install
```

**2. Iniciar o Servidor de Desenvolvimento:** suba a aplicação:
```bash
npm run dev
```

A interface estará operante em `http://localhost:5173` (porta padrão do Vite).
