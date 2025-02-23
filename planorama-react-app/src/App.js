import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useState } from 'react'


function TaskPage() {
  return (
    <div>
    <h1 className="App">Your Tasks</h1> 
    <div className="Columns" style={{ display: "flex", justifyContent: "space-between" }}>
      <h2>Task</h2>
      <h2>Priority</h2>
      <h2>Deadline</h2>
            
      <div>
        <button className="MakeTaskButton">Create task</button>
      </div>
  </div>
       
  </div>
  );
}

function CreateAccountPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    console.log("Username:", username);
    console.log("Email:", email)
    console.log("Password:", password);
  };

  return (
    <div className="LoginFields">
    <h1>Create Account</h1>
    <input
      type="text"
      placeholder="Username"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      className="TextFields"
    />
    <input
      type="text"
      placeholder="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className="TextFields"
    />
    <input
      type="password"
      placeholder="Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className="TextFields"
    />
    <button onClick={handleSubmit} className="Buttons">
      Create
    </button>
  </div>
  );
}

function LogInPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    console.log("Username:", username);
    console.log("Password:", password);
  };

  return (
    <div className="LoginFields">
    <h1>Log In</h1>
    <input
      type="text"
      placeholder="Username"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      className="TextFields"
    />
    <input
      type="password"
      placeholder="Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className="TextFields"
    />
    <button onClick={handleSubmit} className="Buttons">
      Log In
    </button>
  </div>
  );
}

function NavigationButtons() {
  const navigate = useNavigate();

  return (
    <div>
      <button onClick={() => navigate('/')}>Tasks</button>
      <button onClick={() => navigate('/login')}>Log In</button>
      <button onClick={() => navigate('/createaccount')}>Create Account</button>
    </div>
  );
}

function App() {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<TaskPage />} />
          <Route path="/createaccount" element={<CreateAccountPage />} />
          <Route path="/login" element={<LogInPage />} />
        </Routes>
        <NavigationButtons />
    </Router>
  );
}
export default App;
