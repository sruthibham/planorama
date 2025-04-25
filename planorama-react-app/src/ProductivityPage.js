import React, { useState, useEffect } from 'react';
import './App.css';
import { Bar, Line } from 'react-chartjs-2';
import 'chart.js/auto';

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

const ProductivityPage = () => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [minutes, setMinutes] = useState('');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [weeklyData, setWeeklyData] = useState({});
  const [dailyCurrentWeekData, setDailyCurrentWeekData] = useState({});
  const [selectedWeeks, setSelectedWeeks] = useState([]);
  const [mode, setMode] = useState('current');

  useEffect(() => {
    fetch('http://127.0.0.1:5000/productivity/all')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTimeEntries(data);
          processWeeklyData(data);
          processCurrentWeekData(data);
        } else {
          setMessage("No task data available for this week. Please make sure tasks are logged.");
        }
      });
  }, []);

  const handleAddTime = () => {
    if (!minutes || !date) return;

    fetch('http://127.0.0.1:5000/productivity/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutes: parseInt(minutes), date })
    })
      .then(res => res.json())
      .then(data => {
        const newEntry = { minutes: parseInt(minutes), timestamp: date };
        const updatedEntries = [...timeEntries, newEntry];
        setTimeEntries(updatedEntries);
        setMinutes('');
        setDate('');
        processWeeklyData(updatedEntries);
        processCurrentWeekData(updatedEntries);
      });
  };

  const processWeeklyData = (entries) => {
    const weekly = {};
    entries.forEach(({ minutes, timestamp }) => {
      const [year, month, day] = timestamp.split('-');
      const dateObj = new Date(year, month - 1, day);
      const y = dateObj.getFullYear();
      const w = getWeekNumber(dateObj);
      const key = `${y}-W${w}`;
      weekly[key] = (weekly[key] || 0) + minutes;
    });
    setWeeklyData(weekly);
  };

  const processCurrentWeekData = (entries) => {
    const today = new Date();
    const year = today.getFullYear();
    const week = getWeekNumber(today);
    const currentWeekKey = `${year}-W${week}`;
    const daily = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 };

    entries.forEach(({ minutes, timestamp }) => {
      const [year, month, day] = timestamp.split('-');
      const dateObj = new Date(year, month - 1, day);
      const y = dateObj.getFullYear();
      const w = getWeekNumber(dateObj);
      if (`${y}-W${w}` === currentWeekKey) {
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        daily[dayName] += minutes;
      }
    });
    setDailyCurrentWeekData(daily);
  };

  const labels = Object.keys(weeklyData).sort();
  const values = labels.map(label => weeklyData[label]);
  const currentLabel = labels[labels.length - 1];
  const prevLabel = labels[labels.length - 2];

  const currentWeek = weeklyData[currentLabel] || 0;
  const prevWeek = weeklyData[prevLabel] || 0;
  const difference = currentWeek - prevWeek;
  const percentage = prevWeek ? ((difference / prevWeek) * 100).toFixed(1) : 0;

  const renderChart = () => {
    if (mode === 'current') {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const data = days.map(day => dailyCurrentWeekData[day]);

      return (
        <Bar
          data={{
            labels: days,
            datasets: [
              {
                label: 'Minutes by Day (Current Week)',
                data,
                backgroundColor: '#007bff',
              },
            ],
          }}
          options={{
            plugins: { legend: { display: false } },
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: 'Minutes' }
              }
            }
          }}
        />
      );
    } else if (mode === 'history') {
      return (
        <Line
          data={{
            labels,
            datasets: [
              {
                label: 'Total Minutes by Week',
                data: values,
                fill: false,
                borderColor: '#007bff',
                tension: 0.1,
              },
            ],
          }}
          options={{
            plugins: { legend: { display: true } },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Minutes Logged'
                }
              },
            },
          }}
        />
      );
    } else if (mode === 'compare' && selectedWeeks.length > 0) {
      const chartLabels = selectedWeeks;
      const chartData = selectedWeeks.map(week => weeklyData[week] || 0);

      return (
        <Bar
          data={{
            labels: chartLabels,
            datasets: [
              {
                label: 'Total Minutes',
                data: chartData,
                backgroundColor: chartData.map((val, i) => {
                  if (i === 0 || mode === 'history') return '#007bff';
                  const diff = val - chartData[i - 1];
                  return diff > 0 ? '#28a745' : diff < 0 ? '#dc3545' : '#6c757d';
                }),
              },
            ],
          }}
          options={{
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => `${context.parsed.y} minutes`,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Minutes Logged'
                }
              },
            },
          }}
        />
      );
    }
  };

  const renderTrendSummary = () => {
    if (mode !== 'history') return null;

    const trends = labels.map((label, index) => {
      if (index === 0) return `${label}: ${weeklyData[label]} minutes`;
      const diff = weeklyData[label] - weeklyData[labels[index - 1]];
      const trend = diff === 0 ? 'no change' : diff > 0 ? `up by ${diff}` : `down by ${Math.abs(diff)}`;
      return `${label}: ${weeklyData[label]} minutes (${trend})`;
    });

    return (
      <div className="trend-summary" style={{ marginTop: '20px' }}>
        <h4>Weekly Productivity Trends:</h4>
        <ul>
          {trends.map((text, i) => <li key={i}>{text}</li>)}
        </ul>
      </div>
    );
  };

  return (
    <div className="streak-container">
      <h2>Productivity Tracker</h2>

      <div>
        <input
          type="number"
          placeholder="Minutes Worked"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button onClick={handleAddTime}>Log Time</button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => setMode('current')}>Current Summary</button>
        <button onClick={() => setMode('compare')}>Compare Weeks</button>
        <button onClick={() => setMode('history')}>View History</button>
      </div>

      {mode === 'compare' && (
        <div style={{ marginTop: '10px' }}>
          <p>Select weeks to compare:</p>
          {labels.map(label => (
            <label key={label} style={{ marginRight: '10px' }}>
              <input
                type="checkbox"
                checked={selectedWeeks.includes(label)}
                onChange={() => {
                  setSelectedWeeks(prev =>
                    prev.includes(label)
                      ? prev.filter(l => l !== label)
                      : [...prev, label]
                  );
                }}
              />
              {label}
            </label>
          ))}
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        {message && <p className="ErrorMessage">{message}</p>}
        {labels.length === 0 ? (
          <p>No task data available for this week. Please make sure tasks are logged.</p>
        ) : (
          <>
            {mode === 'current' && (
              <div>
                <p><strong>This week:</strong> {currentWeek} minutes</p>
                <p style={{ color: difference >= 0 ? 'green' : 'red' }}>
                  {difference >= 0 ? `+${percentage}% this week` : `${percentage}% this week`}
                </p>
              </div>
            )}
            {renderChart()}
            {renderTrendSummary()}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductivityPage;
