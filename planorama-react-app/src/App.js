import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { GlobalProvider, useGlobal } from "./GlobalContext";
import axios from 'axios';


function DisplayUsername() {
  const { user } = useGlobal();
  return <div className="User">{user}</div>;
}

function TaskPage() {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({
    name: "",
    description: "",
    due_time: "",
    priority: "Medium",
    color_tag: "",
    status: "To-Do"
  });
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [taskWarning, setTaskWarning] = useState("");

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/tasks")
      .then(response => {
        setTasks(response.data);
      })
      .catch(error => console.error("Error fetching tasks:", error));
  }, []);

  const handleDelete = (taskId) => {
    axios.delete(`http://127.0.0.1:5000/tasks/${taskId}`)
      .then(() => {
        setTasks(tasks.filter(task => task.id !== taskId)); // Remove task from UI
        setWarning("");
        setError("");
      })
      .catch(error => console.error("Error deleting task:", error));
  };  

  const handleChange = (e) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    setError("");
    setWarning("");
  
    axios.post("http://127.0.0.1:5000/tasks", newTask)
      .then(response => {
        setTasks([...tasks, response.data.task]);
  
        if (response.data.warning) {
          setTaskWarning(response.data.warning);
        }
  
        setNewTask({
          name: "",
          description: "",
          due_time: "",
          priority: "Medium",
          color_tag: "",
          status: "To-Do"
        });
  
        setShowModal(false);
      })
      .catch(error => {
        if (error.response) {
          setError(error.response.data.error);
        } else {
          console.error("Error creating task:", error);
        }
      });
  };

   const formatDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${month}/${day}/${year}`;
  };
  
  return (
    <div>
      <h1 className="App">Your Tasks</h1>
      
      <div className="TaskTable">
        <div className="TaskRow TaskHeader">
          <div className="TaskCell">Task</div>
          <div className="TaskCell">Priority</div>
          <div className="TaskCell">Deadline</div>
          <div className="TaskCell">Make Changes</div>
        </div>

        {tasks.map(task => (
          <div key={task.id} className="TaskRow">
            <div className="TaskCell">{task.name}</div>
            <div className="TaskCell">{task.priority}</div>
            <div className="TaskCell">{formatDate(task.due_time)}</div>
            <div className="TaskCell">
              <button className="EditButton">Edit</button>
              <button className="DeleteButton" onClick={() => handleDelete(task.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      <button className="MakeTaskButton" onClick={() => setShowModal(true)}>Create Task</button>

      {taskWarning && (
          <div className="TaskWarning">
          <p>{taskWarning}</p>
          <button onClick={() => setTaskWarning("")} className="CloseWarningButton">✖</button>
          </div>)}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Task</h2>

            {error && <p className="ErrorMessage">{error}</p>}
            {warning && <p className="WarningMessage">{warning}</p>}

            <input type="text" name="name" placeholder="Task Name" onChange={handleChange} className="TextFields" required />
            <input type="text" name="description" placeholder="Description (Optional)" onChange={handleChange} className="TextFields" />
            <input type="date" name="due_time" onChange={handleChange} className="TextFields" required />

            <select name="priority" onChange={handleChange} className="TextFields">
              <option value="Low">Low</option>
              <option value="Medium" selected>Medium</option>
              <option value="High">High</option>
            </select>
             
            <select name="status" onChange={handleChange} className="TextFields">
              <option value="To-Do">To-Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            <button onClick={handleSubmit} className="Buttons">Save</button>
            <button onClick={() => {
              setError("");
              setWarning("");
              setNewTask({
              name: "",
              description: "",
              due_time: "",
              priority: "Medium",
              color_tag: "",
              status: "To-Do"});setShowModal(false);}} className="Buttons">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateAccountPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errMsg, setErrMsg] = useState([]);

  const { setUser } = useGlobal();

  const handleSubmit = () => {
    axios.post("http://127.0.0.1:5000/createuser", { username: username, email: email, password: password })
    .then(response => {
      setErrMsg(response.data.msg)
      if (response.data.success) {
        setUser(username);  // Update global state
      }
    });
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
    <div>
      <ul>
        {errMsg.map((errMsg, index) => (
          <li key={index}>{errMsg}</li>
        ))}
      </ul>
    </div>
    
  </div>
  );
}

function LogInPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [errMsg, setErrMsg] = useState(null);

  const { setUser } = useGlobal();

  const handleSubmit = () => {
    axios.post("http://127.0.0.1:5000/loguser", { username: username, password: password })
    .then(response => {
      setErrMsg(response.data.msg)
      if (response.data.success) {
        setUser(username);  // Update global state
      }
    });
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
    <div>
      {errMsg}
    </div>
  </div>
  );
}

function NavigationButtons() {
  const navigate = useNavigate();

  return (
    <div className="App">
      <button className="Buttons" onClick={() => navigate('/')}>Tasks</button>
      <button className="Buttons" onClick={() => navigate('/login')}>Log In</button>
      <button className="Buttons" onClick={() => navigate('/createaccount')}>Create Account</button>
    </div>
  );
}

function App() {
  return (
    <Router>
        <GlobalProvider>
        <NavigationButtons />
        
          <DisplayUsername />
          <Routes>
            <Route path="/" element={<TaskPage />} />
            <Route path="/createaccount" element={<CreateAccountPage />} />
            <Route path="/login" element={<LogInPage />} />
          </Routes>
        </GlobalProvider>
    </Router>
  );
}
export default App;
