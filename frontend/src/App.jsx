import { useState } from 'react';
import './App.css';
import PathCreator from './components/PathCreator';
import Dashboard from './components/Dashboard';
import LessonPlayer from './components/LessonPlayer';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, creator, player
  const [userId, setUserId] = useState(localStorage.getItem('userId') || null);
  const [currentPath, setCurrentPath] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [userStats, setUserStats] = useState({ points: 0, streak: 0, badges: [] });

  const handleUserCreated = (id) => {
    setUserId(id);
    localStorage.setItem('userId', id);
    setCurrentView('dashboard');
  };

  const handlePathCreated = (pathId) => {
    setCurrentPath(pathId);
    setCurrentView('player');
  };

  const handleLessonComplete = (points) => {
    setUserStats(prev => ({
      ...prev,
      points: prev.points + points
    }));
  };

  return (
    <div className="app">
      {!userId ? (
        <PathCreator onUserCreated={handleUserCreated} isSetup={true} />
      ) : (
        <>
          <nav className="navbar">
            <h1>🚀 Learning Path</h1>
            <button onClick={() => setCurrentView('dashboard')}>Dashboard</button>
            <button onClick={() => setCurrentView('creator')}>+ New Path</button>
            <div className="stats">
              ⭐ {userStats.points} pts | 🔥 {userStats.streak} streak
            </div>
          </nav>

          <main className="main">
            {currentView === 'dashboard' && (
              <Dashboard userId={userId} userStats={userStats} onPathSelect={(pathId) => {
                setCurrentPath(pathId);
                setCurrentView('player');
              }} />
            )}

            {currentView === 'creator' && (
              <PathCreator userId={userId} onPathCreated={handlePathCreated} />
            )}

            {currentView === 'player' && currentPath && (
              <LessonPlayer userId={userId} pathId={currentPath} onComplete={handleLessonComplete} />
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default App;
