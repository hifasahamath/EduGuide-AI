# EduGuide AI 🎓🤖

> **Smart Higher Education Guidance & AI-Powered Course Discovery Platform for Sri Lanka and Global Students.**

EduGuide AI is an intelligent, full-stack educational advisory platform designed to help students discover higher education courses, university entry requirements, fee structures, and career pathways. Powered by **Retrieval-Augmented Generation (RAG)**, **Multi-LLM Architecture (Google Gemini, OpenAI, Anthropic Claude, xAI Grok)**, and a comprehensive **9-Section Enterprise Admin Governance Panel**.

---

## 🌟 Key Features

### 👨‍🎓 Student Chatbot & Guidance Portal
- **Context-Aware AI Chatbot**: Real-time, multi-turn conversation with memory of student course preferences, degree levels, and budget constraints.
- **RAG Knowledge Retrieval**: Instantly answers queries using embedded official university documents, course catalogs, and admission guidelines.
- **Guest Exploration Mode**: Instant AI chat access without registration or login. Guest sessions are completely temporary with zero database footprint.
- **Direct WhatsApp Advisor**: One-click WhatsApp connect with the Education Advisor / Developer for human academic consultations.
- **Interactive Chat Sidebar**: Easily manage past conversations, pin key sessions, rename chat topics, or start a new chat session.
- **Light Theme Authentication**: Clean, high-contrast **Login** and **Register** pages with **Continue with Google** OAuth integration and password confirmation validation.

---

### 🛡️ 9-Section Enterprise Admin Panel
A high-contrast, human-coded administrative dashboard built for university administrators and platform managers:

1. 📊 **Dashboard**: Real-time platform pulse, 30s auto-refresh, active user statistics, quick navigation, and system health status.
2. 📚 **Manage Courses**: Search, filter by degree level or faculty, course CRUD operations, and CSV/JSON bulk import modal.
3. ❓ **Manage FAQ**: FAQ creation with AI intent classification (`course_search`, `fee_inquiry`, `eligibility`), synonym tags, and interactive accordions.
4. 🧠 **Train Chatbot**: Upload knowledge documents (PDF, DOCX, CSV, TXT) with chunk inspection and unanswered Q&A training.
5. 👥 **User Management**: Registered user table, student vs admin role badges (`STUDENT`, `ADMIN`), active status filtering, edit modal, and account block/unblock controls.
6. 💬 **Chat History**: Complete audit log of student chat sessions, transcript modal viewer, date range filters, and CSV export.
7. 💳 **Subscription Plans**: Tier management, monthly/annual pricing, feature lists, free tier toggles, and high-contrast card controls.
8. 📈 **Deep Analytics**: Real-time platform metrics, 7-day chat volume trends, 24-hour peak usage hours, AI accuracy %, and fallback rate tracking.
9. 👤 **Admin Profile & Settings**: Manage admin credentials, display name, avatar, and security preferences.

---

## 🛠️ Technology Stack

### **Frontend**
- **Core**: React 19, Vite 8
- **Styling**: Tailwind CSS (Light & Dark theme system)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Data Visualization**: Recharts
- **Markdown Rendering**: React-Markdown

### **Backend & AI**
- **Runtime**: Node.js, Express 5
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Supabase Auth with Google OAuth)
- **AI & RAG Pipeline**: Google Gemini API (`@google/genai`), OpenAI API, Anthropic SDK, Vector Embeddings, Semantic Chunking
- **HTTP Client**: Axios

---

## 📁 Repository Structure

```
EduGuide-Ai/
├── client/                      # React + Vite Frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── admin/           # Admin Sidebar & Header layout
│   │   │   └── chatgpt/         # MainChat, ChatSidebar, ChatBubble components
│   │   ├── contexts/            # ThemeContext & AuthContext
│   │   ├── lib/                 # Supabase client initialization
│   │   ├── pages/               # Application Pages
│   │   │   ├── admin/           # Dashboard, Courses, Training, Users, Analytics, Profile, FAQ, Subscriptions
│   │   │   ├── Login.jsx        # Login page + Guest exploration
│   │   │   └── Register.jsx     # Register page + Guest exploration
│   │   └── services/            # API services & endpoint handlers
│   └── package.json
│
├── server/                      # Node.js + Express Backend
│   ├── config/                  # Supabase, Gemini & LLM configurations
│   ├── controllers/             # Express route controllers
│   ├── db/migrations/           # SQL migration scripts (001_initial_schema.sql)
│   ├── models/                  # Database models (Chat, Course, FAQ, Training, User, Analytics)
│   ├── routes/                  # Express API endpoints
│   ├── services/                # RAG, Embedding, NLP & Context services
│   └── server.js                # Express entry point
│
├── api/                         # Vercel Serverless Function Bridge
│   └── index.js                 # Express serverless handler
│
├── vercel.json                  # Vercel deployment & routing configuration
├── .env.example                 # Environment variables template
├── package.json                 # Monorepo root scripts
└── README.md                    # Project documentation
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Supabase Account**: For PostgreSQL database, vector extensions, and Auth

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/hifasahamath/EduGuide-AI.git
cd EduGuide-AI
```

---

### Step 2: Install Dependencies
Install all root, client, and server dependencies with a single command:
```bash
npm run install:all
```

---

### Step 3: Configure Environment Variables

Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```

Open `.env` and fill in your credentials:
```env
# Client Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Server Secrets
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key

# Server Config
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

### Step 4: Run Database Migrations
Execute the SQL migration script located at `server/db/migrations/001_initial_schema.sql` inside your **Supabase SQL Editor** to set up all required tables (`profiles`, `courses`, `chat_sessions`, `chat_messages`, `training_data`, `documents`, `subscription_plans`, `faqs`).

---

### Step 5: Start Development Servers

Run both the server and client concurrently from the root directory:

```bash
# Terminal 1: Backend Server
npm run dev:server

# Terminal 2: Frontend Client
npm run dev:client
```

Open your browser and navigate to `http://localhost:5173`.

---

## 🌐 Deploying to Vercel (1-Click Fullstack)

EduGuide AI is pre-configured with `vercel.json` and `api/index.js` for single-deployment fullstack hosting on Vercel:

1. Push your repository to GitHub.
2. Log into **[vercel.com](https://vercel.com)** and click **"Add New..." ➡️ "Project"**.
3. Import your `EduGuide-AI` repository.
4. Set the **Environment Variables** in the Vercel dashboard:
   - `VITE_API_URL`: `/api`
   - `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `your_anon_key`
   - `SUPABASE_SERVICE_ROLE_KEY`: `your_service_role_key`
   - `GEMINI_API_KEY`: `your_gemini_api_key`
   - `NODE_ENV`: `production`
   - `ALLOWED_ORIGINS`: `*`
5. Click **"Deploy"**!

> [!TIP]
> **Supabase Auth Redirect URL**:
> In your Supabase Dashboard (`Authentication -> URL Configuration`), add your Vercel deployment URL (e.g. `https://eduguide-ai.vercel.app/**`) under **Redirect URLs** for seamless authentication.

---

## 🔐 Google OAuth Setup (Optional)
To enable "Continue with Google" on the Login & Register pages:
1. Go to your **Supabase Dashboard** $\rightarrow$ **Authentication** $\rightarrow$ **Providers**.
2. Select **Google** and enable it.
3. Enter your **Google Client ID** and **Client Secret** obtained from the [Google Cloud Console](https://console.cloud.google.com/).
4. Add your domain (`http://localhost:5173` and `https://your-app.vercel.app`) to authorized redirect URIs.

---

## 📜 License
This project is licensed under the **MIT License**.
