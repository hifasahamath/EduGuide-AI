# EduGuide AI 🎓🤖

> **Smart Higher Education Guidance & AI-Powered Course Discovery Platform for Sri Lanka and Global Students.**

EduGuide AI is an intelligent, full-stack educational advisory platform designed to help students discover higher education courses, university entry requirements, fee structures, and career pathways. Powered by **Retrieval-Augmented Generation (RAG)**, **Google Gemini AI**, and a comprehensive **9-Section Enterprise Admin Governance Panel**.

---

## 🌟 Key Features

### 👨‍🎓 Student Chatbot & Guidance Portal
- **Context-Aware AI Chatbot**: Real-time, multi-turn conversation with memory of student course preferences, degree levels, and budget constraints.
- **RAG Knowledge Retrieval**: Instantly answers queries using embedded official university documents, course catalogs, and admission guidelines.
- **Interactive Chat Sidebar**: Easily manage past conversations, pin key sessions, rename chat topics, or start a new chat session.
- **Light Theme Authentication**: Clean, high-contrast **Login** and **Register** pages with **Continue with Google** OAuth integration.

---

### 🛡️ 9-Section Enterprise Admin Panel
A high-contrast, human-coded administrative dashboard built for university administrators and platform managers:

1. 📊 **Dashboard**: Real-time platform pulse, 30s auto-refresh, active user statistics, quick navigation, and system health status.
2. 📚 **Manage Courses**: Search, filter by degree level or faculty, course CRUD operations, and CSV/JSON bulk import modal.
3. ❓ **Manage FAQ**: FAQ creation with AI intent classification (`course_search`, `fee_inquiry`, `eligibility`), synonym tags, and interactive accordions.
4. 🧠 **Train Chatbot**: Upload knowledge documents (PDF, DOCX, CSV, TXT) with **3-in-a-row group card layout**, chunk inspection, and unanswered Q&A training.
5. 👥 **User Management**: Registered user table, student vs admin role badges (`STUDENT`, `ADMIN`), active status filtering, edit modal, and account block/unblock controls.
6. 💬 **Chat History**: Complete audit log of student chat sessions, transcript modal viewer, date range filters, and CSV export.
7. 💳 **Subscription Plans**: Tier management, monthly/annual pricing, feature lists, free tier toggles, and high-contrast card controls.
8. 📈 **Deep Analytics**: Real-time platform metrics, 7-day chat volume trends, 24-hour peak usage hours, AI accuracy %, and fallback rate tracking.
9. 👤 **Admin Profile & Settings**: Manage admin credentials, display name, avatar, and security preferences.

---

## 🛠️ Technology Stack

### **Frontend**
- **Core**: React 18, Vite
- **Styling**: Tailwind CSS (Custom enterprise theme system supporting Light & Dark modes)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Data Visualization**: Recharts

### **Backend & AI**
- **Runtime**: Node.js, Express.js
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Supabase Auth with Google OAuth)
- **AI & RAG Pipeline**: Google Gemini API, Vector Embeddings, Custom Semantic Chunking (`EmbeddingService`)
- **HTTP Client**: Axios

---

## 📁 Repository Structure

```
EduGuide-Ai/
├── client/                      # React + Vite Frontend
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   │   ├── admin/           # Admin Sidebar & Header layout
│   │   │   └── chatgpt/         # MainChat, ChatSidebar, Bubble components
│   │   ├── contexts/            # ThemeContext & AuthContext
│   │   ├── lib/                 # Supabase client initialization
│   │   ├── pages/               # Application Pages
│   │   │   ├── admin/           # Dashboard, Courses, Training, Users, ChatHistory, SubscriptionPlans, Analytics, Profile, FAQ
│   │   │   ├── Login.jsx        # Light theme login page + Google OAuth
│   │   │   └── Register.jsx     # Light theme register page + Google OAuth
│   │   └── services/            # API services & endpoint handlers
│   └── package.json
│
├── server/                      # Node.js + Express Backend
│   ├── config/                  # Supabase & Gemini configurations
│   ├── controllers/             # Express route controllers
│   ├── db/migrations/           # SQL migration scripts (001_initial_schema.sql)
│   ├── models/                  # Database models (Chat, Course, FAQ, Training, User, Analytics)
│   ├── routes/                  # Express API endpoints
│   ├── services/                # RAG, Embedding, NLP & Context services
│   └── server.js                # Express entry point
│
└── README.md                    # Project documentation
```

---

## 🚀 Getting Started

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

#### Install Client Dependencies:
```bash
cd client
npm install
cd ..
```

#### Install Server Dependencies:
```bash
cd server
npm install
cd ..
```

---

### Step 3: Configure Environment Variables

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-google-gemini-api-key
JWT_SECRET=your-jwt-secret-key
```

Create a `.env` file inside the `client/` directory:

```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:5000/api
```

---

### Step 4: Run Database Migrations
Execute the SQL migration script located at `server/db/migrations/001_initial_schema.sql` inside your **Supabase SQL Editor** to set up all required tables (`profiles`, `courses`, `chat_sessions`, `chat_messages`, `training_data`, `documents`, `subscription_plans`, `faqs`).

---

### Step 5: Start Development Servers

#### Start Backend Server (Terminal 1):
```bash
cd server
npm run dev
```

#### Start Frontend Client (Terminal 2):
```bash
cd client
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## 🔐 Google OAuth Setup (Optional)
To enable "Continue with Google" on the Login & Register pages:
1. Go to your **Supabase Dashboard** $\rightarrow$ **Authentication** $\rightarrow$ **Providers**.
2. Select **Google** and enable it.
3. Enter your **Google Client ID** and **Client Secret** obtained from the [Google Cloud Console](https://console.cloud.google.com/).
4. Add `http://localhost:5173` to authorized redirect URIs.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/hifasahamath/EduGuide-AI/issues).

---

## 📜 License
This project is licensed under the **MIT License**.
