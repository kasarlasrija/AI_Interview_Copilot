import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.sqlite');
const schemaPath = path.join(__dirname, 'schema.sql');

let db;

export async function initDb() {
  if (db) return db;

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Read and execute schema
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await db.exec(schemaSql);

  // Seed Admin & Regular User if not present
  const adminExists = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
  if (!adminExists) {
    const adminHash = bcrypt.hashSync('admin123', 10);
    await db.run(
      `INSERT INTO users (email, username, password_hash, role, status, is_email_verified, face_registered) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['admin@interviewcopilot.com', 'admin', adminHash, 'admin', 'active', 1, 0]
    );
    console.log('Admin account seeded (admin@interviewcopilot.com / admin123)');
  }

  const userExists = await db.get('SELECT * FROM users WHERE username = ?', ['user']);
  if (!userExists) {
    const userHash = bcrypt.hashSync('user123', 10);
    await db.run(
      `INSERT INTO users (email, username, password_hash, role, status, is_email_verified, face_registered) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['user@interviewcopilot.com', 'user', userHash, 'user', 'active', 1, 0]
    );
    console.log('Regular user account seeded (user@interviewcopilot.com / user123)');
  }

  // Seed Question Bank
  const count = await db.get('SELECT COUNT(*) as cnt FROM question_bank');
  if (count.cnt === 0) {
    const sampleQuestions = [
      // Software Engineer - Technical
      { role: 'Software Engineer', category: 'technical', difficulty: 'Easy', question_text: 'Explain the difference between let, const, and var in JavaScript.' },
      { role: 'Software Engineer', category: 'technical', difficulty: 'Easy', question_text: 'What is a RESTful API and what are its key features?' },
      { role: 'Software Engineer', category: 'technical', difficulty: 'Medium', question_text: 'Explain React Virtual DOM and how reconciliation works.' },
      { role: 'Software Engineer', category: 'technical', difficulty: 'Medium', question_text: 'Describe how you would design a system to handle file uploads in Node.js.' },
      { role: 'Software Engineer', category: 'technical', difficulty: 'Hard', question_text: 'How would you design a highly scalable, real-time messaging application like WhatsApp? Focus on concurrency and database design.' },
      { role: 'Software Engineer', category: 'technical', difficulty: 'Hard', question_text: 'Explain the difference between SQL and NoSQL database query optimizations and how index implementation differs.' },
      
      // Software Engineer - HR
      { role: 'Software Engineer', category: 'hr', difficulty: 'Easy', question_text: 'Why do you want to join our company as a Software Engineer?' },
      { role: 'Software Engineer', category: 'hr', difficulty: 'Medium', question_text: 'Describe a situation where you had a technical disagreement with a team member. How did you resolve it?' },
      { role: 'Software Engineer', category: 'hr', difficulty: 'Hard', question_text: 'Tell me about a time you had to deliver a critical feature under an extremely tight deadline. What trade-offs did you make?' },

      // Product Manager - Technical/HR
      { role: 'Product Manager', category: 'technical', difficulty: 'Easy', question_text: 'How would you measure the success of a new feature added to an interview platform?' },
      { role: 'Product Manager', category: 'technical', difficulty: 'Medium', question_text: 'How do you prioritize features when you have stakeholders with conflicting demands?' },
      { role: 'Product Manager', category: 'technical', difficulty: 'Hard', question_text: 'Design a strategy to launch Google Maps in an offline-first developing country. How do you define features and user adoption?' },
      { role: 'Product Manager', category: 'hr', difficulty: 'Medium', question_text: 'How do you handle a situation where the engineering team says a critical feature cannot be built on schedule?' },

      // Data Scientist
      { role: 'Data Scientist', category: 'technical', difficulty: 'Easy', question_text: 'What is overfitting, and how do you prevent it in machine learning models?' },
      { role: 'Data Scientist', category: 'medium', difficulty: 'Medium', question_text: 'Explain the difference between bagging and boosting algorithms. When would you choose one over the other?' },
      { role: 'Data Scientist', category: 'technical', difficulty: 'Hard', question_text: 'Explain the mechanism of Transformer self-attention and how it differs from traditional LSTM recurrent architectures.' },
      { role: 'Data Scientist', category: 'hr', difficulty: 'Medium', question_text: 'Explain a complex machine learning concept to a non-technical stakeholder.' }
    ];

    for (const q of sampleQuestions) {
      await db.run(
        'INSERT INTO question_bank (role, category, difficulty, question_text) VALUES (?, ?, ?, ?)',
        [q.role, q.category, q.difficulty, q.question_text]
      );
    }
    console.log('Sample interview questions seeded.');
  }

  // Seed default settings
  const settingsCount = await db.get('SELECT COUNT(*) as cnt FROM settings');
  if (settingsCount.cnt === 0) {
    await db.run("INSERT INTO settings (key, value) VALUES ('model_endpoint', 'Gemini 3.5 Flash')");
    await db.run("INSERT INTO settings (key, value) VALUES ('session_lifetime', '24 Hours')");
    await db.run("INSERT INTO settings (key, value) VALUES ('otp_expiry', '10 Minutes')");
    await db.run("INSERT INTO settings (key, value) VALUES ('liveness_threshold', '85%')");
    await db.run("INSERT INTO settings (key, value) VALUES ('smtp_host', '')");
    await db.run("INSERT INTO settings (key, value) VALUES ('smtp_port', '587')");
    await db.run("INSERT INTO settings (key, value) VALUES ('smtp_user', '')");
    await db.run("INSERT INTO settings (key, value) VALUES ('smtp_pass', '')");
    await db.run("INSERT INTO settings (key, value) VALUES ('smtp_enabled', '0')");
    console.log('Default settings seeded in database.');
  }

  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}
