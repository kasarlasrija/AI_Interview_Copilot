import { getDb } from '../config/db.js';
import crypto from 'crypto';

// Public candidate scorecard view endpoint (Unauthenticated / Public Link)
export async function getPublicScorecard(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    const interview = await db.get(`
      SELECT i.*, u.username, u.email 
      FROM interviews i 
      JOIN users u ON i.user_id = u.id 
      WHERE i.id = ?
    `, [id]);

    if (!interview) {
      return res.status(404).json({ error: 'Interview scorecard not found or link expired' });
    }

    let chatHistory = [];
    let evaluation = {};
    try {
      chatHistory = JSON.parse(interview.chat_history || '[]');
      evaluation = JSON.parse(interview.evaluation || '{}');
    } catch (e) {}

    res.status(200).json({
      scorecard: {
        id: interview.id,
        candidateName: interview.username,
        candidateEmail: interview.email.replace(/(?<=.{2}).(?=.*@)/g, '*'), // anonymize email for public safety
        role: interview.role,
        difficulty: interview.difficulty,
        mode: interview.mode,
        score: interview.score,
        dateTaken: interview.date_taken,
        evaluation,
        verified: true,
        verifiedBy: 'Hirenix AI Platform'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Enterprise API Key Management
export async function getApiKeys(req, res) {
  try {
    const db = getDb();
    const keys = await db.all('SELECT id, key_name, api_key, permissions, created_at FROM api_keys ORDER BY created_at DESC');
    res.status(200).json({ apiKeys: keys });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createApiKey(req, res) {
  try {
    const { keyName, permissions } = req.body;
    const db = getDb();

    if (!keyName) {
      return res.status(400).json({ error: 'Key name is required' });
    }

    const rawKey = 'hrnx_live_' + crypto.randomBytes(16).toString('hex');
    const result = await db.run(
      'INSERT INTO api_keys (key_name, api_key, permissions) VALUES (?, ?, ?)',
      [keyName, rawKey, permissions || 'read_scorecard']
    );

    res.status(201).json({
      message: 'API Key generated successfully',
      apiKey: { id: result.lastID, keyName, apiKey: rawKey, permissions }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteApiKey(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    await db.run('DELETE FROM api_keys WHERE id = ?', [id]);
    res.status(200).json({ message: 'API Key deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Webhook Integration Controls
export async function getWebhooks(req, res) {
  try {
    const db = getDb();
    const webhooks = await db.all('SELECT * FROM webhooks ORDER BY created_at DESC');
    res.status(200).json({ webhooks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createWebhook(req, res) {
  try {
    const { targetUrl, events } = req.body;
    const db = getDb();

    if (!targetUrl) {
      return res.status(400).json({ error: 'Target URL is required' });
    }

    const secret = 'whsec_' + crypto.randomBytes(12).toString('hex');
    const result = await db.run(
      'INSERT INTO webhooks (target_url, secret, events) VALUES (?, ?, ?)',
      [targetUrl, secret, events || 'interview.completed']
    );

    res.status(201).json({
      message: 'Webhook configured successfully',
      webhook: { id: result.lastID, targetUrl, secret, events }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteWebhook(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    await db.run('DELETE FROM webhooks WHERE id = ?', [id]);
    res.status(200).json({ message: 'Webhook deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
