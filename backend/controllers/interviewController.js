import { getDb } from '../config/db.js';

export async function startInterview(req, res) {
  try {
    const { role, difficulty, type, questionCount } = req.body;
    const db = getDb();

    if (!role || !difficulty) {
      return res.status(400).json({ error: 'Role and difficulty are required' });
    }

    // Map user config selection to database categories & difficulties
    let dbDifficulty = difficulty;
    if (difficulty === 'Beginner') dbDifficulty = 'Easy';
    if (difficulty === 'Intermediate') dbDifficulty = 'Medium';
    if (difficulty === 'Advanced') dbDifficulty = 'Hard';

    let dbCategory = null;
    if (type) {
      const typeLower = type.toLowerCase();
      if (typeLower.includes('hr') || typeLower.includes('behavioral') || typeLower.includes('leadership')) {
        dbCategory = 'hr';
      } else if (typeLower.includes('technical') || typeLower.includes('system design') || typeLower.includes('coding') || typeLower.includes('frontend') || typeLower.includes('backend')) {
        dbCategory = 'technical';
      }
    }

    let questions = [];
    if (dbCategory) {
      questions = await db.all(
        'SELECT id, question_text, category FROM question_bank WHERE role = ? AND difficulty = ? AND category = ?',
        [role, dbDifficulty, dbCategory]
      );
    } else {
      questions = await db.all(
        'SELECT id, question_text, category FROM question_bank WHERE role = ? AND difficulty = ?',
        [role, dbDifficulty]
      );
    }

    // Fallbacks if database has no matches
    if (questions.length === 0) {
      questions = [
        { id: 101, question_text: `Explain your core workflow when starting a new project in ${role}.`, category: 'technical' },
        { id: 102, question_text: `What is the most challenging project you have worked on in a ${role} capacity?`, category: 'hr' },
        { id: 103, question_text: `How do you ensure code quality, documentation, and maintainability in your team?`, category: 'technical' },
        { id: 104, question_text: `Why do you want to join our company as a ${role}?`, category: 'hr' },
        { id: 105, question_text: `Describe a situation where you had a disagreement with a team member. How did you resolve it?`, category: 'hr' }
      ];
    }

    // Shuffle questions and select up to requested count
    questions.sort(() => Math.random() - 0.5);
    const limit = parseInt(questionCount) || 5;
    const selectedQuestions = questions.slice(0, limit);

    res.status(200).json({
      message: 'Interview initialized successfully',
      questions: selectedQuestions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper to check for spam/gibberish response
function isSpamResponse(resp) {
  const trimmed = resp.trim().toLowerCase();
  if (!trimmed || trimmed.length < 5) return true;
  
  // Common key-mashing/spam keywords
  const spamTerms = ['asdfg', '12345', 'qwerty', 'zxcvb', 'test', 'spam', 'hello hello', 'blah blah', 'aaaaaa', 'bbbbbb'];
  if (spamTerms.some(term => trimmed.includes(term))) return true;

  // Unique characters count ratio check (e.g. "aaaaaaa" has 1 unique char)
  const nonSpace = trimmed.replace(/\s+/g, '');
  const uniqueChars = new Set(nonSpace).size;
  const totalChars = nonSpace.length;
  if (totalChars > 8 && (uniqueChars / totalChars) < 0.25) {
    return true; // Too repetitive, likely spam
  }

  return false;
}

// Helper to resolve model answers deterministically
function getModelAnswer(questionText) {
  const qLower = questionText.toLowerCase();
  if (qLower.includes('let') && qLower.includes('const')) {
    return 'In JavaScript, var is function-scoped and hoisted. let and const introduce block-scoping. const creates a read-only reference, making it perfect for immutability. Use const by default, let when reassignment is required, and avoid var to prevent scoping leakage.';
  }
  if (qLower.includes('virtual dom') || qLower.includes('reconciliation')) {
    return 'React Virtual DOM is a lightweight memory representation of the real DOM. When state changes, React generates a new Virtual DOM tree, performs a diffing process (Reconciliation) using a heuristic O(n) algorithm, and patches only the changed nodes in the real DOM to minimize paint operations.';
  }
  if (qLower.includes('restful api') || qLower.includes('rest')) {
    return 'A RESTful API is a stateless client-server architecture. Resources are identified by standard URIs, and operations are performed using HTTP methods (GET for retrieval, POST for creation, PUT for updates, DELETE for removal). It utilizes HTTP status codes for standardized response envelopes.';
  }
  if (qLower.includes('whatsapp') || qLower.includes('scalable')) {
    return 'A scalable chat system utilizes persistent full-duplex WebSockets for real-time messaging. An API gateway routes traffic, a message broker (Kafka or RabbitMQ) queues message packets, and an in-memory cache (Redis) tracks user presence, while chat history is stored in a partitioned database like Cassandra.';
  }
  if (qLower.includes('overfitting') || qLower.includes('learning')) {
    return 'Overfitting occurs when a machine learning model fits training data noise rather than generalized patterns. Mitigate by using cross-validation, applying L1/L2 regularization penalties to restrict weights, introducing dropout layers in neural networks, or gathering more training samples.';
  }
  return 'A high-scoring response should structure the answer using the STAR method: explain the Situation or context, define the specific Task and technical constraints, detail the direct Action taken, and summarize the business or performance Result.';
}

export async function submitInterview(req, res) {
  try {
    const userId = req.user.id;
    const { role, difficulty, mode, answers, chatHistory } = req.body; // answers: [{ questionId, questionText, userResponse, duration }]
    const db = getDb();

    if (!role || !difficulty || !answers) {
      return res.status(400).json({ error: 'Missing interview submission data' });
    }

    // Calculate intelligent deterministic sub-scores
    let relevanceSum = 0;
    let accuracySum = 0;
    let communicationSum = 0;
    let confidenceSum = 0;
    let completenessSum = 0;
    let overallSum = 0;
    
    const evaluatedAnswers = answers.map((ans, index) => {
      const resp = ans.userResponse || '';
      const qText = ans.questionText || '';

      // Check for spam mashing
      if (isSpamResponse(resp)) {
        return {
          ...ans,
          scores: {
            relevance: 0,
            accuracy: 0,
            communication: 0,
            confidence: 0,
            completeness: 0,
            overall: 0
          },
          feedback: 'Invalid Response Detected: The answer consists of gibberish, spam, or keyboard mashing. Content must address the question to receive grading.',
          expectedAnswer: getModelAnswer(qText)
        };
      }

      const wordCount = resp.trim().split(/\s+/).length;
      const respLower = resp.toLowerCase();
      
      // 1. Relevance Score: Does it match keywords from the question text?
      const questionWords = qText.toLowerCase().replace(/[?,.]/g, '').split(/\s+/).filter(w => w.length > 3);
      const matchedQWords = questionWords.filter(w => respLower.includes(w));
      let relevance = Math.min(100, Math.round(40 + (matchedQWords.length / Math.max(1, questionWords.length)) * 60));
      
      // 2. Technical Accuracy: presence of standard core domain keywords
      let accuracy = 40;
      const coreTechTerms = ['javascript', 'react', 'hooks', 'node', 'express', 'sql', 'database', 'rest', 'api', 'scrum', 'agile', 'docker', 'python', 'model', 'data', 'scale', 'optimize'];
      const matchedTech = coreTechTerms.filter(term => respLower.includes(term));
      accuracy += matchedTech.length * 10;
      if (wordCount > 15) accuracy += 15;
      accuracy = Math.min(100, Math.round(accuracy));

      // 3. Completeness Score: based on answer word count
      let completeness = Math.min(100, Math.round((wordCount / 35) * 100));
      if (completeness < 30) completeness = 30;

      // 4. Communication Score: check structural properties (sentences, capitalize)
      const hasSentences = resp.includes('.') || resp.includes('?');
      let communication = Math.min(100, Math.round(50 + (wordCount > 15 ? 30 : wordCount * 1.5) + (hasSentences ? 20 : 0)));

      // 5. Confidence Score: subtract points for hesitant/filler words, add for steady pacing
      const fillers = ['um', 'uh', 'like', 'maybe', 'sorry', 'dunno', 'dont know'];
      const fillerMatches = fillers.filter(f => respLower.includes(f));
      let confidence = Math.max(10, Math.round(85 - fillerMatches.length * 15 + (wordCount > 18 ? 15 : 0)));
      confidence = Math.min(100, confidence);

      // Overall Score for individual answer
      const overall = Math.round((relevance + accuracy + communication + confidence + completeness) / 5);

      relevanceSum += relevance;
      accuracySum += accuracy;
      communicationSum += communication;
      confidenceSum += confidence;
      completenessSum += completeness;
      overallSum += overall;

      // Provide qualitative feedback
      let feedback = '';
      if (overall < 50) {
        feedback = 'The answer is too brief and lacks details. Introduce technical examples and structure with Situation, Task, Action, and Result (STAR).';
      } else if (overall < 75) {
        feedback = 'Good attempt. You captured the core concept but could benefit from explaining practical implementations or structural components.';
      } else {
        feedback = 'Excellent answer! You demonstrated solid accuracy and relevance. Your response structure is clear and complete.';
      }

      return {
        ...ans,
        scores: {
          relevance,
          accuracy,
          communication,
          confidence,
          completeness,
          overall
        },
        feedback,
        expectedAnswer: getModelAnswer(qText)
      };
    });

    const numQuestions = answers.length || 1;
    const finalScore = Math.round(overallSum / numQuestions);
    const avgRelevance = Math.round(relevanceSum / numQuestions);
    const avgAccuracy = Math.round(accuracySum / numQuestions);
    const avgCommunication = Math.round(communicationSum / numQuestions);
    const avgConfidence = Math.round(confidenceSum / numQuestions);
    const avgCompleteness = Math.round(completenessSum / numQuestions);

    // Formulate personalized plans
    const strengths = [];
    const weaknesses = [];
    const recommendations = [];

    if (avgAccuracy > 70) {
      strengths.push('Demonstrated strong alignment with technical domain concepts.');
    } else {
      weaknesses.push('Technical responses lack detail and architectural vocabulary.');
      recommendations.push('Study core concepts in the Skill Gap pathway and practice keywords usage.');
    }

    if (avgCommunication > 75) {
      strengths.push('Clear, articulate answer formatting and structured descriptions.');
    } else {
      weaknesses.push('Sentence structuring is brief and occasionally lacks clear pacing.');
      recommendations.push('Structure behavioral answers systematically using the STAR methodology.');
    }

    if (avgConfidence > 80) {
      strengths.push('Vocal fluency is high, avoiding filler words or phrases.');
    } else {
      weaknesses.push('Frequent usage of hesitation expressions (e.g. "like" or "maybe").');
      recommendations.push('Take brief silent pauses before replying to organize thoughts instead of filler words.');
    }

    if (strengths.length === 0) strengths.push('Openness to attempt all simulation prompts.');
    if (weaknesses.length === 0) weaknesses.push('None highlighted. Excellent overall execution.');
    if (recommendations.length === 0) recommendations.push('Review high-scale system design architecture concepts.');

    const evaluation = {
      score: finalScore,
      relevance: avgRelevance,
      accuracy: avgAccuracy,
      communication: avgCommunication,
      confidence: avgConfidence,
      completeness: avgCompleteness,
      evaluatedAnswers,
      strengths,
      weaknesses,
      recommendations
    };

    const duration = answers.reduce((sum, ans) => sum + (ans.duration || 30), 0);

    // Save to database
    await db.run(
      `INSERT INTO interviews (user_id, role, difficulty, mode, score, duration, chat_history, evaluation) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        role,
        difficulty,
        mode || 'text',
        finalScore,
        duration,
        JSON.stringify(chatHistory || evaluatedAnswers),
        JSON.stringify(evaluation)
      ]
    );

    res.status(200).json({
      message: 'Interview submitted and evaluated successfully',
      score: finalScore,
      evaluation
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getInterviewHistory(req, res) {
  try {
    const userId = req.user.id;
    const db = getDb();

    const interviews = await db.all('SELECT * FROM interviews WHERE user_id = ? ORDER BY date_taken DESC', [userId]);

    const formatted = interviews.map(i => ({
      ...i,
      chat_history: JSON.parse(i.chat_history || '[]'),
      evaluation: JSON.parse(i.evaluation || '{}')
    }));

    res.status(200).json({ interviews: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
