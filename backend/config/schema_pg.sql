CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  domain VARCHAR(255),
  logo TEXT,
  primary_color VARCHAR(50) DEFAULT '#7c3aed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(50) DEFAULT 'active',
  is_email_verified INTEGER DEFAULT 0,
  face_registered INTEGER DEFAULT 0,
  face_embedding TEXT,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resumes (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  parsed_skills TEXT,
  parsed_experience TEXT,
  parsed_contact TEXT,
  ats_score INTEGER,
  match_score INTEGER,
  keywords_found TEXT,
  keywords_missing TEXT,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interviews (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(255) NOT NULL,
  difficulty VARCHAR(50) NOT NULL,
  mode VARCHAR(50) DEFAULT 'text',
  score INTEGER,
  duration INTEGER,
  date_taken TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  chat_history TEXT,
  evaluation TEXT
);

CREATE TABLE IF NOT EXISTS question_bank (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  role VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  difficulty VARCHAR(50) NOT NULL,
  question_text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roadmaps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_role VARCHAR(255) NOT NULL,
  duration_days INTEGER DEFAULT 90,
  skills_gap TEXT,
  roadmap_data TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proctor_logs (
  id SERIAL PRIMARY KEY,
  interview_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  details TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  key_name VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  permissions VARCHAR(255) DEFAULT 'read_scorecard',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  secret VARCHAR(255),
  events VARCHAR(255) DEFAULT 'interview.completed',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT
);
