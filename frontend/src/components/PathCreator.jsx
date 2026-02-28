import { useState } from 'react';
import '../styles/PathCreator.css';

export default function PathCreator({ onUserCreated, onPathCreated, userId, isSetup = false }) {
  const [step, setStep] = useState(isSetup ? 'username' : 'path');
  const [username, setUsername] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (data.userId) {
        onUserCreated(data.userId);
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Error creating user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePath = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/paths`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subject, difficulty })
      });
      const data = await res.json();
      if (data.pathId) {
        onPathCreated(data.pathId);
      } else {
        setError(data.error || 'Failed to create learning path');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'username') {
    return (
      <div className="path-creator">
        <div className="creator-card">
          <h2>Welcome! 👋</h2>
          <p>Choose your username to get started</p>
          <form onSubmit={handleCreateUser}>
            <input
              type="text"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Get Started 🚀'}
            </button>
          </form>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="path-creator">
      <div className="creator-card">
        <h2>Create a Learning Path 📚</h2>
        <p>Choose any subject and let AI create your personalized learning path</p>
        <form onSubmit={handleCreatePath}>
          <input
            type="text"
            placeholder="E.g., French Grammar, React Basics, Japanese Hiragana..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={loading}
          />

          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} disabled={loading}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? 'AI is generating your path...' : 'Generate Path ✨'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
