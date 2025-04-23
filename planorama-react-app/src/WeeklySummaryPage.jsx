import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function formatWithOffset(dateStr) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function WeeklySummaryPage() {
  const [summary, setSummary] = useState({});
  const [weekLabel, setWeekLabel] = useState("");
  const [most, setMost] = useState("");
  const [least, setLeast] = useState("");
  const [username, setUsername] = useState("");
  const [weekStart, setWeekStart] = useState("");
  const [weeksList, setWeeksList] = useState([]);
  const [hasData, setHasData] = useState(true);

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    const today = new Date();
    const sundayOffset = today.getDay() === 0 ? 0 : today.getDay();
    const currentSunday = new Date(today);
    currentSunday.setDate(today.getDate() - sundayOffset);

    const pastWeeks = [];
    for (let i = 0; i < 6; i++) {
      const sunday = new Date(currentSunday);
      sunday.setDate(currentSunday.getDate() - i * 7);
      pastWeeks.push(sunday.toISOString().slice(0, 10));
    }

    setWeeksList(pastWeeks.reverse());
    setWeekStart(currentSunday.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/update-user")
      .then(res => setUsername(res.data));
  }, []);

  useEffect(() => {
    if (!username || !weekStart) return;

    axios.get("http://127.0.0.1:5000/weekly_summary", {
      params: { username, week_start: weekStart }
    }).then(res => {
      const data = res.data.summary;
      setSummary(data);
      setWeekLabel(res.data.week_range);
      setMost(res.data.most_productive);
      setLeast(res.data.least_productive);
      const allScoresZero = Object.values(data).every(day => (day?.score || 0) === 0);
      setHasData(!allScoresZero);
    });
  }, [username, weekStart]);

  const data = {
    labels: days,
    datasets: [
      {
        label: 'Productivity Score',
        data: days.map(day => summary[day]?.score || 0),
        fill: true,
        backgroundColor: 'rgba(75,192,192,0.2)',
        borderColor: 'rgba(75,192,192,1)',
        tension: 0.3,
      }
    ]
  };

  const options = {
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        displayColors: false,
        callbacks: {
          title: function (context) {
            return context[0].label;
          },
          label: function () {
            return "";
          },
          afterBody: function (context) {
            const day = context[0].label;
            const stats = summary[day] || {};
            const tasks = stats.tasks || [];
            const timeLogs = stats.logs || [];
            const lines = [];
  
            if (tasks.length > 0) {
              lines.push("✔ Tasks completed:");
              tasks.forEach(t => lines.push(`• ${t}`));
            } else {
              lines.push("✔ No tasks completed.");
            }
  
            lines.push("");
  
            if (timeLogs.length > 0) {
              lines.push("⏱ Time logged:");
              timeLogs.forEach(log => {
                const mins = log.minutes;
                const hrs = (mins / 60).toFixed(1);
                lines.push(`• ${log.task || "Unnamed task"} – ${hrs} hrs`);
              });
            } else {
              lines.push("⏱ No time logged.");
            }
  
            lines.push("");
  
            const score = stats.score?.toFixed(2) || "0.00";
            lines.push(`📊 Productivity Score: ${score}`);
  
            return lines;
          }
        }
      },
      legend: {
        display: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'black'
        }
      },
      x: {
        ticks: {
          color: 'black'
        }
      }
    }
  };
  
  
  

  return (
    <div style={{ height: '400px', width: '95%', margin: '0 auto' }}>
      <h2>Weekly Summary</h2>

      <label><strong>Week: </strong></label>
      <select
        value={weekStart}
        onChange={e => setWeekStart(e.target.value)}
        style={{ marginBottom: '10px' }}
      >
        {weeksList.map(date => (
          <option key={date} value={date}>
            Week of {formatWithOffset(date)}
          </option>
        ))}
      </select>

      <h4>{weekLabel}</h4>

      {hasData ? (
        <>
          <div style={{ height: '250px' }}>
            <Line data={data} options={options} />
          </div>
          <p>
            <strong style={{ color: 'black' }}>Most productive:</strong>{' '}
            <span style={{ color: 'black', fontWeight: 'normal' }}>{most}</span>
          </p>
          <p>
            <strong style={{ color: 'black' }}>Least productive:</strong>{' '}
            <span style={{ color: 'black', fontWeight: 'normal' }}>{least}</span>
          </p>
        </>
      ) : (
        <p><em style={{ color: 'black', fontWeight: 'normal' }}>No tasks/time logged this week.</em></p>
      )}
    </div>
  );
}

export default WeeklySummaryPage;
