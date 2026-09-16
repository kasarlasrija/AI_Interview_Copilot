# Hirenix AI
### The Enterprise AI Interview & Career Copilot Platform
**Full Product & Technical Specification — v2.0 (Investor / Acquisition Grade)**

---

## 1. Executive Summary

Hirenix AI is a full-stack, AI-native career-readiness and hiring-enablement platform that unifies **resume intelligence, skill-gap coaching, AI mock interviewing, and enterprise hiring analytics** into a single product. It is designed to serve two markets simultaneously with one shared engine:

- **B2C:** Job seekers who want ATS-optimized resumes, personalized upskilling roadmaps, and realistic, scored mock interviews.
- **B2B / Enterprise:** Universities, bootcamps, staffing agencies, and corporate L&D / TA (Talent Acquisition) teams who need a white-labeled, multi-tenant interview-readiness engine they can deploy to thousands of candidates, with admin oversight, analytics, and integrations into their existing hiring stack (ATS, HRIS, calendars).

This is the combined, upgraded blueprint of the original Hirenix AI feature set and the NovaHire AI build specification, merged into a single coherent architecture and extended with the enterprise, monetization, compliance, and integration layers that make a platform acquirable or licensable by companies rather than just usable by individuals.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 / Vite, TypeScript / JS, CSS Variables, Lucide React, Framer Motion |
| Backend | Node.js + Express (modular controllers/services), REST + WebRTC / Web Speech API |
| Database | PostgreSQL (primary, via `pg` pool) with automatic SQLite failover (`sqlite3`) |
| Storage | Memory buffers / Local & Cloud buckets for resumes, avatars, audio recordings |
| AI Layer | Gemini 3.5/3.6 / OpenAI API, Web Speech API (speech-to-text), custom embedding models |
| Auth | JWT sessions, Google OAuth 2.0, Cosine Similarity Biometric Face ID, WebAuthn/passkey |
| Realtime | WebRTC (webcam/mic capture), Proctoring signals (Tab switch & gaze detection) |
| Email/Notifications | Nodemailer with Ethereal sandbox fallback, in-app notification engine |
| Infra | Docker containers, CI/CD, Horizontally scalable API pods |
| Observability | Centralized audit logging, structured application logs, admin analytics workspace |

---

## 3. Core Product Modules

### 3.1 Identity, Security & Access
- Email + password registration with **6-digit OTP verification** and countdown/resend throttling.
- **Facial Recognition Registration & Login** — webcam capture → facial embedding → cosine-similarity match against a configurable liveness threshold.
- OAuth sign-in (Google) plus **enterprise SSO/SAML** for institutional customers.
- JWT session tokens (24h expiry) with refresh-token rotation, and **WebAuthn/passkey** support.
- Role-Based Access Control across **Candidate, Recruiter/Reviewer, Org Admin, and Platform Super Admin** tiers.
- Multi-factor authentication (TOTP authenticator apps) for enterprise accounts.
- OTP-gated password reset, in-app password change, profile editing with live username/email availability checks.
- Multi-step, irreversible **Account Deletion Workflow** requiring password + OTP confirmation.

### 3.2 ATS Resume Analyzer & Optimizer
- Drag-and-drop uploader (PDF/DOCX) with in-memory parsing (`multer`).
- AI-driven extraction of skills, tools, certifications, experience level, and contact details, cross-referenced against target **Job Descriptions**.
- **ATS Compatibility Score (0–100)** covering formatting, parseability, section structure, and a separate **Job Match Score**.
- Visual **Found vs. Missing Keyword** badges with recommendations.
- Persistent **ATS history** with side-by-side comparison.

### 3.3 Skill Gap Pathway & Learning Roadmap Generator
- Semantic skill-gap analysis between candidate resume and target role.
- **30/60/90-Day Learning Roadmap**: week-by-week study plans with objectives, curated resources, project suggestions, and interactive completion checkboxes.
- Roadmap auto-adjusts based on mock interview performance.

### 3.4 AI Mock Interview Engine
- Session setup wizard: **Type** (Technical, Behavioral, HR), **Target Role**, **Difficulty**, **Question Count**.
- Live interview UI with simulated interviewer avatar, live webcam feed, mic audio meter, recording indicator, and countdown timers.
- Answer input via **Web Speech Recognition** or manual text.
- **Five-axis automated scoring engine**: Relevance, Technical Accuracy, Completeness, Communication, and Confidence.
- **Anti-Spam & Gibberish Filter** and **Model Benchmark Answers**.
- **Proctoring & Integrity Layer** — tab-switch detection, window focus loss tracking, and flagged session logging.

### 3.5 Performance Analytics & Reporting
- Central **Overview Dashboard**: readiness score, role suitability, interview volume, average ATS match.
- **Interview History Table** with full transcript/chat-log playback.
- **Public Shareable Report Links** — verified, read-only scorecard URLs (`/api/v1/public/scorecard/:id`).

### 3.6 Admin & Enterprise Management Suite
- **Analytics Workspace**: total users, active accounts, resumes analyzed, interviews completed, average scores, user-growth time series.
- **User Management**: view/suspend/reactivate accounts, role toggling, facial registration status.
- **Question Bank Manager (CRUD)**: create/edit/delete/filter interview questions.
- **Audit Logging**: every action logged with IP/timestamp.
- **System Configuration Panel**: AI model endpoints, session lifetimes, OTP limits, liveness thresholds, SMTP settings.
- **Multi-Tenant Organization Layer**: isolated workspaces per university/company client with custom branding.

### 3.7 Integrations & Public APIs
- **ATS/HRIS connectors**: Greenhouse, Lever, Workday APIs & Webhooks.
- **Public REST API & Webhooks**: token/API-key management in admin panel.

---

## 4. Compliance, Security & Trust
- GDPR- and CCPA-aligned data handling with documented right-to-erasure workflow.
- Encrypted data in transit and at rest with role-scoped access control.
- Bias & fairness safeguards on scoring engine — sentiment signals advisory only.
