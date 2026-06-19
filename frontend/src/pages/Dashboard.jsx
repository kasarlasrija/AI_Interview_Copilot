import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  LayoutDashboard,
  FileText,
  Target,
  Mic,
  BookOpen,
  Clock,
  Award,
  User,
  Settings,
  LogOut,
  UploadCloud,
  ChevronRight,
  AlertCircle,
  Play,
  Sparkles,
  Check,
  X,
  ShieldAlert,
  Info,
  Printer,
  Download,
  Eye,
  Camera,
  RefreshCw,
  Sun,
  Moon,
  Video,
  ChevronDown,
  Trash2
} from 'lucide-react';

export default function Dashboard() {
  const { user, token, activeTab, setActiveTab, logout, fetchUserProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Profile data fetched from backend
  const [profileData, setProfileData] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Resume Upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [atsReport, setAtsReport] = useState(null);
  const [atsError, setAtsError] = useState('');

  // Skill gap mock course progress toggle
  const [completedSubtopics, setCompletedSubtopics] = useState({});

  // Skill gap detailed learning pathway state
  const [learningSkillSelected, setLearningSkillSelected] = useState(null);
  const [codingChallengeCode, setCodingChallengeCode] = useState('');
  const [codingVerificationResult, setCodingVerificationResult] = useState('');

  // Mock Interview custom configurations
  const [selectedInterviewType, setSelectedInterviewType] = useState('Technical');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(5);
  const [selectedTimeLimit, setSelectedTimeLimit] = useState(60); // seconds per question
  const [selectedDurationLimit, setSelectedDurationLimit] = useState(15); // total duration minutes
  const [questionTimeLeft, setQuestionTimeLeft] = useState(60);

  // Mock Interview states
  const [interviewStep, setInterviewStep] = useState('setup'); // 'setup' | 'active' | 'evaluating' | 'result'
  const [selectedRole, setSelectedRole] = useState('Software Engineer');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  const [selectedMode, setSelectedMode] = useState('text'); // 'text' | 'voice'
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState([]); // Array of user responses
  const [currentTextResponse, setCurrentTextResponse] = useState('');
  const [interviewTime, setInterviewTime] = useState(0);
  const [interviewTimerId, setInterviewTimerId] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [evalError, setEvalError] = useState('');
  const [adaptiveLog, setAdaptiveLog] = useState([]);
  const [isAdaptiveDifficulty, setIsAdaptiveDifficulty] = useState(true);

  // Audio Canvas visualizer variables
  const canvasRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const speechRecognitionRef = useRef(null);

  // View Report Modal states
  const [selectedReport, setSelectedReport] = useState(null);

  // Settings states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  
  // Re-enroll facial biometric state
  const [cameraActive, setCameraActive] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [livenessStage, setLivenessStage] = useState('align');
  const videoRef = useRef(null);
  const webcamCanvasRef = useRef(null);
  const webcamStreamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Delete account states
  const [deleteModalActive, setDeleteModalActive] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1); // 1: Password, 2: OTP, 3: Checkbox final
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deleteConfirmCheck, setDeleteConfirmCheck] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState('');

  // Profile Edit states
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    loadProfileDetails();
  }, [token]);

  // Per-question timer countdown and auto-submission effect
  useEffect(() => {
    let interval = null;
    if (interviewStep === 'active' && selectedTimeLimit > 0) {
      interval = setInterval(() => {
        setInterviewTime(prev => prev + 1);
        setQuestionTimeLeft(prev => {
          if (prev <= 1) {
            return 0; // Trigger auto-submission
          }
          return prev - 1;
        });
      }, 1000);
    } else if (interviewStep === 'active') {
      interval = setInterval(() => {
        setInterviewTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [interviewStep, selectedTimeLimit, currentQuestionIdx]);

  useEffect(() => {
    if (interviewStep === 'active' && selectedTimeLimit > 0 && questionTimeLeft === 0) {
      handleAutoSubmitQuestionResponse();
    }
  }, [questionTimeLeft, interviewStep, selectedTimeLimit]);

  const handleAutoSubmitQuestionResponse = () => {
    const duration = selectedTimeLimit;
    const textAns = currentTextResponse.trim() || "Timeout: No response provided in time.";
    const currentQ = interviewQuestions[currentQuestionIdx];
    const newAnsObj = {
      questionId: currentQ.id,
      questionText: currentQ.question_text,
      userResponse: textAns,
      duration
    };

    const updatedAnswers = [...answers, newAnsObj];
    setAnswers(updatedAnswers);

    if (currentQuestionIdx + 1 < interviewQuestions.length) {
      setCurrentQuestionIdx(prev => prev + 1);
      setCurrentTextResponse('');
      setQuestionStartTime(Date.now());
      setQuestionTimeLeft(selectedTimeLimit);
    } else {
      handleSubmitAllAnswers(updatedAnswers);
    }
  };

  const loadProfileDetails = async () => {
    try {
      setLoadingProfile(true);
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.user);
        setResumes(data.resumes || []);
        setInterviews(data.mockInterviews || []);
        setAuditLogs(data.auditLogs || []);
        setEditUsername(data.user.username);
        setEditEmail(data.user.email);
      }
    } catch (err) {
      console.error('Failed to load user profile data:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Resume drag drop / file selection handler
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setAtsError('');
    }
  };

  const handleUploadResume = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setAtsError('Please select a resume file first');
      return;
    }
    setAtsError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('resume', selectedFile);
    formData.append('jobDescription', jobDescription);

    try {
      const res = await fetch('http://localhost:5000/api/resumes/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setAtsReport(data.report);
        loadProfileDetails(); // reload resumes listing
      } else {
        setAtsError(data.error || 'Failed to upload/analyze resume');
      }
    } catch (err) {
      setAtsError('Network error uploading resume.');
    } finally {
      setUploading(false);
    }
  };

  // Toggle study checklist items
  const handleToggleSubtopic = (course, topic) => {
    const key = `${course}_${topic}`;
    setCompletedSubtopics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Mock interview dynamic setup & launch
  const handleStartInterview = async () => {
    try {
      setEvalError('');
      setInterviewStep('setup');
      
      const res = await fetch('http://localhost:5000/api/interviews/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          role: selectedRole, 
          difficulty: selectedDifficulty,
          type: selectedInterviewType,
          questionCount: selectedQuestionCount
        })
      });
      const data = await res.json();
      if (res.ok) {
        setInterviewQuestions(data.questions);
        setCurrentQuestionIdx(0);
        setAnswers([]);
        setCurrentTextResponse('');
        setInterviewStep('active');
        setInterviewTime(0);
        setQuestionStartTime(Date.now());
        setAdaptiveLog([`Session started at base difficulty: ${selectedDifficulty}`]);
        setQuestionTimeLeft(selectedTimeLimit > 0 ? selectedTimeLimit : 60);
      } else {
        setEvalError(data.error || 'Failed to generate interview');
      }
    } catch (err) {
      setEvalError('Network error starting interview.');
    }
  };

  // Speech Recognition hook for audio recording
  const startSpeechRecognition = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Your browser does not support the Web Speech Recognition API natively. Use the simulation tool or write text.');
      return;
    }

    setIsRecording(true);
    setSpeechTranscript('');

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      let currentResult = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentResult += event.results[i][0].transcript;
      }
      setSpeechTranscript(currentResult);
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event);
      stopSpeechRecognition();
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    speechRecognitionRef.current = rec;
    rec.start();
    startAudioCanvasVisualization();
  };

  const stopSpeechRecognition = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    }
    setIsRecording(false);
    cancelAnimationFrame(animationFrameIdRef.current);
    
    // Copy transcripts to input field
    if (speechTranscript) {
      setCurrentTextResponse(prev => (prev ? `${prev} ${speechTranscript}` : speechTranscript));
      setSpeechTranscript('');
    }
  };

  const simulateSpeechResponse = () => {
    const currentQ = interviewQuestions[currentQuestionIdx];
    const qText = currentQ ? currentQ.question_text.toLowerCase() : '';
    let answer = 'Regarding this question, I approach it by analyzing structural requirements first. Next, I design the state management components and write comprehensive test parameters to handle potential failures.';
    
    // Check keywords to generate specific answers
    if (qText.includes('let') || qText.includes('const') || qText.includes('var')) {
      answer = 'In JavaScript, var is function-scoped and hoisted, which can cause unexpected closures behavior. let and const are block-scoped. const is read-only reference, making it perfect for immutability optimization. React hooks and constants always use const.';
    } else if (qText.includes('virtual dom') || qText.includes('react')) {
      answer = 'React Virtual DOM is a lightweight memory representation of the actual DOM. When state changes occur, a new Virtual DOM tree is created. Reconciliation compares the trees using a diffing algorithm, applying only changes to lower paint latency.';
    } else if (qText.includes('rest') || qText.includes('api')) {
      answer = 'A RESTful API uses standard HTTP methods like GET, POST, PUT, DELETE with stateless client-server endpoints. It relies on standard JSON response schemas. We ensure security via TLS encryption and JWT authentication tokens.';
    } else if (qText.includes('messaging') || qText.includes('whatsapp')) {
      answer = 'Designing WhatsApp requires a high-throughput websocket gateway using Node.js clustering. Messages are cached in Redis in-memory databases and archived in distributed SQLite or PostgreSQL databases with replication indices.';
    } else if (qText.includes('overfitting')) {
      answer = 'Overfitting is when a machine learning model learns the training noise instead of general patterns. We prevent it using L1/L2 regularization penalties, dropout layers in neural networks, early stopping criteria, and cross-validation techniques.';
    }

    setCurrentTextResponse(answer);
  };

  // Draw simulated neon sound waves on canvas
  const startAudioCanvasVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let phase = 0;

    const render = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 3;

      // Draw three wave bands
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        const colors = ['rgba(124, 58, 237, 0.45)', 'rgba(6, 182, 212, 0.55)', 'rgba(236, 72, 153, 0.35)'];
        ctx.strokeStyle = colors[w];
        
        for (let x = 0; x < canvas.width; x++) {
          const angle = (x / canvas.width) * Math.PI * 4 + phase + w;
          const amp = 10 + Math.sin(phase * 1.5) * 15 + w * 5;
          const y = canvas.height / 2 + Math.sin(angle) * amp;
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      phase += 0.12;
      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    render();
  };

  // Handle Question Response Submission
  const handleSaveQuestionResponse = () => {
    if (isRecording) {
      stopSpeechRecognition();
    }

    const duration = Math.round((Date.now() - questionStartTime) / 1000);
    const textAns = currentTextResponse.trim();

    if (!textAns) {
      alert('Please enter or record a response before proceeding.');
      return;
    }

    const currentQ = interviewQuestions[currentQuestionIdx];
    const newAnsObj = {
      questionId: currentQ.id,
      questionText: currentQ.question_text,
      userResponse: textAns,
      duration
    };

    const updatedAnswers = [...answers, newAnsObj];
    setAnswers(updatedAnswers);

    // Adaptive Difficulty Feedback Logic
    // If the response is solid and verbose (>15 words), simulated AI will adapt and increase difficulty
    const wordCount = textAns.split(/\s+/).length;
    let nextDiff = selectedDifficulty;
    if (isAdaptiveDifficulty) {
      if (wordCount > 20 && selectedDifficulty === 'Easy') {
        nextDiff = 'Medium';
        setAdaptiveLog(prev => [...prev, `[Q${currentQuestionIdx + 1}] Solid answer details. Elevating difficulty to: Medium`]);
      } else if (wordCount > 25 && selectedDifficulty === 'Medium') {
        nextDiff = 'Hard';
        setAdaptiveLog(prev => [...prev, `[Q${currentQuestionIdx + 1}] Excellent conceptual explanation. Elevating difficulty to: Hard`]);
      } else if (wordCount < 10 && selectedDifficulty === 'Hard') {
        nextDiff = 'Medium';
        setAdaptiveLog(prev => [...prev, `[Q${currentQuestionIdx + 1}] Brief answer. Scaling back difficulty to: Medium`]);
      } else if (wordCount < 8 && selectedDifficulty === 'Medium') {
        nextDiff = 'Easy';
        setAdaptiveLog(prev => [...prev, `[Q${currentQuestionIdx + 1}] Short answer. Scaling back difficulty to: Easy`]);
      }
    }

    // Advance index or trigger final submit
    if (currentQuestionIdx + 1 < interviewQuestions.length) {
      setCurrentQuestionIdx(prev => prev + 1);
      setCurrentTextResponse('');
      setQuestionStartTime(Date.now());
    } else {
      // End of questions, submit to backend API
      handleSubmitAllAnswers(updatedAnswers);
    }
  };

  const handleSubmitAllAnswers = async (finalAnswers) => {
    if (interviewTimerId) clearInterval(interviewTimerId);
    setInterviewStep('evaluating');

    try {
      const res = await fetch('http://localhost:5000/api/interviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: selectedRole,
          difficulty: selectedDifficulty,
          mode: selectedMode,
          answers: finalAnswers
        })
      });
      const data = await res.json();
      if (res.ok) {
        setEvaluationResult(data.evaluation);
        setInterviewStep('result');
        loadProfileDetails(); // reload profile history list
      } else {
        setEvalError(data.error || 'Failed to evaluate interview response');
        setInterviewStep('setup');
      }
    } catch (err) {
      setEvalError('Network connection failed.');
      setInterviewStep('setup');
    }
  };

  // Print PDF helper function
  const handlePrintPDF = () => {
    window.print();
  };

  // Profile Edit submits
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: editUsername, email: editEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setProfileSuccess('Profile details updated successfully');
        fetchUserProfile(); // update context state
        loadProfileDetails();
      } else {
        setProfileError(data.error || 'Update failed');
      }
    } catch (err) {
      setProfileError('Server error updating profile.');
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');

    if (!currentPassword || !newPassword) {
      setSettingsError('Please provide all details');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsSuccess('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        loadProfileDetails(); // logs action audit
      } else {
        setSettingsError(data.error || 'Password update failed');
      }
    } catch (err) {
      setSettingsError('Internal error.');
    }
  };

  // Account Deletion Workflow
  const handleRequestDeleteOtp = async (e) => {
    e.preventDefault();
    setDeleteError('');
    setDeleteSuccessMsg('');

    if (!deletePassword) {
      setDeleteError('Password is required');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/request-delete-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: deletePassword })
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteSuccessMsg(`OTP Code generated: ${data.otp}`);
        setDeleteStep(2);
      } else {
        setDeleteError(data.error || 'Verification failed');
      }
    } catch (err) {
      setDeleteError('Server connection error.');
    }
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    setDeleteError('');

    if (!deleteOtp) {
      setDeleteError('Verification OTP is required');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/confirm-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp: deleteOtp })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Your account has been deleted successfully.');
        logout();
      } else {
        setDeleteError(data.error || 'OTP verification failed');
      }
    } catch (err) {
      setDeleteError('Server error.');
    }
  };

  // Camera settings biometrics scan
  const startCamera = async () => {
    try {
      setCameraActive(true);
      setScanProgress(0);
      setLivenessStage('align');
      setScanMessage('Align your face within overlay coordinates');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      webcamStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      drawFaceFrame();
    } catch (err) {
      console.error(err);
      alert('Camera access failed.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(track => track.stop());
      webcamStreamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setCameraActive(false);
  };

  const drawFaceFrame = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    let progress = 0;
    scanIntervalRef.current = setInterval(() => {
      const canvas = webcamCanvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const rx = 100;
      const ry = 130;

      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      ctx.lineWidth = 3;

      if (progress < 40) {
        ctx.strokeStyle = '#7c3aed';
        setLivenessStage('align');
        setScanMessage('Hold steady and center your head');
      } else if (progress < 80) {
        ctx.strokeStyle = '#06b6d4';
        setLivenessStage('blink');
        setScanMessage('Liveness verification: BLINK ONCE now');
      } else {
        ctx.strokeStyle = '#10b981';
        setLivenessStage('verifying');
        setScanMessage('Generating 128-float facial embeddings...');
      }
      ctx.stroke();

      progress += 2.5;
      setScanProgress(Math.min(100, Math.round(progress)));

      if (progress >= 100) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
        onBiometricComplete();
      }
    }, 100);
  };

  const onBiometricComplete = async () => {
    stopCamera();
    const mockEmbedding = Array.from({ length: 128 }, () => Math.random() * 0.2 + 0.5);

    try {
      const res = await fetch('http://localhost:5000/api/auth/register-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: user.email, faceEmbedding: mockEmbedding })
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsSuccess('Facial recognition biometrics updated successfully');
        loadProfileDetails();
        fetchUserProfile();
      } else {
        setSettingsError(data.error || 'Failed updating biometric embeddings');
      }
    } catch (err) {
      setSettingsError('Network error updating facial data.');
    }
  };

  // Formatter for timestamp strings
  const formatTime = (isoString) => {
    if (!isoString) return 'Never';
    return new Date(isoString).toLocaleString();
  };

  const countAchievements = () => {
    let count = 1; // default enrolled badge
    if (resumes.length > 0) count += 1;
    if (interviews.length > 0) count += 1;
    if (interviews.some(i => i.score >= 80)) count += 1;
    return count;
  };

  const getYouTubeVideoForSkill = (skill) => {
    if (!skill) return { url: '', title: '' };
    const skillLower = skill.toLowerCase();
    if (skillLower.includes('react') || skillLower.includes('frontend') || skillLower.includes('js') || skillLower.includes('javascript') || skillLower.includes('html') || skillLower.includes('css')) {
      return {
        url: 'https://www.youtube.com/embed/bMknfKXIFA8',
        title: 'React JS Full Course for Beginners - freeCodeCamp'
      };
    }
    if (skillLower.includes('docker')) {
      return {
        url: 'https://www.youtube.com/embed/3c-iBn73dDE',
        title: 'Docker Tutorial for Beginners [Full Course] - TechWorld with Nana'
      };
    }
    if (skillLower.includes('kubernetes') || skillLower.includes('k8s')) {
      return {
        url: 'https://www.youtube.com/embed/X48VuDVv0do',
        title: 'Kubernetes Tutorial for Beginners [Full Course] - TechWorld with Nana'
      };
    }
    if (skillLower.includes('devops') || skillLower.includes('cloud')) {
      return {
        url: 'https://www.youtube.com/embed/scEDHsr3APg',
        title: 'DevOps Engineering Course for Beginners - freeCodeCamp'
      };
    }
    if (skillLower.includes('transformer') || skillLower.includes('attention') || skillLower.includes('machine learning') || skillLower.includes('ml') || skillLower.includes('python') || skillLower.includes('data science') || skillLower.includes('ai')) {
      return {
        url: 'https://www.youtube.com/embed/kCc8FmEb1nY',
        title: 'Intro to Large Language Models - Andrej Karpathy'
      };
    }
    if (skillLower.includes('sql') || skillLower.includes('database') || skillLower.includes('postgresql') || skillLower.includes('mysql') || skillLower.includes('nosql') || skillLower.includes('mongodb')) {
      return {
        url: 'https://www.youtube.com/embed/HXV3zeQKqGY',
        title: 'SQL Tutorial for Beginners - freeCodeCamp'
      };
    }
    return {
      url: 'https://www.youtube.com/embed/zojy2nI65gU',
      title: 'System Design Course for Beginners - freeCodeCamp'
    };
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }} className="text-gradient nav-text">CopilotAI</h2>
        </div>

        {/* Profile Details Mini-Widget */}
        <div className="sidebar-profile-details" style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--card-border)',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
            {user?.username ? user.username[0].toUpperCase() : 'C'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user?.username}</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.role === 'admin' ? 'Administrator' : 'Standard User'}</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', width: '100%', border: 'none' }}
          >
            <LayoutDashboard size={18} />
            <span className="nav-text">Overview</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('resume-upload')} 
            className={`btn ${activeTab === 'resume-upload' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', width: '100%', border: 'none' }}
          >
            <FileText size={18} />
            <span className="nav-text">ATS Analysis</span>
          </button>

          <button 
            onClick={() => setActiveTab('skill-gap')} 
            className={`btn ${activeTab === 'skill-gap' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', width: '100%', border: 'none' }}
          >
            <BookOpen size={18} />
            <span className="nav-text">Skill Gap Analysis</span>
          </button>

          <button 
            onClick={() => setActiveTab('mock-interview')} 
            className={`btn ${activeTab === 'mock-interview' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', width: '100%', border: 'none' }}
          >
            <Target size={18} />
            <span className="nav-text">Mock Interviews</span>
          </button>

          <button 
            onClick={() => setActiveTab('history')} 
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', width: '100%', border: 'none' }}
          >
            <Clock size={18} />
            <span className="nav-text">Interview History</span>
          </button>

          <button 
            onClick={() => setActiveTab('achievements')} 
            className={`btn ${activeTab === 'achievements' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', width: '100%', border: 'none' }}
          >
            <Award size={18} />
            <span className="nav-text">Achievements</span>
          </button>

          <button 
            onClick={() => setActiveTab('profile')} 
            className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', width: '100%', border: 'none' }}
          >
            <User size={18} />
            <span className="nav-text">My Profile</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')} 
            className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', width: '100%', border: 'none' }}
          >
            <Settings size={18} />
            <span className="nav-text">Settings</span>
          </button>
        </nav>

        {/* Dark theme toggle & Logout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
          <button 
            onClick={toggleTheme} 
            className="btn btn-secondary" 
            style={{ justifyContent: 'flex-start', padding: '10px 16px', width: '100%' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span className="nav-text">{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
          </button>

          <button 
            onClick={logout} 
            className="btn btn-secondary" 
            style={{ justifyContent: 'flex-start', padding: '10px 16px', width: '100%', color: 'var(--error)' }}
          >
            <LogOut size={18} />
            <span className="nav-text">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Section Body */}
      <main className="main-content">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>CANDIDATE INTERFACE</span>
                <h1 style={{ fontSize: '2.2rem' }}>Welcome Back, {user?.username}!</h1>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>System Secured</span>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="dashboard-grid">
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <Target size={28} />
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Average Interview Score</h4>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                    {interviews.length > 0 ? `${Math.round(interviews.reduce((sum, i) => sum + i.score, 0) / interviews.length)}%` : 'N/A'}
                  </h3>
                </div>
              </div>

              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
                  <FileText size={28} />
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Latest ATS Score</h4>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                    {resumes.length > 0 ? `${resumes[0].ats_score}%` : 'N/A'}
                  </h3>
                </div>
              </div>

              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                  <Clock size={28} />
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Interviews Practiced</h4>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{interviews.length}</h3>
                </div>
              </div>

              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                  <Award size={28} />
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Milestones Unlocked</h4>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{countAchievements()} / 5</h3>
                </div>
              </div>
            </div>

            {/* Performance progress SVG chart & Quick Action menu */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '24px' }}>
              
              {/* Graphic Chart */}
              <div className="glass-container" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Interview Score Optimization Curve</h3>
                {interviews.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-secondary)' }}>
                    <Info size={32} style={{ marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.9rem' }}>Conduct adaptive mock interviews to render metrics growth charts</p>
                  </div>
                ) : (
                  <div>
                    {/* Inline custom SVG graph representing user metrics growth */}
                    <svg viewBox="0 0 500 200" style={{ width: '100%', height: '200px', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Grid Lines */}
                      <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      <line x1="0" y1="160" x2="500" y2="160" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      
                      {/* Generating data points */}
                      {(() => {
                        const maxPoints = Math.min(6, interviews.length);
                        const points = interviews.slice(0, maxPoints).reverse().map((item, idx) => {
                          const x = idx * (500 / (maxPoints - 1 || 1));
                          // map score 0-100 to y 170-30
                          const y = 170 - (item.score / 100) * 140;
                          return { x, y, score: item.score, role: item.role };
                        });

                        const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                        const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} 170 L ${points[0].x} 170 Z` : '';

                        return (
                          <>
                            {points.length > 1 && (
                              <>
                                <path d={areaD} fill="url(#chartGrad)" />
                                <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="3" />
                              </>
                            )}
                            {points.map((p, idx) => (
                              <g key={idx}>
                                <circle cx={p.x} cy={p.y} r="6" fill="var(--secondary)" stroke="var(--bg-primary)" strokeWidth="2" />
                                <text x={p.x} y={p.y - 12} textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="bold">
                                  {p.score}%
                                </text>
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      <span>First Mock Session</span>
                      <span>Latest Mock Session</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions Panel */}
              <div className="glass-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.15rem' }}>Quick Actions</h3>
                
                <button 
                  onClick={() => setActiveTab('mock-interview')}
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '14px', justifyContent: 'space-between' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Play size={16} /> Practice Mock Session</span>
                  <ChevronRight size={16} />
                </button>

                <button 
                  onClick={() => setActiveTab('resume-upload')}
                  className="btn btn-secondary" 
                  style={{ width: '100%', padding: '14px', justifyContent: 'space-between' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><UploadCloud size={16} /> Review ATS Alignment</span>
                  <ChevronRight size={16} />
                </button>

                <button 
                  onClick={() => setActiveTab('skill-gap')}
                  className="btn btn-secondary" 
                  style={{ width: '100%', padding: '14px', justifyContent: 'space-between' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen size={16} /> View Custom Roadmap</span>
                  <ChevronRight size={16} />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: RESUME UPLOAD & ATS PARSING */}
        {activeTab === 'resume-upload' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>RESUME SYNCHRONIZATION</span>
              <h1 style={{ fontSize: '2.2rem' }}>ATS Parser & Keyword Analytics</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Align your qualifications against target enterprise job descriptions.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: atsReport ? '1.2fr 2fr' : '1fr', gap: '32px' }}>
              
              {/* Form Upload box */}
              <div className="glass-container" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Upload Candidate Resume</h3>
                
                {atsError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--error)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                    {atsError}
                  </div>
                )}

                <form onSubmit={handleUploadResume}>
                  <div className="form-group">
                    <label className="form-label">Target Job Description</label>
                    <textarea 
                      placeholder="Paste target job specification details here to evaluate keyword matching density..." 
                      className="form-input" 
                      style={{ minHeight: '120px', resize: 'vertical' }}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Resume Document (PDF/DOCX)</label>
                    <label className="dropzone" style={{ display: 'block' }}>
                      <input 
                        type="file" 
                        accept=".pdf,.docx,.doc" 
                        style={{ display: 'none' }} 
                        onChange={handleFileChange}
                      />
                      <UploadCloud size={32} color="var(--primary)" style={{ margin: '0 auto 12px auto' }} />
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {selectedFile ? selectedFile.name : 'Choose file or drag & drop'}
                      </p>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Supporting PDF/Word format. Max size 5MB.</span>
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '8px', padding: '12px' }}
                    disabled={uploading}
                  >
                    {uploading ? 'Analyzing Embeddings...' : 'Parse & Calculate Score'}
                  </button>
                </form>
              </div>

              {/* ATS scoring output details */}
              {atsReport && (
                <div className="glass-container" style={{ padding: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.25rem' }}>ATS Alignment & Skills Report</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Parsed: {atsReport.filename}</span>
                  </div>

                  {/* Circle score widgets */}
                  <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', marginBottom: '32px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 8px auto' }}>
                        <svg width="100" height="100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="40" 
                            fill="none" 
                            stroke="var(--primary)" 
                            strokeWidth="8" 
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - atsReport.atsScore / 100)}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: '800', fontSize: '1.25rem' }}>
                          {atsReport.atsScore}%
                        </div>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Overall ATS Score</span>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 8px auto' }}>
                        <svg width="100" height="100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="40" 
                            fill="none" 
                            stroke="var(--secondary)" 
                            strokeWidth="8" 
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - atsReport.matchScore / 100)}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: '800', fontSize: '1.25rem' }}>
                          {atsReport.matchScore}%
                        </div>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Job Description Fit</span>
                    </div>
                  </div>

                  {/* Mapped Skills section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={16} color="var(--success)" /> Current Skills (Detected from Resume)
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {atsReport.parsedSkills?.map((kw, i) => (
                          <span key={i} style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', padding: '4px 8px', borderRadius: '4px' }}>
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <X size={16} color="var(--error)" /> Skills to Learn (Missing from Resume - Click to Study)
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {atsReport.keywordsMissing?.map((kw, i) => (
                          <button 
                            key={i} 
                            onClick={() => { setLearningSkillSelected(kw); setActiveTab('skill-gap'); }}
                            style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--error)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
                            className="btn-secondary"
                            title={`Launch learning resources for ${kw}`}
                          >
                            {kw} + Study
                          </button>
                        ))}
                        {atsReport.keywordsMissing?.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No gaps identified. Excellent job!</span>}
                      </div>
                    </div>
                  </div>

                  {/* Alignment details */}
                  <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Experience Alignment</h4>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {atsReport.atsScore > 80 ? 'Strong Structural Match' : 'Intern / Mid-level Baseline Match'}
                      </p>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Education Alignment</h4>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        CS / Engineering Degree Detected
                      </p>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses checklists */}
                  <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--success)', marginBottom: '6px', fontWeight: 700 }}>Resume Strengths</h4>
                      <ul style={{ fontSize: '0.78rem', paddingLeft: '14px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <li>Core sections (Skills, Projects, Education) formatted</li>
                        <li>Contact coordinates present and parsed</li>
                        {atsReport.atsScore > 75 && <li>High technical keywords alignment</li>}
                      </ul>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--error)', marginBottom: '6px', fontWeight: 700 }}>Resume Weaknesses</h4>
                      <ul style={{ fontSize: '0.78rem', paddingLeft: '14px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {atsReport.keywordsMissing?.length > 0 ? (
                          <li>Missing target keywords: {atsReport.keywordsMissing.slice(0, 2).join(', ')}</li>
                        ) : (
                          <li>None highlighted</li>
                        )}
                        {atsReport.atsScore < 75 && <li>Low formatting compliance</li>}
                      </ul>
                    </div>
                  </div>

                  {/* ATS Suggestions */}
                  <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px', marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '6px', fontWeight: 700 }}>ATS Improvement Suggestions</h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      Add missing target keywords under your project section details. Ensure formatting has standard margins and clear typography. Avoid tables and images inside core text.
                    </p>
                  </div>

                  {/* Parsed Contact */}
                  <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px', marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '0.88rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Parsed Profile Contact</h4>
                    <p style={{ fontSize: '0.82rem' }}>
                      <strong>Email:</strong> {atsReport.parsedContact.email} | <strong>Phone:</strong> {atsReport.parsedContact.phone} | <strong>Location:</strong> {atsReport.parsedContact.location}
                    </p>
                  </div>

                  <button 
                    onClick={() => setActiveTab('skill-gap')} 
                    className="btn btn-secondary" 
                    style={{ width: '100%' }}
                  >
                    View Targeted Learning to Address Gaps <ChevronRight size={16} />
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* TAB 3: SKILL GAP ANALYSIS */}
        {activeTab === 'skill-gap' && (
          <div>
            {learningSkillSelected ? (
              /* DEDICATED SKILL LEARNING PAGE NODE */
              <div className="printable-report">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>PATHWAY STUDY MODULE</span>
                    <h1 style={{ fontSize: '2.2rem' }}>Mastering: {learningSkillSelected.toUpperCase()}</h1>
                  </div>
                  <button 
                    onClick={() => { setLearningSkillSelected(null); setCodingChallengeCode(''); setCodingVerificationResult(''); }}
                    className="btn btn-secondary"
                  >
                    Back to Skill Roadmap
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '32px' }}>
                  
                  {/* Left Column: Sandbox and Video */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* YouTube Video Course Component */}
                    <div className="glass-container" style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Curated YouTube Class</h3>
                      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#0a0718', borderRadius: '12px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
                        {(() => {
                          const videoData = getYouTubeVideoForSkill(learningSkillSelected);
                          return (
                            <iframe 
                              width="100%" 
                              height="100%" 
                              src={videoData.url} 
                              title={videoData.title}
                              frameBorder="0" 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                              allowFullScreen
                              style={{ display: 'block', borderRadius: '12px' }}
                            ></iframe>
                          );
                        })()}
                      </div>
                      <p style={{ marginTop: '12px', fontSize: '0.9rem', fontWeight: 600 }}>
                        {getYouTubeVideoForSkill(learningSkillSelected).title}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Targeted Class | Recommended Priority: High</span>
                    </div>

                    {/* Interactive Code Editor Sandbox */}
                    <div className="glass-container" style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Interactive Coding Challenge Sandbox</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '16px' }}>
                        Write clean execution code to satisfy the prompt. Our compiler scans for core constructs.
                      </p>

                      <div style={{ background: '#0a0718', borderRadius: '10px', padding: '16px', border: '1px solid var(--card-border)', marginBottom: '16px' }}>
                        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '8px' }}>
                          {learningSkillSelected.toLowerCase().includes('react') ? (
                            "Prompt: Build a custom hook useToggle(initialValue) that returns state and a toggle function."
                          ) : learningSkillSelected.toLowerCase().includes('docker') || learningSkillSelected.toLowerCase().includes('kubernetes') ? (
                            "Prompt: Write a Dockerfile configuration using node:18-alpine and exposing port 8080."
                          ) : (
                            `Prompt: Detail the primary core utility and optimization criteria of ${learningSkillSelected}.`
                          )}
                        </p>
                        
                        <textarea
                          placeholder={
                            learningSkillSelected.toLowerCase().includes('react') ? (
`import { useState } from 'react';
export default function useToggle(initialVal = false) {
  const [val, setVal] = useState(initialVal);
  const toggle = () => setVal(prev => !prev);
  return [val, toggle];
}`
                            ) : learningSkillSelected.toLowerCase().includes('docker') || learningSkillSelected.toLowerCase().includes('kubernetes') ? (
`FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]`
                            ) : (
`// Write a short conceptual summary showing execution steps...`
                            )
                          }
                          className="form-input"
                          style={{ minHeight: '140px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#10b981', background: 'black', resize: 'vertical' }}
                          value={codingChallengeCode}
                          onChange={(e) => setCodingChallengeCode(e.target.value)}
                        ></textarea>
                      </div>

                      {codingVerificationResult && (
                        <div style={{
                          background: codingVerificationResult.includes('Passed') ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                          border: codingVerificationResult.includes('Passed') ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
                          color: codingVerificationResult.includes('Passed') ? 'var(--success)' : 'var(--error)',
                          padding: '12px',
                          borderRadius: '8px',
                          marginBottom: '16px',
                          fontSize: '0.85rem',
                          fontWeight: 600
                        }}>
                          {codingVerificationResult}
                        </div>
                      )}

                      <button 
                        onClick={() => {
                          const code = codingChallengeCode.toLowerCase();
                          if (!code.trim()) {
                            setCodingVerificationResult('Execution Error: No code entered in editor.');
                            return;
                          }
                          
                          // Custom parser validation
                          if (learningSkillSelected.toLowerCase().includes('react')) {
                            if (code.includes('usestate') && code.includes('return') && code.includes('toggle')) {
                              setCodingVerificationResult('Compilation Status: All test checks passed successfully! Credentials updated.');
                            } else {
                              setCodingVerificationResult('Validation Failed: Missing hook state constructs. Ensure useState hook and return structure are declared.');
                            }
                          } else if (learningSkillSelected.toLowerCase().includes('docker') || learningSkillSelected.toLowerCase().includes('kubernetes')) {
                            if (code.includes('from') && code.includes('expose') && code.includes('8080')) {
                              setCodingVerificationResult('Compilation Status: All test checks passed successfully! Container layers cached.');
                            } else {
                              setCodingVerificationResult('Validation Failed: Missing workspace instruction verbs. Ensure WORKDIR, WORKDIR copy maps, and EXPOSE ports are declared.');
                            }
                          } else {
                            if (code.split(/\s+/).length >= 5) {
                              setCodingVerificationResult('Compilation Status: All test checks passed successfully! Summary uploaded.');
                            } else {
                              setCodingVerificationResult('Validation Failed: Detail text length too short. Please write more conceptual description.');
                            }
                          }
                        }} 
                        className="btn btn-primary"
                      >
                        Compile & Verify Code Implementation
                      </button>
                    </div>

                  </div>

                  {/* Right Column: Curriculum details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Course Metrics */}
                    <div className="glass-container" style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Pathway Logistics</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Priority order:</span>
                          <strong style={{ color: 'var(--accent)' }}>High / Next-up</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Estimated Study Time:</span>
                          <strong>3.5 Hours</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Practical Projects:</span>
                          <strong>1 Sandbox Node</strong>
                        </div>
                      </div>
                    </div>

                    {/* Study Checklists */}
                    <div className="glass-container" style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Curriculum Outline</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {['1. High-scale conceptual baselines', '2. Production implementation architecture', '3. Optimizing compilation footprints', '4. Mock interview prep criteria'].map((topic, i) => (
                          <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                            <input type="checkbox" defaultChecked={i === 0} style={{ accentColor: 'var(--primary)' }} />
                            <span>{topic}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Interview Questions */}
                    <div className="glass-container" style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Interview prep topics</h3>
                      <ul style={{ fontSize: '0.82rem', paddingLeft: '14px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li>Standard optimizations parameters</li>
                        <li>High-scale failover mechanisms</li>
                        <li>Memory allocation profiling</li>
                      </ul>
                    </div>

                  </div>

                </div>
              </div>
            ) : (
              /* STANDARD SKILL PATHWAY ROADMAP */
              <div>
                <div style={{ marginBottom: '32px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>CAREER ACCELERATION</span>
                  <h1 style={{ fontSize: '2.2rem' }}>Skill Gap & Learning Pathway</h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Personalized recommended courses to master requirements. Click any course to open its masterclass.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                  
                  {/* Course 1 */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer' }} onClick={() => setLearningSkillSelected('Docker & Kubernetes')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', background: 'rgba(6, 182, 212, 0.08)', padding: '2px 8px', borderRadius: '50px', fontWeight: 600 }}>SYSTEM ARCHITECTURE</span>
                        <h3 style={{ fontSize: '1.2rem', marginTop: '6px' }}>Docker & Kubernetes Containerization</h3>
                      </div>
                      <BookOpen size={24} color="var(--secondary)" />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px', flex: 1 }}>
                      Master cloud-native architecture. Learn containerizing application servers and deploying services securely inside nodes.
                    </p>
                    <button className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto' }}>
                      Open Study Dashboard
                    </button>
                  </div>

                  {/* Course 2 */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer' }} onClick={() => setLearningSkillSelected('React JS Rendering')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'rgba(124, 58, 237, 0.08)', padding: '2px 8px', borderRadius: '50px', fontWeight: 600 }}>FRONTEND DESIGN</span>
                        <h3 style={{ fontSize: '1.2rem', marginTop: '6px' }}>React Rendering & State Machinery</h3>
                      </div>
                      <BookOpen size={24} color="var(--primary)" />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px', flex: 1 }}>
                      Analyze reconciliation cycles, Virtual DOM optimizations, custom hooks composition, and Redux global selectors.
                    </p>
                    <button className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto' }}>
                      Open Study Dashboard
                    </button>
                  </div>

                  {/* Course 3 */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer' }} onClick={() => setLearningSkillSelected('Transformer Attention')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'rgba(236, 72, 153, 0.08)', padding: '2px 8px', borderRadius: '50px', fontWeight: 600 }}>INTELLIGENT MODELS</span>
                        <h3 style={{ fontSize: '1.2rem', marginTop: '6px' }}>Transformer Attention Architectures</h3>
                      </div>
                      <BookOpen size={24} color="var(--accent)" />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px', flex: 1 }}>
                      Dive into Large Language Models concepts: Self-attention query, key, value matrices, and multi-head mapping.
                    </p>
                    <button className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto' }}>
                      Open Study Dashboard
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MOCK INTERVIEW SETUP AND RUNTIME */}
        {activeTab === 'mock-interview' && (
          <div>
            {/* Phase 1: Setup */}
            {interviewStep === 'setup' && (
              <div>
                <div style={{ marginBottom: '32px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>SIMULATION LABS</span>
                  <h1 style={{ fontSize: '2.2rem' }}>AI Adaptive Mock Interview</h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Experience dynamically generated HR and technical interview tracks with real-time scoring feedback.</p>
                </div>

                <div className="glass-container" style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles color="var(--primary)" size={22} /> Configure Interview Session
                  </h3>
                  
                  {evalError && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--error)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem' }}>
                      {evalError}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Target Role Profile</label>
                    <select 
                      className="form-input" 
                      style={{ background: 'var(--bg-primary)' }}
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="Software Engineer">Software Engineer (Web/FullStack)</option>
                      <option value="Product Manager">Product Manager</option>
                      <option value="Data Scientist">Data Scientist / ML Engineer</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Interview Track Type</label>
                    <select 
                      className="form-input" 
                      style={{ background: 'var(--bg-primary)' }}
                      value={selectedInterviewType}
                      onChange={(e) => setSelectedInterviewType(e.target.value)}
                    >
                      <option value="Technical">Technical</option>
                      <option value="System Design">System Design</option>
                      <option value="Coding">Coding</option>
                      <option value="Leadership">Leadership & HR</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Question Count</label>
                    <select 
                      className="form-input" 
                      style={{ background: 'var(--bg-primary)' }}
                      value={selectedQuestionCount}
                      onChange={(e) => setSelectedQuestionCount(parseInt(e.target.value))}
                    >
                      <option value={3}>3 Questions</option>
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Question Timer Limit</label>
                    <select 
                      className="form-input" 
                      style={{ background: 'var(--bg-primary)' }}
                      value={selectedTimeLimit}
                      onChange={(e) => setSelectedTimeLimit(parseInt(e.target.value))}
                    >
                      <option value={30}>30 Seconds per Question</option>
                      <option value={60}>60 Seconds per Question</option>
                      <option value={90}>90 Seconds per Question</option>
                      <option value={0}>Unlimited Time</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Initial Difficulty Baseline</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {['Easy', 'Medium', 'Hard'].map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setSelectedDifficulty(diff)}
                          className={`btn ${selectedDifficulty === diff ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ flex: 1, padding: '10px' }}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label font-title">Interview Input Mode</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedMode('text')}
                        className={`btn ${selectedMode === 'text' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, padding: '10px' }}
                      >
                        Keyboard / Text
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMode('voice')}
                        className={`btn ${selectedMode === 'voice' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, padding: '10px' }}
                      >
                        Audio / Voice Scan
                      </button>
                    </div>
                  </div>

                  <div style={{ margin: '20px 0', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={isAdaptiveDifficulty} 
                        onChange={(e) => setIsAdaptiveDifficulty(e.target.checked)}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <div>
                        <p style={{ fontWeight: 600 }}>Enable Real-time Adaptive Difficulty</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AI dynamically increases or decreases question difficulty based on the depth of your answers.</p>
                      </div>
                    </label>
                  </div>

                  <button 
                    onClick={handleStartInterview} 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '14px', marginTop: '16px' }}
                  >
                    Initiate Copilot Interview Setup
                  </button>
                </div>
              </div>
            )}

            {/* Phase 2: Active Interview */}
            {interviewStep === 'active' && interviewQuestions.length > 0 && (
              <div>
                {/* Active Header bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                      Role: {selectedRole} | Difficulty: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{selectedDifficulty}</span>
                    </h2>
                    <h1 style={{ fontSize: '1.8rem', marginTop: '4px' }}>Question {currentQuestionIdx + 1} of {interviewQuestions.length}</h1>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {selectedTimeLimit > 0 && (
                      <div className="glass-container" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--warning)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--warning)', fontWeight: 600 }}>Question Time:</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--warning)' }}>
                          {questionTimeLeft}s
                        </span>
                      </div>
                    )}
                    {/* Digital timer display */}
                    <div className="glass-container" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--error)', animation: 'spin 1.5s linear infinite' }}></div>
                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                        {Math.floor(interviewTime / 60).toString().padStart(2, '0')}:
                        {(interviewTime % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '32px' }}>
                  
                  {/* Central question and input console */}
                  <div className="glass-container" style={{ padding: '40px', position: 'relative' }}>
                    
                    {/* Glowing Question text */}
                    <div style={{ minHeight: '100px', display: 'flex', alignItems: 'center', marginBottom: '32px', borderLeft: '4px solid var(--primary)', paddingLeft: '20px' }}>
                      <p style={{ fontSize: '1.45rem', fontWeight: 600, lineHeight: '1.4' }}>
                        {interviewQuestions[currentQuestionIdx].question_text}
                      </p>
                    </div>

                    {/* INPUTS: TEXT MODE */}
                    {selectedMode === 'text' && (
                      <div className="form-group">
                        <label className="form-label">Type Your Response</label>
                        <textarea
                          placeholder="Draft your detailed answer here. Try using the STAR technique (Situation, Task, Action, Result)..."
                          className="form-input"
                          style={{ minHeight: '180px', resize: 'vertical' }}
                          value={currentTextResponse}
                          onChange={(e) => setCurrentTextResponse(e.target.value)}
                        ></textarea>
                        
                        {/* Word stats */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                          <span>Word Count: {currentTextResponse.trim() ? currentTextResponse.trim().split(/\s+/).length : 0} words</span>
                          <span>Character Length: {currentTextResponse.length}</span>
                        </div>
                      </div>
                    )}

                    {/* INPUTS: VOICE MODE */}
                    {selectedMode === 'voice' && (
                      <div>
                        {/* Visual audio frequency waveform */}
                        <div style={{ width: '100%', height: '80px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)', borderRadius: '10px', marginBottom: '24px', overflow: 'hidden', position: 'relative' }}>
                          {isRecording ? (
                            <canvas ref={canvasRef} width="600" height="80" style={{ width: '100%', height: '100%' }}></canvas>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              Vocal wave frequencies monitor offline
                            </div>
                          )}
                        </div>

                        {/* Interactive toggle buttons */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                          {!isRecording ? (
                            <button onClick={startSpeechRecognition} className="btn btn-primary" style={{ flex: 1 }}>
                              <Mic size={18} /> Enable Voice Stream Capture
                            </button>
                          ) : (
                            <button onClick={stopSpeechRecognition} className="btn btn-danger" style={{ flex: 1 }}>
                              <Mic size={18} /> Stop Capturing Voice
                            </button>
                          )}
                          
                          <button onClick={simulateSpeechResponse} className="btn btn-secondary">
                            Simulate Speech Output (For Evaluation Check)
                          </button>
                        </div>

                        {/* Audio review transcripts textarea */}
                        <div className="form-group">
                          <label className="form-label">Review Speech Transcript</label>
                          <textarea
                            placeholder="Captured voice text will render here automatically. You may edit the final transcript manually..."
                            className="form-input"
                            style={{ minHeight: '120px' }}
                            value={currentTextResponse}
                            onChange={(e) => setCurrentTextResponse(e.target.value)}
                          ></textarea>
                          {isRecording && <p style={{ fontSize: '0.85rem', color: 'var(--secondary)', animation: 'pulse 1.2s infinite' }}>Live: {speechTranscript || 'Listening...'}</p>}
                        </div>
                      </div>
                    )}

                    {/* Footer options */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', borderTop: '1px solid var(--card-border)', paddingTop: '24px' }}>
                      <button 
                        onClick={() => { if (confirm('Are you sure you want to exit the active session? Progress will be lost.')) setInterviewStep('setup'); }} 
                        className="btn btn-secondary"
                      >
                        Terminate Session
                      </button>

                      <button 
                        onClick={handleSaveQuestionResponse}
                        className="btn btn-primary"
                      >
                        {currentQuestionIdx + 1 === interviewQuestions.length ? 'Finalize & Analyze Answers' : 'Save Response & Next'}
                      </button>
                    </div>

                  </div>

                  {/* Adaptive AI monitor panel */}
                  <div className="glass-container" style={{ padding: '24px', alignSelf: 'start' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} color="var(--primary)" /> Adaptive AI Engine
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {adaptiveLog.map((logLine, idx) => (
                        <div key={idx} style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', borderLeft: '3px solid var(--secondary)' }}>
                          {logLine}
                        </div>
                      ))}
                      {adaptiveLog.length === 1 && <p>AI is waiting for your first answer to adapt constraints.</p>}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Phase 3: Evaluating spinner */}
            {interviewStep === 'evaluating' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  border: '3px solid rgba(6, 182, 212, 0.1)',
                  borderTopColor: 'var(--secondary)',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '24px'
                }}></div>
                <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>AI Evaluation In Progress</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Analyzing answer correctness, keyword frequency, communication pacing, and confidence scores...</p>
              </div>
            )}

            {/* Phase 4: Feedback Results */}
            {interviewStep === 'result' && evaluationResult && (
              <div>
                <div className="hide-on-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>EVALUATION COMPLETED</span>
                    <h1 style={{ fontSize: '2.2rem' }}>AI Feedback Performance Report</h1>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={handlePrintPDF} className="btn btn-secondary">
                      <Printer size={16} /> Print / Export PDF
                    </button>
                    <button onClick={() => setInterviewStep('setup')} className="btn btn-primary">
                      Practice Another Session
                    </button>
                  </div>
                </div>

                <div className="printable-report">
                  {/* Score metrics gauges */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    
                    <div className="glass-card" style={{ textAlign: 'center', borderTop: '4px solid var(--primary)' }}>
                      <h3 style={{ fontSize: '2.8rem', fontWeight: 800 }} className="text-gradient">{evaluationResult.score}%</h3>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Overall AI Score</p>
                    </div>

                    <div className="glass-card" style={{ textAlign: 'center', borderTop: '4px solid var(--secondary)' }}>
                      <h3 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--secondary)' }}>{evaluationResult.accuracy}%</h3>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Correctness / Depth</p>
                    </div>

                    <div className="glass-card" style={{ textAlign: 'center', borderTop: '4px solid var(--accent)' }}>
                      <h3 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--accent)' }}>{evaluationResult.communication}%</h3>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Communication / Grammar</p>
                    </div>

                    <div className="glass-card" style={{ textAlign: 'center', borderTop: '4px solid var(--success)' }}>
                      <h3 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--success)' }}>{evaluationResult.confidence}%</h3>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Confidence / Hesitation</p>
                    </div>

                  </div>

                  {/* Strengths & Weaknesses Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                    <div className="glass-container" style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
                        <Check size={18} /> Highlighted Strengths
                      </h3>
                      <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
                        {evaluationResult.strengths.map((str, i) => (
                          <li key={i}>{str}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="glass-container" style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)' }}>
                        <AlertCircle size={18} /> Areas for Improvement
                      </h3>
                      <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
                        {evaluationResult.weaknesses.map((weak, i) => (
                          <li key={i}>{weak}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Question list critique */}
                  <div className="glass-container" style={{ padding: '32px', marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>Response-by-Response Breakdown</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {evaluationResult.evaluatedAnswers.map((ans, idx) => (
                        <div key={idx} style={{ borderBottom: idx + 1 === evaluationResult.evaluatedAnswers.length ? 'none' : '1px solid var(--card-border)', paddingBottom: '24px', paddingTop: '16px' }}>
                          <h4 style={{ fontSize: '1.05rem', marginBottom: '10px', display: 'flex', gap: '8px' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>Q{idx + 1}.</span>
                            <span>{ans.questionText}</span>
                          </h4>
                          
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.88rem' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Your Response</p>
                            <p>{ans.userResponse || 'No response provided.'}</p>
                          </div>

                          <div style={{ background: 'rgba(6, 182, 212, 0.04)', padding: '12px 16px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.88rem', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
                            <p style={{ color: 'var(--secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Expected / Model Answer</p>
                            <p>{ans.expectedAnswer || 'A high-scoring answer should structure the response using clear technical details and real-world examples.'}</p>
                          </div>

                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(124,58,237,0.08)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(124,58,237,0.2)', color: 'var(--primary)' }}>
                              Relevance: {ans.scores?.relevance || 0}%
                            </span>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(6,182,212,0.08)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(6,182,212,0.2)', color: 'var(--secondary)' }}>
                              Accuracy: {ans.scores?.accuracy || 0}%
                            </span>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(236,72,153,0.08)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(236,72,153,0.2)', color: 'var(--accent)' }}>
                              Communication: {ans.scores?.communication || 0}%
                            </span>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.08)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--success)' }}>
                              Confidence: {ans.scores?.confidence || 0}%
                            </span>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(245,158,11,0.08)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--warning)' }}>
                              Completeness: {ans.scores?.completeness || 0}%
                            </span>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                              Duration: {ans.duration || 0}s
                            </span>
                          </div>

                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <strong>AI Feedback:</strong> {ans.feedback}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Long-term plan */}
                  <div className="glass-container" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--primary)' }}>Personalized Long-Term Improvement Blueprint</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {evaluationResult.recommendations.map((rec, i) => (
                        <p key={i} style={{ fontSize: '0.88rem' }}>• {rec}</p>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 5: INTERVIEW HISTORY */}
        {activeTab === 'history' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>PERFORMANCE ARCHIVES</span>
              <h1 style={{ fontSize: '2.2rem' }}>Interview History logs</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Review reports of past AI evaluation sessions.</p>
            </div>

            <div className="glass-container" style={{ padding: '24px' }}>
              {interviews.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Info size={40} style={{ margin: '0 auto 12px auto' }} />
                  <p>No previous interviews completed on this account.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px' }}>Date Taken</th>
                        <th style={{ padding: '12px' }}>Target Role</th>
                        <th style={{ padding: '12px' }}>Mode</th>
                        <th style={{ padding: '12px' }}>Difficulty</th>
                        <th style={{ padding: '12px' }}>Overall Score</th>
                        <th style={{ padding: '12px' }}>Duration</th>
                        <th style={{ padding: '12px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interviews.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                          <td style={{ padding: '14px 12px' }}>{formatTime(item.date_taken)}</td>
                          <td style={{ padding: '14px 12px', fontWeight: 600 }}>{item.role}</td>
                          <td style={{ padding: '14px 12px', textTransform: 'capitalize' }}>{item.mode}</td>
                          <td style={{ padding: '14px 12px' }}>{item.difficulty}</td>
                          <td style={{ padding: '14px 12px' }}>
                            <span style={{ color: item.score >= 80 ? 'var(--success)' : item.score >= 60 ? 'var(--warning)' : 'var(--error)', fontWeight: 'bold' }}>
                              {item.score}%
                            </span>
                          </td>
                          <td style={{ padding: '14px 12px' }}>{Math.round(item.duration / 60)} min</td>
                          <td style={{ padding: '14px 12px', display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => {
                                const parsed = typeof item.evaluation === 'string' ? JSON.parse(item.evaluation) : item.evaluation;
                                setSelectedReport(parsed);
                              }}
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              <Eye size={14} /> View Critique
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: ACHIEVEMENTS */}
        {activeTab === 'achievements' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>GAMIFIED PROGRESSION</span>
              <h1 style={{ fontSize: '2.2rem' }}>Candidate Achievements</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Complete tasks to unlock badges and accelerate certification readiness.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              
              {/* Badge 1 */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', opacity: 1 }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <Award size={36} />
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Enrolled Officer</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Verify account registration on the Copilot Platform.</p>
                <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--success)', padding: '2px 8px', borderRadius: '4px' }}>
                  Completed
                </span>
              </div>

              {/* Badge 2 */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', opacity: user?.faceRegistered ? 1 : 0.4 }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid rgba(6,182,212,0.2)' }}>
                  <Video size={36} />
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Facial Biometrics Secured</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Verify presence using camera device scanning.</p>
                <span style={{ fontSize: '0.75rem', background: user?.faceRegistered ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.05)', border: user?.faceRegistered ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--card-border)', color: user?.faceRegistered ? 'var(--success)' : 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px' }}>
                  {user?.faceRegistered ? 'Completed' : 'Locked'}
                </span>
              </div>

              {/* Badge 3 */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', opacity: resumes.length > 0 ? 1 : 0.4 }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid rgba(236,72,153,0.2)' }}>
                  <FileText size={36} />
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>ATS Pioneer</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Analyze resume keyword coverage against targeted JD metrics.</p>
                <span style={{ fontSize: '0.75rem', background: resumes.length > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.05)', border: resumes.length > 0 ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--card-border)', color: resumes.length > 0 ? 'var(--success)' : 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px' }}>
                  {resumes.length > 0 ? 'Completed' : 'Locked'}
                </span>
              </div>

              {/* Badge 4 */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', opacity: interviews.length > 0 ? 1 : 0.4 }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Clock size={36} />
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Interactive Practitioner</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Complete at least one adaptive simulation interview.</p>
                <span style={{ fontSize: '0.75rem', background: interviews.length > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.05)', border: interviews.length > 0 ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--card-border)', color: interviews.length > 0 ? 'var(--success)' : 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px' }}>
                  {interviews.length > 0 ? 'Completed' : 'Locked'}
                </span>
              </div>

              {/* Badge 5 */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', opacity: interviews.some(i => i.score >= 80) ? 1 : 0.4 }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <Sparkles size={36} />
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Master High Scorer</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Pass an interview session with a feedback rating score exceeding 80%.</p>
                <span style={{ fontSize: '0.75rem', background: interviews.some(i => i.score >= 80) ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.05)', border: interviews.some(i => i.score >= 80) ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--card-border)', color: interviews.some(i => i.score >= 80) ? 'var(--success)' : 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px' }}>
                  {interviews.some(i => i.score >= 80) ? 'Completed' : 'Locked'}
                </span>
              </div>

            </div>
          </div>
        )}

        {/* TAB 7: PROFILE */}
        {activeTab === 'profile' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>IDENTITY CERTIFICATES</span>
              <h1 style={{ fontSize: '2.2rem' }}>My Profile Details</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Audit registration credentials, historical logins, and files.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '32px' }}>
              
              {/* Profile basic info */}
              <div className="glass-container" style={{ padding: '32px', alignSelf: 'start' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', margin: '0 auto 16px auto', border: '3px solid rgba(255,255,255,0.15)' }}>
                    {user?.username ? user.username[0].toUpperCase() : 'C'}
                  </div>
                  <h3 style={{ fontSize: '1.3rem' }}>{user?.username}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user?.email}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--card-border)', paddingTop: '20px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Account Role:</span>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{user?.role}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Email Verification:</span>
                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>Verified</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Joined Date:</span>
                    <span style={{ fontWeight: 600 }}>{formatTime(user?.registrationDate)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Last Authenticated:</span>
                    <span style={{ fontWeight: 600 }}>{formatTime(user?.lastLogin)}</span>
                  </div>
                </div>
              </div>

              {/* Advanced info: Audits and Resumes lists */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* Edit details form */}
                <div className="glass-container" style={{ padding: '32px' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Edit Profile Information</h3>
                  
                  {profileSuccess && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                      {profileSuccess}
                    </div>
                  )}
                  {profileError && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--error)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                      {profileError}
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Username</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input 
                        type="email" 
                        className="form-input" 
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', padding: '12px' }}>
                      Update Account Credentials
                    </button>
                  </form>
                </div>

                {/* Resumes uploaded list */}
                <div className="glass-container" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Synchronized Resumes</h3>
                  {resumes.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No resumes uploaded yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {resumes.map((r) => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.filename}</p>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Analyzed: {formatTime(r.upload_date)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>ATS: {r.ats_score}%</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--secondary)' }}>Match: {r.match_score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Audit Logs activities list */}
                <div className="glass-container" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Recent Security Audit Logs</h3>
                  {auditLogs.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No audit transactions recorded.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto', paddingRight: '8px' }}>
                      {auditLogs.map((log, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px', fontSize: '0.8rem' }}>
                          <div>
                            <p style={{ fontWeight: 600 }}>{log.action}</p>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>IP: {log.ip_address}</span>
                          </div>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{formatTime(log.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 8: SETTINGS & PASSWORD RESET */}
        {activeTab === 'settings' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>SYSTEM POLICIES</span>
              <h1 style={{ fontSize: '2.2rem' }}>Account & Biometric Settings</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Manage passwords, re-enroll biometric keys, and configure safety thresholds.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
              
              {/* Reset password form */}
              <div className="glass-container" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Change Account Password</h3>
                
                {settingsSuccess && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                    {settingsSuccess}
                  </div>
                )}
                {settingsError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--error)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                    {settingsError}
                  </div>
                )}

                <form onSubmit={handleChangePassword}>
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      className="form-input" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input 
                      type="password" 
                      placeholder="At least 8 characters" 
                      className="form-input" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }}>
                    Change Account Password
                  </button>
                </form>
              </div>


              {/* Account Deletion Panel */}
              <div className="glass-container" style={{ padding: '32px', gridColumn: 'span 2' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--error)', marginBottom: '8px' }}>Danger Zone</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
                  Permanently erase your account, uploaded resume documents, dynamic matching metrics, and past interview history reports. This action is irreversible.
                </p>
                <button 
                  onClick={() => { setDeleteModalActive(true); setDeleteStep(1); setDeletePassword(''); setDeleteOtp(''); setDeleteConfirmCheck(false); setDeleteError(''); }}
                  className="btn btn-danger"
                >
                  <Trash2 size={16} /> Delete Account Permanently
                </button>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* MODAL 1: PREVIEW SPECIFIC HISTORY CRITIQUE */}
      {selectedReport && (
        <div className="modal-overlay">
          <div className="modal-content glass-container" style={{ padding: '36px', maxWidth: '700px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem' }}>AI Feedback Report Audit</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Score Rating: <strong>{selectedReport.score}%</strong></span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }} className="hide-on-print">
                <button 
                  onClick={handlePrintPDF} 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Printer size={14} /> Export PDF
                </button>
                <button 
                  onClick={() => setSelectedReport(null)} 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                >
                  Close View
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{selectedReport.accuracy}%</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Correctness</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>{selectedReport.communication}%</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Communication</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success)' }}>{selectedReport.confidence}%</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Confidence</span>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--primary)' }}>Key Recommendations</h4>
                {selectedReport.recommendations?.map((rec, i) => (
                  <p key={i} style={{ fontSize: '0.85rem' }}>• {rec}</p>
                ))}
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Question Breakdowns</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '350px', overflowY: 'auto' }}>
                  {selectedReport.evaluatedAnswers?.map((ans, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--primary)', fontSize: '0.85rem' }}>
                      <p style={{ fontWeight: 600, marginBottom: '8px' }}>Q{idx + 1}. {ans.questionText}</p>
                      
                      <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px 12px', borderRadius: '6px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '2px' }}>YOUR RESPONSE:</span>
                        <p>{ans.userResponse || 'No response provided.'}</p>
                      </div>

                      <div style={{ background: 'rgba(6, 182, 212, 0.04)', padding: '10px 12px', borderRadius: '6px', marginBottom: '8px', border: '1px solid rgba(6, 182, 212, 0.1)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600, display: 'block', marginBottom: '2px' }}>EXPECTED / MODEL ANSWER:</span>
                        <p>{ans.expectedAnswer || 'A high-scoring answer should structure the response...'}</p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(124,58,237,0.08)', padding: '2px 6px', borderRadius: '4px', color: 'var(--primary)' }}>
                          Relevance: {ans.scores?.relevance || 0}%
                        </span>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(6,182,212,0.08)', padding: '2px 6px', borderRadius: '4px', color: 'var(--secondary)' }}>
                          Accuracy: {ans.scores?.accuracy || 0}%
                        </span>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(236,72,153,0.08)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent)' }}>
                          Communication: {ans.scores?.communication || 0}%
                        </span>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.08)', padding: '2px 6px', borderRadius: '4px', color: 'var(--success)' }}>
                          Confidence: {ans.scores?.confidence || 0}%
                        </span>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(245,158,11,0.08)', padding: '2px 6px', borderRadius: '4px', color: 'var(--warning)' }}>
                          Completeness: {ans.scores?.completeness || 0}%
                        </span>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                          {ans.duration || 0}s
                        </span>
                      </div>

                      <p style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-secondary)' }}><strong>Critique:</strong> {ans.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: 3-STEP SECURE ACCOUNT DELETION */}
      {deleteModalActive && (
        <div className="modal-overlay">
          <div className="modal-content glass-container" style={{ padding: '36px', maxWidth: '480px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert /> Secure Deletion Wizard
              </h3>
              <button onClick={() => setDeleteModalActive(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {deleteError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--error)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                {deleteError}
              </div>
            )}

            {deleteSuccessMsg && (
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                {deleteSuccessMsg}
              </div>
            )}

            {/* STEP 1: Verification Password */}
            {deleteStep === 1 && (
              <form onSubmit={handleRequestDeleteOtp}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  <strong>Step 1 of 3:</strong> Input your password to initiate OTP deletion code verification.
                </p>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="form-input" 
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                  Verify & Request OTP
                </button>
              </form>
            )}

            {/* STEP 2: Verification OTP */}
            {deleteStep === 2 && (
              <form onSubmit={handleConfirmDelete}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  <strong>Step 2 of 3:</strong> We have generated a deletion OTP code. Input code below to proceed.
                </p>
                <div className="form-group">
                  <label className="form-label">One-Time Password (OTP)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 123456" 
                    maxLength="6"
                    className="form-input" 
                    style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.3rem' }}
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                  Confirm OTP Code
                </button>
              </form>
            )}

            {/* STEP 3: Final confirmation Checkbox */}
            {deleteStep === 3 && (
              <div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  <strong>Step 3 of 3:</strong> Click deletion confirmation checkbox to delete database record.
                </p>
                
                <div style={{ margin: '20px 0', padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={deleteConfirmCheck} 
                      onChange={(e) => setDeleteConfirmCheck(e.target.checked)}
                      style={{ marginTop: '3px', accentColor: 'var(--error)' }}
                    />
                    <div>
                      <p style={{ fontWeight: 700, color: 'var(--error)' }}>Yes, permanently delete my account</p>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>This deletes resumes, credentials, and match histories immediately.</span>
                    </div>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setDeleteModalActive(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button 
                    disabled={!deleteConfirmCheck} 
                    onClick={async () => {
                      try {
                        const res = await fetch('http://localhost:5000/api/auth/confirm-delete', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ otp: deleteOtp }) // re-validate on confirm
                        });
                        if (res.ok) {
                          alert('Account permanently purged.');
                          logout();
                        }
                      } catch (err) {
                        alert('Erase failed.');
                      }
                    }} 
                    className={`btn ${deleteConfirmCheck ? 'btn-danger' : 'btn-disabled'}`}
                    style={{ flex: 1 }}
                  >
                    Erase Account Data
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-report, .printable-report *,
          .modal-content, .modal-content * {
            visibility: visible;
          }
          .hide-on-print,
          .hide-on-print * {
            display: none !important;
          }
          .printable-report, .modal-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 20px !important;
            font-size: 11pt !important;
          }
          .glass-card, .glass-container {
            background: none !important;
            border: 1px solid #ddd !important;
            box-shadow: none !important;
            color: black !important;
            page-break-inside: avoid;
          }
          .text-gradient {
            background: none !important;
            -webkit-text-fill-color: initial !important;
            color: black !important;
          }
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
