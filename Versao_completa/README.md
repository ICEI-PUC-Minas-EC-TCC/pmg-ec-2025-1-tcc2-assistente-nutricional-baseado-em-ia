# 🥗 Sistema Nutricional com IA e Atendimento em Tempo Real

Este projeto integra três módulos principais:

- **Frontend em React com TypeScript** para atendimento nutricional em tempo real (áudio, vídeo e tela)
- **Backend com FastAPI (WebSocket)** para comunicação com a API Gemini via WebSocket
- **Aplicativo Streamlit com Gemini + CNN** para identificação alimentar, geração de dietas e receitas personalizadas

---

## ⚙️ Estrutura do Projeto

```
.
├── frontend/                   # Interface React (Atendimento Nutricional em Tempo Real)
│   └── gemini-playground.tsx
├── backend/                    # Backend com FastAPI + WebSocket (Gemini)
│   └── main.py
├── app_nutricional_offmulti.py # Streamlit com interface nutricional inteligente
├── .venv310/                   # Ambiente virtual Python 3.10
├── start.ps1                   # Script para iniciar tudo com um clique
├── FV.h5                       # Modelo de classificação de frutas/vegetais
├── frutas_vegetais_nutrientes_completo.xlsx  # Base nutricional offline
├── app.db                      # Banco de dados SQLite (usuários e histórico)
```

---

## 🚀 Como Executar o Projeto

### Requisitos

- **Python 3.10+**
- **Node.js v18+**
- **PowerShell** (para Windows)
- **Google API Key (Gemini)**

---

### Passo a passo (modo automático)

1. Clone o projeto:

```bash
git clone https://github.com/ICEI-PUC-Minas-EC-TCC/pmg-ec-2025-1-tcc2-assistente-nutricional-baseado-em-ia
cd pmg-ec-2025-1-tcc2-assistente-nutricional-baseado-em-ia
cd Versao_completa
```

2. Execute o script:

```powershell
.\start.ps1
```

> Ele abrirá 3 janelas:
> - **Streamlit** com `app_nutricional_offmulti.py`
> - **Frontend React** em `localhost:3000`
> - **Backend WebSocket** com `main.py`

---

## 🧠 Funcionalidades

### 📱 `Streamlit` – Interface Nutricional Inteligente

- Login/Cadastro de usuários com dados de saúde
- Identificação de frutas e vegetais via imagem (modelo CNN `FV.h5`)
- Estimativa calórica com scraping + base nutricional local
- Geração de receitas com base em imagem ou lista de compras
- Chat multimodal com IA Gemini (texto + imagem)
- Histórico completo de conversas (armazenado em `SQLite`)
- Suporte a restrições alimentares (vegano, diabético etc.)
- Recomendação de receitas baseadas em perfil

### 🌐 `Frontend React` – Atendimento em Tempo Real

- Chat com IA Gemini via WebSocket (`localhost:8000/ws/{clientId}`)
- Atendimento via:
  - 🎤 Áudio (microfone)
  - 📹 Vídeo (câmera)
  - 🖥️ Compartilhamento de tela
- Exibição do texto da conversa em tempo real
- Escolha da voz (Puck, Charon, Kore, etc.)
- Gatilho de busca no Google (opcional)
- Interface elegante com Tailwind + ShadCN

### 🧩 `Backend FastAPI` – Gateway WebSocket Gemini

- Interpretação de mensagens do frontend:
  - Tipo: `audio`, `image`, `text`, `config`
- Conversão e envio para a API Gemini
- Recepção de resposta (áudio e texto)
- Retorno em tempo real para o frontend via WebSocket
- Fechamento e controle de múltiplas sessões por `client_id`

---

## 💡 Tecnologias

- 🧠 Gemini API (via Google Generative Language)
- 🧪 Streamlit (análise nutricional)
- 🤖 TensorFlow / Keras
- ⚛️ React + TypeScript
- 🌐 FastAPI (WebSocket)
- 🐍 Python 3.10
- 📦 Node.js v18+
- 🗃️ SQLite + Pandas
- 🎙️ Web Audio API

---

## 🛠️ Execução Manual (caso deseje)

### 1. Streamlit

```powershell
.\.venv310\Scripts\Activate.ps1
streamlit run app_nutricional_offmulti.py
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Backend

```bash
cd backend
python main.py
```

---

## 🔐 Ambiente (.env)

Crie um arquivo `.env` com sua chave Gemini:

```
GOOGLE_API_KEY=coloque_sua_chave_aqui
GEMINI_API_KEY=coloque_sua_chave_aqui
```

---

## 📋 Créditos
 
Autores: **Igor Cesar,Ivan Oliveira,Mariana Galvão e Yasmine Silva**

---

## 📄 Licença

Este projeto é de uso educacional. Consulte o arquivo LICENSE para mais detalhes.
