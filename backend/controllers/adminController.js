import { getDb } from '../config/db.js';

export async function getUsers(req, res) {
  try {
    const db = getDb();
    const users = await db.all('SELECT id, email, username, role, status, face_registered, registration_date, last_login FROM users ORDER BY registration_date DESC');
    res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function toggleUserStatus(req, res) {
  try {
    const { userId, status } = req.body; // 'active' or 'inactive'
    const db = getDb();

    if (!userId || !status) {
      return res.status(400).json({ error: 'User ID and status are required' });
    }

    // Prevent deactivating own account
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot deactivate your own administrative account' });
    }

    await db.run('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    res.status(200).json({ message: `User status updated to ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUserRole(req, res) {
  try {
    const { userId, role } = req.body; // 'user' or 'admin'
    const db = getDb();

    if (!userId || !role) {
      return res.status(400).json({ error: 'User ID and role are required' });
    }

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot modify your own administrative role' });
    }

    if (role === 'admin') {
      return res.status(400).json({ error: 'Promotion to Admin is disabled. Only the system-seeded root admin is permitted.' });
    }

    await db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    res.status(200).json({ message: `User role updated to ${role}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAnalytics(req, res) {
  try {
    const db = getDb();

    // Summary counts
    const totalUsers = await db.get('SELECT COUNT(*) as val FROM users');
    const activeUsers = await db.get("SELECT COUNT(*) as val FROM users WHERE status = 'active'");
    const totalResumes = await db.get('SELECT COUNT(*) as val FROM resumes');
    const totalInterviews = await db.get('SELECT COUNT(*) as val FROM interviews');
    const avgScore = await db.get('SELECT AVG(score) as val FROM interviews');
    const avgAts = await db.get('SELECT AVG(ats_score) as val FROM resumes');

    // Chart mock data points calculated dynamically
    const userGrowth = [
      { date: 'Mon', count: Math.max(1, totalUsers.val - 5) },
      { date: 'Tue', count: Math.max(1, totalUsers.val - 4) },
      { date: 'Wed', count: Math.max(2, totalUsers.val - 3) },
      { date: 'Thu', count: Math.max(2, totalUsers.val - 2) },
      { date: 'Fri', count: Math.max(3, totalUsers.val - 1) },
      { date: 'Sat', count: totalUsers.val },
      { date: 'Sun', count: totalUsers.val }
    ];

    const interviewVolume = [
      { role: 'Software Engineer', count: 12 },
      { role: 'Product Manager', count: 5 },
      { role: 'Data Scientist', count: 8 },
      { role: 'UI/UX Designer', count: 3 }
    ];

    const modelPerformance = {
      apiLatency: '184ms',
      uptime: '99.98%',
      successRate: '99.7%'
    };

    res.status(200).json({
      metrics: {
        totalUsers: totalUsers.val,
        activeUsers: activeUsers.val,
        totalResumes: totalResumes.val,
        totalInterviews: totalInterviews.val,
        avgScore: Math.round(avgScore.val || 0),
        avgAts: Math.round(avgAts.val || 0)
      },
      charts: {
        userGrowth,
        interviewVolume
      },
      system: modelPerformance
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Question Bank CRUD
export async function getQuestionBank(req, res) {
  try {
    const db = getDb();
    const questions = await db.all('SELECT * FROM question_bank ORDER BY id DESC');
    res.status(200).json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createQuestion(req, res) {
  try {
    const { role, category, difficulty, questionText } = req.body;
    const db = getDb();

    if (!role || !category || !difficulty || !questionText) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const result = await db.run(
      'INSERT INTO question_bank (role, category, difficulty, question_text) VALUES (?, ?, ?, ?)',
      [role, category, difficulty, questionText]
    );

    res.status(201).json({
      message: 'Question added successfully',
      question: { id: result.lastID, role, category, difficulty, question_text: questionText }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateQuestion(req, res) {
  try {
    const { id, role, category, difficulty, questionText } = req.body;
    const db = getDb();

    if (!id || !role || !category || !difficulty || !questionText) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    await db.run(
      'UPDATE question_bank SET role = ?, category = ?, difficulty = ?, question_text = ? WHERE id = ?',
      [role, category, difficulty, questionText, id]
    );

    res.status(200).json({ message: 'Question updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteQuestion(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    if (!id) {
      return res.status(400).json({ error: 'Question ID is required' });
    }

    await db.run('DELETE FROM question_bank WHERE id = ?', [id]);
    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Audit Logs
export async function getAuditLogs(req, res) {
  try {
    const db = getDb();
    const logs = await db.all(`
      SELECT a.id, a.action, a.ip_address, a.timestamp, u.username, u.email 
      FROM audit_logs a 
      LEFT JOIN users u ON a.user_id = u.id 
      ORDER BY a.timestamp DESC 
      LIMIT 100
    `);
    res.status(200).json({ logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getConfig(req, res) {
  try {
    const db = getDb();
    const settings = await db.all('SELECT * FROM settings');
    const config = {};
    settings.forEach(s => {
      config[s.key] = s.value;
    });
    res.status(200).json({ config });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateConfig(req, res) {
  try {
    const { configurations } = req.body;
    if (!configurations || typeof configurations !== 'object') {
      return res.status(400).json({ error: 'Invalid configuration payload' });
    }

    const db = getDb();
    for (const [key, value] of Object.entries(configurations)) {
      await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
    }

    // Write audit log
    await db.run('INSERT INTO audit_logs (user_id, action, ip_address) VALUES (?, ?, ?)', [
      req.user.id,
      'System configurations updated',
      req.ip || '127.0.0.1'
    ]);

    res.status(200).json({ message: 'Configurations saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

