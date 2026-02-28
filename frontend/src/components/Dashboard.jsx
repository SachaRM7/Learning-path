import { useState, useEffect } from 'react';
import '../styles/Dashboard.css';

export default function Dashboard({ userId, userStats, onPathSelect }) {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchProgress();
  }, [userId]);

  const fetchProgress = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/progress`);
      const data = await res.json();
      if (data.paths) {
        setPaths(data.paths);
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="stats-section">
        <div className="stat-card">
          <h3>⭐ Points</h3>
          <p className="stat-value">{userStats.points}</p>
        </div>
        <div className="stat-card">
          <h3>🔥 Streak</h3>
          <p className="stat-value">{userStats.streak}</p>
        </div>
        <div className="stat-card">
          <h3>🏆 Badges</h3>
          <p className="stat-value">{userStats.badges.length}</p>
        </div>
      </div>

      <div className="paths-section">
        <h2>Your Learning Paths 📚</h2>
        {loading ? (
          <p>Loading...</p>
        ) : paths.length === 0 ? (
          <p className="empty">No paths yet. Create one to get started! 🚀</p>
        ) : (
          <div className="paths-grid">
            {paths.map(path => (
              <div key={path.id} className="path-card" onClick={() => onPathSelect(path.id)}>
                <h3>{path.subject}</h3>
                <p className="path-status">📖 In Progress</p>
                <button>Continue Learning →</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {userStats.badges.length > 0 && (
        <div className="badges-section">
          <h2>Your Badges 🏅</h2>
          <div className="badges">
            {userStats.badges.map(badge => (
              <span key={badge} className="badge">{badge}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
