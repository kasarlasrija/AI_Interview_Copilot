import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { initDb } from './config/db.js';
import { authenticateToken, authorizeAdmin } from './middleware/authMiddleware.js';

// Auth Controllers
import {
  register,
  verifyOtp,
  registerFace,
  login,
  loginFace,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  getProfile,
  requestDeleteOtp,
  confirmDeleteAccount,
  googleAuthMock
} from './controllers/authController.js';

// Resume Controllers
import { uploadResume, getMyResumes } from './controllers/resumeController.js';

// Interview Controllers
import { startInterview, submitInterview, getInterviewHistory } from './controllers/interviewController.js';

// Admin Controllers
import {
  getUsers,
  toggleUserStatus,
  updateUserRole,
  getAnalytics,
  getQuestionBank,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getAuditLogs,
  getConfig,
  updateConfig
} from './controllers/adminController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend dev server
app.use(cors({
  origin: '*', // Allow all origins during dev, or specify http://localhost:5173
  credentials: true
}));

app.use(express.json());

// Set up Multer memory storage for resume uploads
const upload = multer({ storage: multer.memoryStorage() });

// Initialize DB and launch server
initDb()
  .then(() => {
    console.log('Database initialized successfully.');
    
    // Auth Routes
    app.post('/api/auth/register', register);
    app.post('/api/auth/verify-otp', verifyOtp);
    app.post('/api/auth/register-face', registerFace);
    app.post('/api/auth/login', login);
    app.post('/api/auth/login-face', loginFace);
    app.post('/api/auth/forgot-password', forgotPassword);
    app.post('/api/auth/reset-password', resetPassword);
    app.post('/api/auth/google', googleAuthMock);

    // Profile & settings (Authenticated)
    app.get('/api/auth/profile', authenticateToken, getProfile);
    app.post('/api/auth/change-password', authenticateToken, changePassword);
    app.put('/api/auth/update-profile', authenticateToken, updateProfile);
    app.post('/api/auth/request-delete-otp', authenticateToken, requestDeleteOtp);
    app.post('/api/auth/confirm-delete', authenticateToken, confirmDeleteAccount);

    // Resume Routes (Authenticated)
    app.post('/api/resumes/upload', authenticateToken, upload.single('resume'), uploadResume);
    app.get('/api/resumes/my-resumes', authenticateToken, getMyResumes);

    // Interview Routes (Authenticated)
    app.post('/api/interviews/start', authenticateToken, startInterview);
    app.post('/api/interviews/submit', authenticateToken, submitInterview);
    app.get('/api/interviews/history', authenticateToken, getInterviewHistory);

    // Admin Routes (Authenticated & Admin role)
    app.get('/api/admin/users', authenticateToken, authorizeAdmin, getUsers);
    app.post('/api/admin/users/toggle', authenticateToken, authorizeAdmin, toggleUserStatus);
    app.post('/api/admin/users/role', authenticateToken, authorizeAdmin, updateUserRole);
    app.get('/api/admin/analytics', authenticateToken, authorizeAdmin, getAnalytics);
    app.get('/api/admin/questions', authenticateToken, authorizeAdmin, getQuestionBank);
    app.post('/api/admin/questions', authenticateToken, authorizeAdmin, createQuestion);
    app.put('/api/admin/questions', authenticateToken, authorizeAdmin, updateQuestion);
    app.delete('/api/admin/questions/:id', authenticateToken, authorizeAdmin, deleteQuestion);
    app.get('/api/admin/logs', authenticateToken, authorizeAdmin, getAuditLogs);
    app.get('/api/admin/config', authenticateToken, authorizeAdmin, getConfig);
    app.post('/api/admin/config', authenticateToken, authorizeAdmin, updateConfig);

    // Health Check
    app.get('/health', (req, res) => res.json({ status: 'OK', uptime: process.uptime() }));

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database and server:', err);
    process.exit(1);
  });
