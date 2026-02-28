import { useState, useEffect } from 'react';
import '../styles/LessonPlayer.css';

export default function LessonPlayer({ userId, pathId, onComplete }) {
  const [lessons, setLessons] = useState([]);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [lesson, setLesson] = useState(null);
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchLessons();
  }, [pathId]);

  useEffect(() => {
    if (lessons.length > 0) {
      fetchLesson(lessons[currentLessonIdx].id);
    }
  }, [currentLessonIdx, lessons]);

  const fetchLessons = async () => {
    try {
      const res = await fetch(`${API_URL}/api/paths/${pathId}/lessons`);
      const data = await res.json();
      setLessons(data);
    } catch (err) {
      console.error('Error fetching lessons:', err);
    }
  };

  const fetchLesson = async (lessonId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/lessons/${lessonId}`);
      const data = await res.json();
      setLesson(data);
      setQuiz(data.quiz || []);
      setAnswers({});
      setSubmitted(false);
      setScore(0);
    } catch (err) {
      console.error('Error fetching lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (qId, answer) => {
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const handleSubmit = async () => {
    let correctCount = 0;
    for (const q of quiz) {
      if (answers[q.id] && answers[q.id].trim() !== '') {
        const res = await fetch(`${API_URL}/api/quiz/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            lessonId: lesson.id,
            questionId: q.id,
            answer: answers[q.id]
          })
        });
        const data = await res.json();
        if (data.isCorrect) correctCount++;
      }
    }
    const finalScore = Math.round((correctCount / quiz.length) * 100);
    setScore(finalScore);
    setSubmitted(true);
    onComplete(10); // Award points
  };

  const handleNext = () => {
    if (currentLessonIdx < lessons.length - 1) {
      setCurrentLessonIdx(currentLessonIdx + 1);
    }
  };

  if (loading) return <div className="lesson-player"><p>Loading lesson...</p></div>;
  if (!lesson) return <div className="lesson-player"><p>No lesson found</p></div>;

  return (
    <div className="lesson-player">
      <div className="progress-bar">
        <div className="progress" style={{ width: `${((currentLessonIdx + 1) / lessons.length) * 100}%` }}></div>
      </div>

      <div className="lesson-content">
        <h2>{lesson.title}</h2>
        <p className="lesson-text">{lesson.content}</p>

        {!submitted ? (
          <div className="quiz-section">
            <h3>Quick Check 📝</h3>
            {quiz.map((q, idx) => (
              <div key={q.id} className="quiz-question">
                <p>{idx + 1}. {q.question}</p>
                <input
                  type="text"
                  placeholder="Your answer..."
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                />
              </div>
            ))}
            <button className="submit-btn" onClick={handleSubmit}>
              Check Answers ✅
            </button>
          </div>
        ) : (
          <div className="results">
            <h3>Results 🎯</h3>
            <p className="score">You got {score}%!</p>
            {score >= 80 ? (
              <p className="feedback">Great job! 🎉</p>
            ) : score >= 60 ? (
              <p className="feedback">Good effort! Keep practicing 💪</p>
            ) : (
              <p className="feedback">Keep learning! You'll get better 📚</p>
            )}
            {currentLessonIdx < lessons.length - 1 ? (
              <button className="next-btn" onClick={handleNext}>
                Next Lesson →
              </button>
            ) : (
              <p className="complete">🎓 Path Complete! Amazing work!</p>
            )}
          </div>
        )}
      </div>

      <div className="lesson-nav">
        <p>Lesson {currentLessonIdx + 1} of {lessons.length}</p>
      </div>
    </div>
  );
}
