# Learning Path Generator 🚀

An AI-powered learning path generator inspired by Duolingo. Create personalized learning paths on **any subject** — languages, programming, history, films, anything!

## Features

✨ **AI-Generated Content** — Claude automatically creates lessons and quizzes for any subject
🎮 **Gamification** — Points, streaks, and badges to keep you motivated
📚 **Progressive Learning** — Lessons organized from beginner to advanced
📱 **Quiz System** — Interactive questions with explanations
📊 **Progress Tracking** — Monitor your stats and achievements

## Tech Stack

- **Backend** : Node.js + Express
- **Database** : SQLite (better-sqlite3)
- **AI** : Claude API (Anthropic)
- **Frontend** : React (coming soon)

## Setup

### 1. Clone & Install
```bash
git clone https://github.com/SachaRM7/learning-path.git
cd learning-path
npm install
```

### 2. Environment
Copy `.env.example` to `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-...
PORT=3000
```

### 3. Run
```bash
npm run dev
```

Server starts on `http://localhost:3000` ✅

## API Endpoints

### Users
- `POST /api/users` — Create a user
  ```json
  { "username": "sacha" }
  ```

### Learning Paths
- `POST /api/paths` — Create a learning path (AI generates content)
  ```json
  { "userId": "...", "subject": "French Grammar", "difficulty": "intermediate" }
  ```
- `GET /api/paths/:pathId/lessons` — Get all lessons in a path

### Lessons
- `GET /api/lessons/:lessonId` — Get lesson + quiz questions

### Quiz
- `POST /api/quiz/submit` — Submit an answer
  ```json
  { "userId": "...", "lessonId": "...", "questionId": "...", "answer": "A" }
  ```

### Progress
- `GET /api/users/:userId/progress` — Get user stats, badges, paths

## Database Schema

- **users** — username, points, streak, lastActivityDate
- **learning_paths** — subject, difficulty, status
- **lessons** — content, order, type
- **quiz_questions** — question, options, correctAnswer
- **user_progress** — completed lessons, scores
- **badges** — earned achievements

## Example Usage

```bash
# 1. Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "sacha"}'

# 2. Create a learning path
curl -X POST http://localhost:3000/api/paths \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<USER_ID>",
    "subject": "Japanese Hiragana",
    "difficulty": "beginner"
  }'

# 3. Get lessons
curl http://localhost:3000/api/paths/<PATH_ID>/lessons

# 4. Submit quiz answer
curl -X POST http://localhost:3000/api/quiz/submit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<USER_ID>",
    "lessonId": "<LESSON_ID>",
    "questionId": "<QUESTION_ID>",
    "answer": "A"
  }'
```

## Next Steps

- [ ] React frontend (Dashboard, Path Creator, Lesson Player)
- [ ] Streak system & badge logic
- [ ] User authentication (JWT)
- [ ] Progress persistence
- [ ] Responsive design
- [ ] Dark mode

## License

MIT

---

Made with 🤲 by SachaRboneIA
