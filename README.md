# Hirenix AI 🚀
### Enterprise-grade AI-powered Recruitment, Interactive Skill Gap Analysis, and Smart Mock Evaluation Platform

Hirenix AI is a premium, feature-rich web application designed to help candidates prepare for technical interviews and allow organizations to review performance metrics with automated AI evaluations. It features a modern, responsive, glassmorphic dark-theme design tailored for visual excellence.

---

## 🌟 Key Features

### 1. Adaptive AI Mock Interviews
- **Dynamic Difficulty**: Real-time AI adapts interview question difficulty dynamically based on the depth of the candidate's answers.
- **Voice Response Support**: High-performance microphone input integration for hands-on, natural interviewing.
- **View Critique**: Detailed post-interview breakdown highlighting performance scores, grammatical critique, and specific answers feedback.
- **Download PDF Reports**: Generate and download comprehensive PDF performance reports directly to your local system upon completing an interview.

### 2. Smart ATS & Resume Keyword Alignment
- **Resume Scanner**: Parse and benchmark resume text against specific Job Descriptions (JD).
- **Skill Gap Mapping**: Identify missing keywords and technical requirements automatically.

### 3. Curated Learning Roadmaps (YouTube Integration)
- **YouTube Classes Integration**: Dynamically links detected skill gaps to highly popular, active technical tutorials:
  - **Docker**: *TechWorld with Nana's Docker Tutorial for Beginners [FULL COURSE]*
  - **Kubernetes**: *TechWorld with Nana's Kubernetes Tutorial for Beginners [FULL COURSE]*
  - **DevOps & Cloud**: *freeCodeCamp's DevOps Engineering Course*
  - **React & Frontend**: *freeCodeCamp's React JS Full Course for Beginners*
  - **AI & Large Language Models**: *Andrej Karpathy's Intro to Large Language Models*
  - **SQL & Databases**: *freeCodeCamp's SQL Tutorial for Beginners*

### 4. Admin Management Console
- **Dedicated Admin Login**: Locked down to a single secure administrator account:
  - **Email**: `aicopilotplatform@gmail.com`
  - **Password**: `aicopilotplatform@123`
- **User Audits & Config Controls**: Track and manage active users, customize liveness scores, change settings, and safely clean/clear test accounts.

---

## 🛠️ Technology Stack
- **Frontend**: React (Vite, Vanilla HSL CSS variables, glassmorphic widgets, dynamic theme configurations, Lucide Icons)
- **Backend**: Node.js + Express (Modular REST API controllers)
- **Database**: PostgreSQL (Hosted on Supabase)
- **Email Dispatch**: Nodemailer SMTP integration for secure registration and authentication OTPs

---

## 💻 Local Setup & Development

### 1. Prerequisites
- **Node.js** (v16+) installed.
- **PostgreSQL Database** (e.g. Supabase connection string).
- **SMTP credentials** for sending verification OTPs (Gmail App Passwords or Ethereal test mailer).

### 2. Clone and Install Dependencies
In the root directory, run the automated installation script:
```bash
npm run install-all
```
This command installs the root package dependencies, backend dependencies, and frontend packages simultaneously.

### 3. Setup Environment Variables
Configure the environment files before starting the services:

#### Backend Config (`backend/.env`):
```env
PORT=5000
DATABASE_URL="your-postgresql-supabase-connection-string"
JWT_SECRET="your-jwt-signing-secret"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER="aicopilotplatform@gmail.com"
SMTP_PASS="your-smtp-app-password"
```

#### Frontend Config (`frontend/.env`):
```env
VITE_API_URL="http://localhost:5000"
```

### 4. Run Development Servers
Start both servers concurrently using:
```bash
npm run dev
```
- Frontend will open on: **[http://localhost:5173](http://localhost:5173)**
- Backend will run on: **[http://localhost:5000](http://localhost:5000)**

---

## 🚀 Production Deployment

To deploy Hirenix AI to production (e.g., Render, Railway, Vercel, Netlify):

### 1. Database Deployment (Supabase)
- Host your PostgreSQL database on [Supabase](https://supabase.com/).
- Run the schema setup from [backend/config/schema.sql](file:///c:/Users/kasar/AI_Interview_Copilot/backend/config/schema.sql) if initializing a fresh database instance.

### 2. Backend Deployment (Render or Railway)
- **Root Directory**: `backend` (or build from the project root pointing to `backend/server.js`).
- **Start Command**: `npm start`
- **Environment Variables**:
  - Make sure to define all variables from `backend/.env` (especially `DATABASE_URL`, `JWT_SECRET`, and your SMTP credentials) on your host provider's dashboard.

### 3. Frontend Deployment (Vercel or Netlify)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - Add `VITE_API_URL` pointing to your *deployed backend URL* (e.g. `https://your-backend.onrender.com`).
