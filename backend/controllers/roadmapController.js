import { getDb } from '../config/db.js';

// Generate 30/60/90 Day AI Learning Roadmap based on ATS Missing Skills and Mock Interview evaluation
export async function generateRoadmap(req, res) {
  try {
    const userId = req.user.id;
    const { targetRole, durationDays } = req.body; // default 90 days
    const db = getDb();

    const role = targetRole || 'Software Engineer';
    const duration = parseInt(durationDays) || 90;

    // Fetch latest resume and mock interview reports for user to customize roadmap
    const latestResume = await db.get('SELECT keywords_missing, parsed_skills FROM resumes WHERE user_id = ? ORDER BY upload_date DESC LIMIT 1', [userId]);
    const latestInterview = await db.get('SELECT evaluation FROM interviews WHERE user_id = ? ORDER BY date_taken DESC LIMIT 1', [userId]);

    let missingSkills = ['System Architecture', 'CI/CD Pipelines', 'Docker Containerization', 'Cloud Deployment (AWS/GCP)', 'Unit & Integration Testing'];
    if (latestResume && latestResume.keywords_missing) {
      try {
        const parsedMissing = JSON.parse(latestResume.keywords_missing);
        if (Array.isArray(parsedMissing) && parsedMissing.length > 0) {
          missingSkills = parsedMissing.map(s => String(s).toUpperCase());
        }
      } catch (e) {}
    }

    let weakAreas = ['Behavioral STAR Method Structure', 'System Scalability Trade-offs'];
    if (latestInterview && latestInterview.evaluation) {
      try {
        const evalData = JSON.parse(latestInterview.evaluation);
        if (evalData.weaknesses && Array.isArray(evalData.weaknesses)) {
          weakAreas = evalData.weaknesses;
        }
      } catch (e) {}
    }

    // Build structured 30/60/90-day learning roadmap modules
    const weeks = [];
    
    // Phase 1: Days 1-30 (Core Foundation & Skill Gaps)
    weeks.push({
      phase: 'Phase 1: Foundation & Skill Gaps (Days 1–30)',
      weekNumber: 1,
      title: 'Core Domain Fundamentals & Technical Gaps',
      description: `Master fundamental syntax, patterns, and missing target skill concepts (${missingSkills.slice(0, 2).join(', ')}).`,
      objectives: [
        `Review key concepts in ${role} domain architecture`,
        `Complete hands-on practice projects with ${missingSkills[0] || 'Core Frameworks'}`,
        'Set up continuous practice repository on GitHub'
      ],
      completed: false
    });
    weeks.push({
      phase: 'Phase 1: Foundation & Skill Gaps (Days 1–30)',
      weekNumber: 2,
      title: 'Advanced Skill Gap Mastery',
      description: `Deep dive into advanced concepts: ${missingSkills.slice(2, 4).join(', ') || 'System Design Patterns'}.`,
      objectives: [
        `Implement sample micro-services / modules using ${missingSkills[1] || 'REST/GraphQL'}`,
        'Study trade-offs in relational vs non-relational storage',
        'Solve 5 medium-level algorithmic coding challenges'
      ],
      completed: false
    });
    weeks.push({
      phase: 'Phase 1: Foundation & Skill Gaps (Days 1–30)',
      weekNumber: 3,
      title: 'STAR Behavioral & Communication Refinement',
      description: `Address interview feedback: ${weakAreas[0] || 'STAR method pacing'}.`,
      objectives: [
        'Draft 5 STAR stories covering Leadership, Team Conflict, and Technical Challenges',
        'Practice timed 2-minute oral responses focusing on concise delivery',
        'Eliminate hesitation fillers (um, like, maybe) through video self-review'
      ],
      completed: false
    });

    // Phase 2: Days 31-60 (System Design & Practical Applications)
    weeks.push({
      phase: 'Phase 2: Scalability & Applied Projects (Days 31–60)',
      weekNumber: 4,
      title: 'High-Scale System Architecture & Microservices',
      description: 'Design distributed architectures, message queues (Kafka/RabbitMQ), and caching strategies (Redis).',
      objectives: [
        'Diagram a highly available web application architecture (load balancing, CDN, DB replication)',
        'Implement rate limiting and token bucket algorithms',
        'Practice 3 System Design mock interviews'
      ],
      completed: false
    });
    weeks.push({
      phase: 'Phase 2: Scalability & Applied Projects (Days 31–60)',
      weekNumber: 5,
      title: 'DevOps, CI/CD & Cloud Infrastructure',
      description: 'Containerize applications and automate deployment pipelines.',
      objectives: [
        `Write Dockerfiles and docker-compose configurations for ${role} stack`,
        'Set up GitHub Actions CI/CD pipeline for automated testing & linting',
        'Deploy sample production application to AWS/Vercel/Render'
      ],
      completed: false
    });

    // Phase 3: Days 61-90 (Interview Mastery & Mock Drills)
    weeks.push({
      phase: 'Phase 3: High-Stakes Mock Drills & Final Polish (Days 61–90)',
      weekNumber: 6,
      title: 'Live AI Mock Interview Simulations',
      description: 'Execute high-difficulty mock sessions under strict time constraints.',
      objectives: [
        'Complete 3 Advanced Technical Mock Interviews on Hirenix AI platform',
        'Achieve overall score of >85% across all 5 evaluation metrics',
        'Finalize resume ATS optimization and portfolio links'
      ],
      completed: false
    });

    const roadmapData = {
      targetRole: role,
      durationDays: duration,
      missingSkills,
      weakAreas,
      weeks
    };

    // Save to database (deactivate previous active roadmaps)
    await db.run("UPDATE roadmaps SET status = 'archived' WHERE user_id = ?", [userId]);
    const result = await db.run(
      'INSERT INTO roadmaps (user_id, target_role, duration_days, skills_gap, roadmap_data) VALUES (?, ?, ?, ?, ?)',
      [userId, role, duration, JSON.stringify({ missingSkills, weakAreas }), JSON.stringify(roadmapData)]
    );

    res.status(201).json({
      message: '30/60/90-Day AI Learning Roadmap generated successfully',
      roadmap: { id: result.lastID, ...roadmapData }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMyRoadmap(req, res) {
  try {
    const userId = req.user.id;
    const db = getDb();

    const roadmapRecord = await db.get("SELECT * FROM roadmaps WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1", [userId]);
    if (!roadmapRecord) {
      return res.status(200).json({ roadmap: null });
    }

    res.status(200).json({
      roadmap: {
        id: roadmapRecord.id,
        targetRole: roadmapRecord.target_role,
        durationDays: roadmapRecord.duration_days,
        createdAt: roadmapRecord.created_at,
        ...JSON.parse(roadmapRecord.roadmap_data)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function toggleRoadmapTask(req, res) {
  try {
    const userId = req.user.id;
    const { roadmapId, weekNumber, objectiveIndex } = req.body;
    const db = getDb();

    const record = await db.get('SELECT * FROM roadmaps WHERE id = ? AND user_id = ?', [roadmapId, userId]);
    if (!record) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    const data = JSON.parse(record.roadmap_data);
    const week = data.weeks.find(w => w.weekNumber === weekNumber);
    if (week && week.objectives[objectiveIndex] !== undefined) {
      if (!week.completedObjectives) week.completedObjectives = [];
      const idx = week.completedObjectives.indexOf(objectiveIndex);
      if (idx > -1) {
        week.completedObjectives.splice(idx, 1);
      } else {
        week.completedObjectives.push(objectiveIndex);
      }
      week.completed = week.completedObjectives.length === week.objectives.length;
    }

    await db.run('UPDATE roadmaps SET roadmap_data = ? WHERE id = ?', [JSON.stringify(data), roadmapId]);

    res.status(200).json({ message: 'Roadmap task updated', roadmap: { id: record.id, ...data } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
