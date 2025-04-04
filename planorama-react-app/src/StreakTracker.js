import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}`;
}

export default function StreakTracker() {
  const [streak, setStreak] = useState({
    current_streak: 0,
    highest_streak: 0,
    total_days: 0,
    history: []
  });

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/streak")
      .then(res => setStreak(res.data))
      .catch(err => console.error("Error fetching streak data:", err));
  }, []);

  return (
    <div className="streak-container">
      <h2>Your Streak Tracker</h2>

      <div className="streak-stats">
        <div className="stat-card">
          <h3>Current Streak</h3>
          <p>{streak.current_streak} days</p>
        </div>
        <div className="stat-card">
          <h3>Highest Streak</h3>
          <p>{streak.highest_streak} days</p>
        </div>
        <div className="stat-card">
          <h3>Total Completed Days</h3>
          <p>{streak.total_days}</p>
        </div>
      </div>

      <h4 style={{ marginTop: '30px' }}>History and Trends</h4>
      <div className="streak-history">
        {streak.history.map((entry, index) => (
          <div
            key={index}
            className={`history-box ${entry.completed ? 'completed' : 'missed'}`}
            title={`${entry.date}: ${entry.completed ? '✓ Completed' : '✗ Missed'}`}
          >
            {formatDate(entry.date)}
          </div>
        ))}
      </div>
    </div>
  );
}
