const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const Anthropic = require('@anthropic-ai/sdk');
const Database = require('better-sqlite3');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const dbPath = path.join(__dirname, 'learning.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    points INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    lastActivityDate TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS learning_paths (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    subject TEXT NOT NULL,
    difficulty TEXT DEFAULT 'beginner',
    status TEXT DEFAULT 'active',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    pathId TEXT NOT NULL,
    order_num INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(pathId) REFERENCES learning_paths(id)
  );

  CREATE TABLE IF NOT EXISTS quiz_questions (
    id TEXT PRIMARY KEY,
    lessonId TEXT NOT NULL,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    correctAnswer TEXT NOT NULL,
    explanation TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(lessonId) REFERENCES lessons(id)
  );

  CREATE TABLE IF NOT EXISTS user_progress (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    pathId TEXT NOT NULL,
    lessonId TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0,
    score INTEGER,
    completedAt TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id),
    FOREIGN KEY(pathId) REFERENCES learning_paths(id),
    FOREIGN KEY(lessonId) REFERENCES lessons(id)
  );

  CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    badgeName TEXT NOT NULL,
    earnedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  );
`);

// Initialize Anthropic client
const client = new Anthropic();

// Routes

// Create user
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });

  const userId = uuidv4();
  try {
    db.prepare('INSERT INTO users (id, username) VALUES (?, ?)').run(userId, username);
    res.json({ userId, username, points: 0, streak: 0 });
  } catch (e) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

// Create learning path (AI generates content)
app.post('/api/paths', async (req, res) => {
  const { userId, subject, difficulty = 'beginner' } = req.body;
  if (!userId || !subject) return res.status(400).json({ error: 'Missing userId or subject' });

  try {
    const pathId = uuidv4();
    
    // Generate learning path with Claude
    const prompt = `Generate a learning path for the subject: "${subject}" at ${difficulty} level.

Create 5 lessons in JSON format:
{
  "lessons": [
    {
      "title": "Lesson 1: ...",
      "content": "Brief introduction and key concepts",
      "quiz": [
        {
          "question": "...",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "A",
          "explanation": "..."
        },
        ...3-4 more questions
      ]
    },
    ...4 more lessons
  ]
}

Make sure:
- Lessons progress from simple to complex
- Each quiz has 4-5 questions
- Content is clear and educational`;

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format');

    const pathData = JSON.parse(jsonMatch[0]);

    // Save path and lessons to DB
    db.prepare('INSERT INTO learning_paths (id, userId, subject, difficulty) VALUES (?, ?, ?, ?)')
      .run(pathId, userId, subject, difficulty);

    pathData.lessons.forEach((lesson, idx) => {
      const lessonId = uuidv4();
      db.prepare('INSERT INTO lessons (id, pathId, order_num, title, content, type) VALUES (?, ?, ?, ?, ?, ?)')
        .run(lessonId, pathId, idx + 1, lesson.title, lesson.content, 'text');

      // Save quiz questions
      lesson.quiz.forEach(q => {
        const qId = uuidv4();
        db.prepare(`INSERT INTO quiz_questions (id, lessonId, question, options, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?)`)
          .run(qId, lessonId, q.question, JSON.stringify(q.options), q.correctAnswer, q.explanation);
      });
    });

    res.json({ pathId, subject, difficulty, lessonCount: pathData.lessons.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate learning path' });
  }
});

// Get lessons for a path
app.get('/api/paths/:pathId/lessons', (req, res) => {
  const { pathId } = req.params;
  try {
    const lessons = db.prepare(`
      SELECT id, order_num, title, content FROM lessons WHERE pathId = ? ORDER BY order_num
    `).all(pathId);
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// Get lesson details with quiz
app.get('/api/lessons/:lessonId', (req, res) => {
  const { lessonId } = req.params;
  try {
    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const quiz = db.prepare('SELECT id, question, options FROM quiz_questions WHERE lessonId = ?').all(lessonId);
    res.json({ ...lesson, quiz });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

// Submit quiz answer
app.post('/api/quiz/submit', (req, res) => {
  const { userId, lessonId, questionId, answer } = req.body;
  if (!userId || !lessonId || !questionId || !answer) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const question = db.prepare('SELECT correctAnswer, explanation FROM quiz_questions WHERE id = ?').get(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const isCorrect = answer === question.correctAnswer;
    const points = isCorrect ? 10 : 0;

    // Update user points
    db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(points, userId);

    res.json({ isCorrect, points, explanation: question.explanation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Get user progress
app.get('/api/users/:userId/progress', (req, res) => {
  const { userId } = req.params;
  try {
    const user = db.prepare('SELECT points, streak FROM users WHERE id = ?').get(userId);
    const badges = db.prepare('SELECT badgeName FROM badges WHERE userId = ?').all(userId);
    const paths = db.prepare('SELECT id, subject FROM learning_paths WHERE userId = ? ORDER BY createdAt DESC').all(userId);
    
    res.json({ user, badges: badges.map(b => b.badgeName), paths });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Learning Path API running on http://localhost:${PORT}`);
});
