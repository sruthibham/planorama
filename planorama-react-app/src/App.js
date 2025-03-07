import './App.css';
import ProfilePage from './ProfilePage';
import SettingsPage from './SettingsPage';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { GlobalProvider, useGlobal } from "./GlobalContext";
import { IoSettingsOutline } from "react-icons/io5";
import axios from 'axios';


function DisplayUsername() {
  const { user } = useGlobal();
  const { setUser } = useGlobal();
  const [showExtraButtons, setShowExtraButtons] = useState(false);
  const [showLogoutButton, setShowLogoutButton] = useState(false);

  useEffect(() => {
    if (user !== "Guest") {
      setShowLogoutButton(true);
    } else {
      setShowLogoutButton(false);
    }
  }, [user]);

  const handleClick = () => {
    if (showExtraButtons===false) {
      setShowExtraButtons(true);
    } else {
      setShowExtraButtons(false);
    }
  };

  const handleLogout = () => {
    setUser("Guest")

  }

  const navigate = useNavigate();

  return (
    <div className="User" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <button className="TransparentButton" onClick={handleClick}>{user}</button>
      {showExtraButtons && (
        <div style={{ marginTop: "5px", display: "flex", flexDirection: "column", gap: "2px" }}>
          {!showLogoutButton && (
            <>
              <button className="Buttons" onClick={() => navigate('/login')}>Log In</button>
              <button className="Buttons" onClick={() => navigate('/createaccount')}>Create Account</button>
            </>
          )}
          {showLogoutButton && (
            <>
              <button className="Buttons" onClick={() => navigate('/profile')}>
                <img src="/default-profile.png" alt="Profile" className="ProfileIconImage" />
              </button>
              <button className="Buttons" onClick={handleLogout}>Log Out</button>
            </>
          )
          }
          
        </div>
      )}
    </div>
  )
}

