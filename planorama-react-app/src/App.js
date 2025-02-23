import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';


function TaskPage() {
  console.log("This is rendered")
  return (
    <div>
    <h1 className="App">Your Tasks</h1> 
    <div className="Columns" style={{ display: "flex", justifyContent: "space-between" }}>
      <h2>Task</h2>
      <h2>Priority</h2>
      <h2>Deadline</h2>
            
      <div>
        <button className="Buttons">Create task</button>
      </div>
  </div>
       
  </div>
  );
}
function CreateAccountPage() {
  console.log("This is rendered2")
  return <h1>Create Account</h1>;
}

function LogInPage() {
  console.log("This is rendered3")
  return <h1>Log In</h1>;
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
