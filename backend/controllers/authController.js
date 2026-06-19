import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/db.js';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_SECRET_JWT_PASSPHRASE_FOR_COPILOT';

// In-memory OTP storage for simplification
const otpStore = new Map();

let cachedEtherealAccount = null;

async function getOtpExpiryTime(db) {
  let expiryTime = 600000; // 10 min default
  try {
    const setting = await db.get("SELECT value FROM settings WHERE key = 'otp_expiry'");
    if (setting && setting.value) {
      const mins = parseInt(setting.value);
      if (!isNaN(mins)) {
        expiryTime = mins * 60 * 1000;
      }
    }
  } catch (e) {}
  return expiryTime;
}

async function getLivenessThreshold(db) {
  let threshold = 0.85;
  try {
    const setting = await db.get("SELECT value FROM settings WHERE key = 'liveness_threshold'");
    if (setting && setting.value) {
      const parsed = parseFloat(setting.value);
      if (!isNaN(parsed)) {
        threshold = parsed / 100;
      }
    }
  } catch (e) {}
  return threshold;
}


// Helper to log audit actions
async function logAudit(userId, action, ip) {
  try {
    const db = getDb();
    await db.run('INSERT INTO audit_logs (user_id, action, ip_address) VALUES (?, ?, ?)', [
      userId || null,
      action,
      ip || '127.0.0.1'
    ]);
  } catch (err) {
    console.error('Audit log failure:', err);
  }
}

async function sendOtpEmail(toEmail, subject, otpCode, purposeText) {
  try {
    const db = getDb();
    let host, port, user, pass, enabled;
    let isEthereal = false;

    // 1. Fetch DB SMTP settings
    try {
      const dbSettings = await db.all('SELECT * FROM settings');
      const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));
      
      enabled = settingsMap.get('smtp_enabled') === '1';
      host = settingsMap.get('smtp_host');
      port = settingsMap.get('smtp_port') || '587';
      user = settingsMap.get('smtp_user');
      pass = settingsMap.get('smtp_pass');
    } catch (dbErr) {
      console.error('Failed to load SMTP settings from database:', dbErr);
    }

    // 2. Fallback to process.env settings if DB configuration is disabled/empty
    if (!enabled || !host || !user || !pass) {
      host = process.env.SMTP_HOST;
      port = process.env.SMTP_PORT || '587';
      user = process.env.SMTP_USER;
      pass = process.env.SMTP_PASS;
      enabled = !!host && !!user && !!pass;
    }

    let transporter;
    let fromEmail;

    if (enabled && host && user && pass) {
      // Custom Configured SMTP
      transporter = nodemailer.createTransport({
        host,
        port: parseInt(port),
        secure: parseInt(port) === 465,
        auth: {
          user,
          pass
        }
      });
      fromEmail = user;
    } else {
      // Fallback: Dynamic Ethereal Email provider
      isEthereal = true;
      if (!cachedEtherealAccount) {
        console.log('Generating fallback Ethereal email test account...');
        cachedEtherealAccount = await nodemailer.createTestAccount();
        console.log(`Ethereal Account Generated: ${cachedEtherealAccount.user}`);
      }
      transporter = nodemailer.createTransport({
        host: cachedEtherealAccount.smtp.host,
        port: cachedEtherealAccount.smtp.port,
        secure: cachedEtherealAccount.smtp.secure,
        auth: {
          user: cachedEtherealAccount.user,
          pass: cachedEtherealAccount.pass
        }
      });
      fromEmail = cachedEtherealAccount.user;
    }

    const mailOptions = {
      from: `"Hirenix AI" <${fromEmail}>`,
      to: toEmail,
      subject: subject,
      text: `${purposeText}\n\nYour 6-digit verification code is: ${otpCode}\n\nThis code expires in 10 minutes. If you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f9; color: #333; max-width: 600px; margin: 0 auto; border-radius: 8px;">
          <h2 style="color: #7c3aed; text-align: center;">Hirenix AI Platform</h2>
          <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;" />
          <p>Hello,</p>
          <p>${purposeText}</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; padding: 12px 24px; background-color: #7c3aed; color: white; border-radius: 6px; display: inline-block;">
              ${otpCode}
            </span>
          </div>
          <p style="font-size: 13px; color: #666;">This code is valid for 10 minutes. If you did not initiate this request, please secure your account credentials.</p>
        </div>
      `
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[SMTP Mail Sent] Message ID: ${info.messageId} | Recipient: ${toEmail}`);
      if (isEthereal) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[Ethereal Email Preview URL] Click to view: ${previewUrl}`);
      }
    } catch (err) {
      if (enabled) {
        console.error('Custom SMTP delivery failed. Falling back to Ethereal simulator...', err.message);
        try {
          if (!cachedEtherealAccount) {
            console.log('Generating fallback Ethereal email test account...');
            cachedEtherealAccount = await nodemailer.createTestAccount();
            console.log(`Ethereal Account Generated: ${cachedEtherealAccount.user}`);
          }
          const fallbackTransporter = nodemailer.createTransport({
            host: cachedEtherealAccount.smtp.host,
            port: cachedEtherealAccount.smtp.port,
            secure: cachedEtherealAccount.smtp.secure,
            auth: {
              user: cachedEtherealAccount.user,
              pass: cachedEtherealAccount.pass
            }
          });
          const fallbackMailOptions = {
            ...mailOptions,
            from: `"Hirenix AI" <${cachedEtherealAccount.user}>`
          };
          const info = await fallbackTransporter.sendMail(fallbackMailOptions);
          console.log(`[SMTP Mail Sent via Fallback] Message ID: ${info.messageId} | Recipient: ${toEmail}`);
          const previewUrl = nodemailer.getTestMessageUrl(info);
          console.log(`[Ethereal Email Preview URL] Click to view: ${previewUrl}`);
        } catch (fallbackErr) {
          console.error('Nodemailer fallback failed to send email:', fallbackErr.message);
        }
      } else {
        console.error('Nodemailer failed to send email:', err.message);
      }
    }
  } catch (outerErr) {
    console.error('Nodemailer helper encountered outer error:', outerErr.message);
  }
}