function TaskPage() {
  const {user} = useGlobal();
  const [ loggedIn, setLoggedIn ] = useState(false);
  const [tasks, setTasks] = useState([]);
  // holds 10 deleted tasks for undoing
  const [deletedTasks, setDeletedTasks] = useState([]);
  //ui to show deleted tasks
  const [showTrashModal, setShowTrashModal] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({
    username: "",
    name: "",
    description: "",
    due_time: "",
    priority: "Medium",
    color_tag: "",
    status: "To-Do"
  });
  const [editingTask, setEditingTask] = useState(null);
  //for filtering by priority
  const [filterPriority, setFilteredPriority] = useState("None");
  const [filterStatus, setFilteredStatus] = useState("None");
  const [filterColor, setFilterColor] = useState("None");
  //for deletions that haven't been decided yet
  const [pendingDelete, setPendingDelete] = useState([null]);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [taskWarning, setTaskWarning] = useState("");
  const COLORS = [
    { name: "red", value: "#fbb9c5" },
    { name: "orange", value: "#fdd0b1" },
    { name: "yellow", value: "#f9efc7" },
    { name: "green", value: "#c3edbf" },
    { name: "purple", value: "#c5bbde"}
  ];

  useEffect(() => {
    if (user !== "Guest") {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
      setShowModal(false);
      setShowTrashModal(false);
    }
    axios.get("http://127.0.0.1:5000/tasks")
      .then(response => {
        setTasks(response.data);
      })
      .catch(error => console.error("Error fetching tasks:", error));
  }, [user]);


  //changes state of pending to current task
  const handleDeleteClick = (taskId) => {
      if (pendingDelete === taskId) {
        handleDeleteConfirm(taskId);
      } else {
        setPendingDelete(taskId);
      }
  };

  const handleEditClick = (taskId) => {
    const taskToEdit = tasks.find(task => task.id == taskId);
    setEditingTask(taskToEdit);
    setShowModal(true);
  };

  //officially deletes tasks
  const handleDeleteConfirm = (taskId) => {

    //jack
    setDeletedTasks(prevDeletedTask => {

      //adds task that has been "deleted" to buffer
      const taskToDelete = tasks.find(task => task.id === taskId)

      //creates new array with newly deleted task
      const updatedDeletedTasks = [...prevDeletedTask, taskToDelete]

      //starts deleting tasks when more than 10
      if (updatedDeletedTasks.length > 10) {
        updatedDeletedTasks.shift()

        axios.delete(`http://127.0.0.1:5000/tasks/${taskId}`)
          .then(() => {
          
        })
      .catch(error => console.error("Error deleting task:", error));
      }
    
      //will set new state of deleted tasks
      return updatedDeletedTasks
    });

    setTasks(tasks.filter(task => task.id !== taskId)); // Remove task from UI
    setPendingDelete(null); // restore Edit and Delete buttons
    setWarning("");
    setError("");
    
  };
  
  //Resets pending back to null and resores edit/delete buttons
  const handleDeleteDeny = (taskId) => {
    setPendingDelete(null);
  };  

  //undos action from inside the trash
  //jack
  const handleDeleteUndo = (taskId) => {
    //adds task that has been "deleted" to buffer
    const taskToRestore = deletedTasks.find(task => task.id === taskId)
    
    if(taskToRestore) {
      //gets rid of task in deleted tasks
      setDeletedTasks(prevDeletedTasks => prevDeletedTasks.filter(task => task.id !== taskId));

      //adds tasks back to task list
      setTasks(prevTasks => [...prevTasks, taskToRestore])
    }
    else {
      console.log("error with task restoration")
    }

    
  };

  // buttons to show delete/edit or confirm/deny
  const deleteButtons = (taskId) => {
    if (pendingDelete === taskId) {
      return (
        <div>
        <button className="ConfirmButton" onClick={() => handleDeleteConfirm(taskId)}>Confirm</button>
        <button className="DenyButton" onClick={() => handleDeleteDeny(taskId)}>Deny</button>
        </div>
      )
    }
    else {
      return (
        <div>
        <button className="EditButton" onClick={() => handleEditClick(taskId)}>Edit</button>
        <button className="DeleteButton" onClick={() => handleDeleteClick(taskId)}>Delete</button>
        </div>
      )
    }
    
  };  

  const handleChange = (e) => {
    if (editingTask) {
      setEditingTask({ ...editingTask, [e.target.name]: e.target.value });
    } else {
      setNewTask({ ...newTask, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = () => {
    setError("");
    setWarning("");
  
    axios.post("http://127.0.0.1:5000/tasks", {
      username: user,
      name: newTask.name,
      description: newTask.description,
      due_time: newTask.due_time,
      priority: newTask.priority,
      color_tag: newTask.color_tag,
      status: newTask.status
    })
      .then(response => {
        setTasks([...tasks, response.data.task]);
  
        if (response.data.warning) {
          setTaskWarning(response.data.warning);
        }
  
        setNewTask({
          username: user,
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

  // modify task in DB and UI
  const handleUpdateTask = () =>{
    axios.put(`http://127.0.0.1:5000/tasks/${editingTask.id}`, {
      username: user,
      name: editingTask.name,
      description: editingTask.description,
      due_time: editingTask.due_time,
      priority: editingTask.priority,
      color_tag: editingTask.color_tag,
      status: editingTask.status
    })
      .then(response => {
        setTasks(tasks.map(task =>
          task.id === editingTask.id ? response.data.task : task
        ));
        setEditingTask(null);
        setShowModal(false);
      })
      .catch(error =>  {
        if (error.response) {
          setError(error.response.data.error);
        } else {
          console.error("Error creating task:", error);
        }
      })
  }

   const formatDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${month}/${day}/${year}`;
  };

  //sets tasks to all tasks
  let filteredTasks = tasks

  //checks if priority is filtered
  if (filterPriority !== "None") {
    filteredTasks = filteredTasks.filter((task) => 
      task.priority === filterPriority
    );
  }

  //checks if status is filtered
  if (filterStatus !== "None") {
    filteredTasks = filteredTasks.filter((task) => 
      task.status === filterStatus
    );
  }

  // checks if color tag is filtered
  if (filterColor !== "None") {
    filteredTasks = filteredTasks.filter((task) => 
      task.color_tag === filterColor);
  }
  
  return (
    <div>
      <h1 className="App">Your Tasks</h1>
      
      <div className="TaskTable">
        <div className="TaskRow TaskHeader">
          <label>
            Filter:  
          </label>
          <label>
            Color:
            <select value={filterColor} onChange={(e) => setFilterColor(e.target.value)}>
              <option value="None">None</option>
              {COLORS.map((color) => (
                <option key={color.value} value={color.value} style={{ backgroundColor: color.value }}>
                  {color.name}
                </option>
              ))}
            </select>
          </label>
          <div className="TaskCell">Task</div>
          <div className="TaskCell">
            Priority:
            <select value={filterPriority} onChange={(e) => setFilteredPriority(e.target.value)}>
              <option value="None">None</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="TaskCell">
            Status:
            <select value={filterStatus} onChange={(e) => setFilteredStatus(e.target.value)}>
              <option value="None">None</option>
              <option value="To-Do">To-Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="TaskCell">Deadline</div>
          <div className="TaskCell">Make Changes</div>
        </div>

        {tasks.length === 0 ? (
          // show 'No tasks avaible.' if tasks table empty
          <div>No tasks available.</div>
        ) : (
        filteredTasks.length === 0 ? (
          // show 'No tasks match.' if 0 tasks meet filter condition(s)
          <div>No tasks match.</div>
        ) : (
          filteredTasks.map(task => (
           loggedIn &&
          <div key={task.id} className="TaskRow" style={{ backgroundColor: task.color_tag || '#faf7f0' }}>
            <div className="Task">{}</div>
            <div className="Task">{}</div>
            <div className="TaskCell">{task.name}</div>
            <div className="TaskCell">{task.priority}</div>
            <div className="TaskCell">{task.status}</div>
            <div className="TaskCell">{formatDate(task.due_time)}</div>
            <div className="TaskCell">
              {deleteButtons(task.id)}
            </div>
          </div>
          
        ))
      ))}
      </div>

      { loggedIn &&
        <div className="TaskTrashButtons">
          <button className="MakeTaskButton" onClick={() => setShowModal(true)}>Create Task</button>
          <button className="MakeTrashButton" onClick={() => setShowTrashModal(true)}>Trash</button>
        </div>
      }
      { !loggedIn &&
        <h3 style={{textAlign: "center"}}>Log in to start making tasks!</h3>
      } 

      {taskWarning && (
          <div className="TaskWarning">
          <p>{taskWarning}</p>
          <button onClick={() => setTaskWarning("")} className="CloseWarningButton">✖</button>
          </div>)}

      {showModal && (
        <div 
            className="modal-overlay" 
            onMouseDown={() => {
              setError("");
              setWarning("");
              setEditingTask(null);
              setNewTask({
                username: user,
                name: "",
                description: "",
                due_time: "",
                priority: "Medium",
                color_tag: "",
                status: "To-Do"
              });
              setShowModal(false);
            }}
          >
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <h2>{editingTask ? "Edit Task" : "Create Task"}</h2>


            {error && <p className="ErrorMessage">{error}</p>}
            {warning && <p className="WarningMessage">{warning}</p>}

            <input type="text" name="name" placeholder="Task Name" 
              value={editingTask ? editingTask.name : newTask.name}
              onChange={handleChange} 
              className="TextFields" required 
            />
            <input type="text" name="description" placeholder="Description (Optional)"
              value={editingTask ? editingTask.description : newTask.description}
              onChange={handleChange} 
              className="TextFields" 
            />
            <input type="date" name="due_time" 
              value={editingTask ? editingTask.due_time : newTask.due_time}
              onChange={handleChange} 
              className="TextFields" required 
            />

            <select name="priority" onChange={handleChange} className="TextFields"
              value={editingTask ? editingTask.priority : newTask.priority}
            >
              <option value="Low">Low</option>
              <option value="Medium" selected>Medium</option>
              <option value="High">High</option>
            </select>

            <select name="color_tag" onChange={handleChange} className="TextFields"
              value={editingTask ? editingTask.color_tag : newTask.color_tag}
            >
              <option value="">No color</option>
              {COLORS.map((color) => (
                <option key={color.value} value={color.value} style={{ backgroundColor: color.value }}>
                  {color.name}
                </option>
              ))}
            </select>
              
            <select name="status" onChange={handleChange} className="TextFields"
              value={editingTask ? editingTask.status : newTask.status}
            >
              <option value="To-Do">To-Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            <button onClick={editingTask ? handleUpdateTask : handleSubmit} className="Buttons">Save</button>
            <button onClick={() => {
              setError("");
              setWarning("");
              setEditingTask(null);
              setNewTask({
              username: user,
              name: "",
              description: "",
              due_time: "",
              priority: "Medium",
              color_tag: "",
              status: "To-Do"});setShowModal(false);}} className="Buttons">Cancel</button>
          </div>
        </div>
      )}

      {showTrashModal && (
        <div
            className="trash-modal-overlay" 
            onMouseDown={() => {
              setError("");
              setWarning("");
              setShowTrashModal(false);
            }}
        >
          <div className="trash-modal" onMouseDown={(e) => e.stopPropagation()}>
            <h2>{"Past Tasks"}</h2>
            {deletedTasks.length === 0 ? (
              //if deletedTasks is 0 none have been deleted
              <div>No tasks have been deleted.</div>
            ) : (
              deletedTasks.map(task => (
              loggedIn &&
              <div key={task.id} className="TaskTrashRow" style={{ backgroundColor: task.color_tag || '#faf7f0' }}>
                <div className="TaskTrashCell">{task.name}</div>
                <div className="TaskTrashCell">{task.priority}</div>
                <div className="TaskTrashCell">{task.status}</div>
                <div className="TaskTrashCell">{formatDate(task.due_time)}</div>
                <div className="TaskTrashCell">
                  <button className="UndoButton" onClick={() => handleDeleteUndo(task.id)}>Undo</button>
                </div>
              </div>
              ))
            )}

            <button onClick={() => {
              setError("");
              setWarning("");
              setEditingTask(null);
              setShowTrashModal(false);}} className="Buttons">Close</button>   
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

  const navigate = useNavigate();

  const handleSubmit = () => {
    axios.post("http://127.0.0.1:5000/createuser", { username: username, email: email, password: password })
    .then(response => {
      setErrMsg(response.data.msg)
      if (response.data.success) {
        setUser(username);  // Update global state
        navigate("/")
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

  const navigate = useNavigate();

  const handleSubmit = () => {
    axios.post("http://127.0.0.1:5000/loguser", { username: username, password: password })
    .then(response => {
      setErrMsg(response.data.msg)
      if (response.data.success) {
        setUser(username);  // Update global state
        navigate("/")
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
      {/* Commented out these buttons because they were moved to a different menu (top right)
      You can uncomment them for testing if you want*/}
      {/* <button className="Buttons" onClick={() => navigate('/login')}>Log In</button>
      <button className="Buttons" onClick={() => navigate('/createaccount')}>Create Account</button>
      <button className="ProfileIcon" onClick={() => navigate('/profile')}>
        <img src="/default-profile.png" alt="Profile" className="ProfileIconImage" />
      </button> */}

      <button className="SettingsButton" onClick={() => navigate('/settings')}> 
      <IoSettingsOutline />
      </button>
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
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </GlobalProvider>
    </Router>
  );
}

export default App;
