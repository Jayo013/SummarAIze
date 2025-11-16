# 🧠 SummarAIze

AI-powered note summarizer built with **Next.js**, **Express**, **Auth0**, and **DynamoDB**.  
Paste your long text — SummarAIze generates **concise, factual summaries** using Gemini or OpenAI.  
Secure login, history storage, and beautiful Tailwind styling included.

---

## 🚀 Features

✅ **AI Summarization**
- Uses **Google Gemini (1.5 / 2.0)** or **OpenAI GPT-4o-mini**
- Returns concise 5-point bullet summaries

✅ **User Authentication**
- Secure **Auth0 login/logout**
- Tokens verified in backend using JOSE

✅ **Data Persistence**
- Saves each summary per user in **AWS DynamoDB**
- Supports listing & deleting summaries

✅ **Modern UI**
- Built with **Next.js 14 (App Router)** + **Tailwind CSS v4**
- Responsive, dark-themed layout

✅ **Extras**
- Export summaries as **.txt** or **.pdf**
- Auto-resume summarize after login
- Environment-based backend URL

---

## 🧩 Tech Stack

| Layer | Technologies |
|-------|---------------|
| **Frontend** | Next.js, React, Tailwind CSS |
| **Auth** | Auth0 (SPA + JWT validation) |
| **Backend** | Node.js, Express, TypeScript |
| **AI Engine** | Google Gemini / OpenAI GPT-4o-mini |
| **Database** | AWS DynamoDB |
| **Styling** | Tailwind CSS |
| **Export** | PDF / TXT via client-side utilities |

---

## 📦 Project Structure

SummarAIze/
├── backend/
│ ├── src/
│ │ └── server.ts # Express API with Gemini/OpenAI + DynamoDB
│ ├── .env # Backend env vars
│ ├── package.json
│ └── tsconfig.json
│
├── frontend/
│ ├── app/
│ │ ├── layout.tsx # Layout + Auth0Provider wrapper
│ │ ├── page.tsx # Main UI + Summarization
│ │ └── globals.css # Tailwind base styles
│ ├── .env.local # Frontend env vars
│ ├── postcss.config.mjs
│ ├── tailwind.config.js
│ └── package.json
│
└── README.md