export async function register(req, res) {
  try {
    const { username, email, password, role } = req.body;
    const db = getDb();

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username or Email already exists' });
    }

    // Hash password
    const passwordHash = bcrypt.hashSync(password, 10);
    const targetRole = role === 'admin' ? 'admin' : 'user';

    // Generate random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = await getOtpExpiryTime(db);
    const expiry = Date.now() + expiryTime;

    // Save in-memory registration session
    otpStore.set(`register_${email}`, {
      username,
      email,
      passwordHash,
      role: targetRole,
      otp: otpCode,
      expiry
    });

    // Send email
    await sendOtpEmail(
      email,
      'Verify Your Email - Hirenix',
      otpCode,
      'Thank you for signing up. Please verify your email address to complete your registration.'
    );

    res.status(201).json({
      message: 'OTP verification code sent to your email. Please verify to complete signup.',
      email
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    const db = getDb();

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const signupData = otpStore.get(`register_${email}`);
    if (!signupData) {
      return res.status(400).json({ error: 'Verification session expired or not found. Please sign up again.' });
    }

    if (signupData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (Date.now() > signupData.expiry) {
      otpStore.delete(`register_${email}`);
      return res.status(400).json({ error: 'Verification code expired. Please sign up again.' });
    }

    // Insert user into database
    const result = await db.run(
      `INSERT INTO users (email, username, password_hash, role, status, is_email_verified) 
       VALUES (?, ?, ?, ?, 'active', 1)`,
      [signupData.email, signupData.username, signupData.passwordHash, signupData.role]
    );

    const userId = result.lastID;

    // Clean up session
    otpStore.delete(`register_${email}`);

    await logAudit(userId, 'Account created and email verified successfully', req.ip);

    res.status(200).json({ message: 'Email verified successfully. You can now complete facial registration.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function registerFace(req, res) {
  try {
    const { email, faceEmbedding } = req.body;
    const db = getDb();

    if (!email || !faceEmbedding) {
      return res.status(400).json({ error: 'Email and facial embeddings are required' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Save facial embeddings (stringified JSON array)
    const embeddingStr = JSON.stringify(faceEmbedding);
    await db.run('UPDATE users SET face_registered = 1, face_embedding = ? WHERE id = ?', [
      embeddingStr,
      user.id
    ]);

    await logAudit(user.id, 'Facial recognition registered', req.ip);

    res.status(200).json({ message: 'Facial registration completed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function login(req, res) {
  try {
    const { identifier, password, faceEmbedding } = req.body; // username or email
    const db = getDb();

    if (!identifier || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ? OR username = ?', [identifier, identifier]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid username/email or password' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Your account is deactivated' });
    }

    const passMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passMatch) {
      return res.status(400).json({ error: 'Invalid username/email or password' });
    }

    // (Facial biometric checks disabled)

    // Update last login
    await db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    await logAudit(user.id, 'Standard password login successful', req.ip);

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.is_email_verified,
        faceRegistered: user.face_registered,
        registrationDate: user.registration_date,
        lastLogin: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function loginFace(req, res) {
  try {
    const { identifier, faceEmbedding } = req.body; // username or email
    const db = getDb();

    if (!identifier || !faceEmbedding) {
      return res.status(400).json({ error: 'Identifier and facial data are required' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ? OR username = ?', [identifier, identifier]);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Your account is deactivated' });
    }

    if (!user.face_registered || !user.face_embedding) {
      return res.status(400).json({ error: 'Facial recognition is not registered for this account' });
    }

    const storedEmbedding = JSON.parse(user.face_embedding);
    
    // Dynamic matching calculation
    let similarity = 0;
    if (Array.isArray(storedEmbedding) && Array.isArray(faceEmbedding) && storedEmbedding.length === faceEmbedding.length) {
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < storedEmbedding.length; i++) {
        dotProduct += storedEmbedding[i] * faceEmbedding[i];
        normA += storedEmbedding[i] * storedEmbedding[i];
        normB += faceEmbedding[i] * faceEmbedding[i];
      }
      similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    const livenessThreshold = await getLivenessThreshold(db);
    if (similarity < livenessThreshold) {
      await logAudit(user.id, 'Facial recognition login failed - low similarity score', req.ip);
      return res.status(400).json({ error: 'Face Verification Failed – Unauthorized Face Detected.' });
    }

    // Update last login
    await db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    await logAudit(user.id, 'Facial recognition login successful', req.ip);

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Facial login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.is_email_verified,
        faceRegistered: user.face_registered,
        registrationDate: user.registration_date,
        lastLogin: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const db = getDb();

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    // Generate random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = await getOtpExpiryTime(db);
    const expiry = Date.now() + expiryTime;

    otpStore.set(`reset_${email}`, { otp: otpCode, userId: user.id, expiry });

    // Send email
    await sendOtpEmail(
      email,
      'Reset Password Verification - Hirenix',
      otpCode,
      'We received a request to reset your password. Please verify the code below to set a new password.'
    );

    await logAudit(user.id, 'Password reset requested (OTP sent)', req.ip);

    res.status(200).json({
      message: 'Reset verification code sent to your email.',
      email
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    const db = getDb();

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const resetData = otpStore.get(`reset_${email}`);
    if (!resetData) {
      return res.status(400).json({ error: 'Reset session expired or not found. Please request another code.' });
    }

    if (resetData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (Date.now() > resetData.expiry) {
      otpStore.delete(`reset_${email}`);
      return res.status(400).json({ error: 'Verification code expired. Please request another code.' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);
    otpStore.delete(`reset_${email}`);

    await logAudit(user.id, 'Password reset successfully completed', req.ip);

    res.status(200).json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const db = getDb();

    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    const passMatch = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!passMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    await logAudit(userId, 'Password changed from settings', req.ip);
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateProfile(req, res) {
  try {
    const { username, email } = req.body;
    const userId = req.user.id;
    const db = getDb();

    if (!username || !email) {
      return res.status(400).json({ error: 'Username and Email are required' });
    }

    // Check availability
    const conflict = await db.get('SELECT * FROM users WHERE (email = ? OR username = ?) AND id != ?', [
      email,
      username,
      userId
    ]);
    if (conflict) {
      return res.status(400).json({ error: 'Username or Email is already taken' });
    }

    await db.run('UPDATE users SET username = ?, email = ? WHERE id = ?', [username, email, userId]);
    await logAudit(userId, 'Profile details updated', req.ip);

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProfile(req, res) {
  try {
    const userId = req.user.id;
    const db = getDb();

    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resumes = await db.all('SELECT id, filename, ats_score, match_score, upload_date FROM resumes WHERE user_id = ? ORDER BY upload_date DESC', [userId]);
    const auditLogs = await db.all('SELECT action, ip_address, timestamp FROM audit_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20', [userId]);
    const mockInterviews = await db.all('SELECT role, difficulty, score, date_taken FROM interviews WHERE user_id = ? ORDER BY date_taken DESC', [userId]);

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.is_email_verified,
        faceRegistered: user.face_registered,
        registrationDate: user.registration_date,
        lastLogin: user.last_login
      },
      resumes,
      auditLogs,
      mockInterviews
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function requestDeleteOtp(req, res) {
  try {
    const userId = req.user.id;
    const { password } = req.body;
    const db = getDb();

    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    const passMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passMatch) {
      return res.status(400).json({ error: 'Password validation failed' });
    }

    // Generate random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = await getOtpExpiryTime(db);
    const expiry = Date.now() + expiryTime;

    otpStore.set(`delete_${user.email}`, { otp: otpCode, expiry });

    // Send email
    await sendOtpEmail(
      user.email,
      'Delete Account Verification - Hirenix',
      otpCode,
      'We received a request to permanently delete your account. Please verify the code below to confirm this action. WARNING: This action cannot be undone.'
    );

    await logAudit(userId, 'Account deletion requested (OTP sent)', req.ip);

    res.status(200).json({
      message: 'Secure account deletion verification code sent to your email.',
      otp: otpCode
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function verifyDeleteOtp(req, res) {
  try {
    const userId = req.user.id;
    const { otp } = req.body;
    const db = getDb();

    if (!otp) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const deleteData = otpStore.get(`delete_${user.email}`);
    if (!deleteData) {
      return res.status(400).json({ error: 'Deletion request expired or not found' });
    }

    if (deleteData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (Date.now() > deleteData.expiry) {
      otpStore.delete(`delete_${user.email}`);
      return res.status(400).json({ error: 'Verification code expired' });
    }

    res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function confirmDeleteAccount(req, res) {
  try {
    const userId = req.user.id;
    const { otp } = req.body;
    const db = getDb();

    if (!otp) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const deleteData = otpStore.get(`delete_${user.email}`);
    if (!deleteData) {
      return res.status(400).json({ error: 'Deletion request expired or not found' });
    }

    if (deleteData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (Date.now() > deleteData.expiry) {
      otpStore.delete(`delete_${user.email}`);
      return res.status(400).json({ error: 'Verification code expired' });
    }

    // Log audit before deleting the user record
    await logAudit(userId, 'Account permanently deleted', req.ip);

    // Permanently remove user data
    await db.run('DELETE FROM users WHERE id = ?', [userId]);
    otpStore.delete(`delete_${user.email}`);

    res.status(200).json({ message: 'Your account and all associated data have been permanently deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Google OAuth Mock Endpoint
export async function googleAuthMock(req, res) {
  try {
    const { email, username, credential } = req.body;
    const db = getDb();

    let targetEmail = email;
    let targetUsername = username;

    if (credential) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payloadBuf = Buffer.from(parts[1], 'base64');
          const payload = JSON.parse(payloadBuf.toString('utf-8'));
          if (payload.email) {
            targetEmail = payload.email;
            targetUsername = payload.name || payload.given_name || targetEmail.split('@')[0];
          }
        }
      } catch (err) {
        console.error('Failed to parse Google JWT payload:', err);
      }
    }

    if (!targetEmail) {
      return res.status(400).json({ error: 'Google authentication details missing' });
    }

    // Check if user already exists
    let user = await db.get('SELECT * FROM users WHERE email = ?', [targetEmail]);
    
    if (!user) {
      // Create user automatically
      const generatedPassHash = bcrypt.hashSync(Math.random().toString(36), 10);
      const uniqueUsername = targetUsername || targetEmail.split('@')[0] + Math.floor(Math.random() * 1000);
      
      const result = await db.run(
        `INSERT INTO users (email, username, password_hash, role, status, is_email_verified, face_registered) 
         VALUES (?, ?, ?, 'user', 'active', 1, 0)`,
        [targetEmail, uniqueUsername, generatedPassHash]
      );
      
      user = {
        id: result.lastID,
        username: uniqueUsername,
        email: targetEmail,
        role: 'user',
        is_email_verified: 1,
        face_registered: 0,
        registration_date: new Date().toISOString()
      };
      await logAudit(user.id, 'Account created via Google OAuth', req.ip);
    } else {
      if (user.status !== 'active') {
        return res.status(403).json({ error: 'Your account is deactivated' });
      }
      await logAudit(user.id, 'Logged in via Google OAuth', req.ip);
    }

    // Update last login
    await db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Google Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.is_email_verified,
        faceRegistered: user.face_registered,
        registrationDate: user.registration_date,
        lastLogin: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
