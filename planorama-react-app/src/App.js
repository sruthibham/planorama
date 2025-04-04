import './App.css';
import ProfilePage from './ProfilePage';
import SettingsPage from './SettingsPage';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { GlobalProvider, useGlobal } from "./GlobalContext";
import { IoSettingsOutline } from "react-icons/io5";
import { useRef } from 'react';
import axios from 'axios';
import StreakTracker from './StreakTracker';


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
    axios.get("http://127.0.0.1:5000/logout")
      .then(response => {
        setUser(response.data);
    })
  }

  const navigate = useNavigate();

  return (
    <div className="User" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
     <div style={{ color: "black", padding: "5px", cursor: "pointer", fontSize: "15px"}} onClick={handleClick}>{user}</div>
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

function TaskTimeCell({ task, onLogClick }) {
  const total = (task.time_logs || []).reduce((sum, log) => sum + (log.minutes || 0), 0);
  return (
    <div className="TaskCell">
      <div><strong>{total} min</strong></div>
      <button
        className="SubtaskButton SubtaskConfirmButton"
        onClick={onLogClick}
        style={{ marginTop: "4px" }}
      >
        Log Time
      </button>
    </div>
  );
}

function TaskLogModal({
  task,
  onClose,
  onLogTime,
  onDeleteLog,
  logs,
  logInput,
  setLogInput,
  errorMsg,
  setTasks,
  setSelectedTaskLogs
}) {
  const [editingLogId, setEditingLogId] = useState(null);
  const [editLogMinutes, setEditLogMinutes] = useState("");

  const handleEditLog = (logId) => {
    const minutes = parseInt(editLogMinutes);
    if (isNaN(minutes) || minutes <= 0 || minutes > 1440) {
      alert("Please enter a time between 1 and 1440 minutes.");
      return;
    }

    axios
      .put(`http://127.0.0.1:5000/tasks/${task.id}/log_time/${logId}`, { minutes })
      .then((res) => {
        const updatedLogs = res.data.logs;
        setSelectedTaskLogs(updatedLogs);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, time_logs: updatedLogs } : t
          )
        );
        setEditingLogId(null);
        setEditLogMinutes("");
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <h2>Log Time for {task.name}</h2>

        {logs.map((log) => (
          <div key={log.id} className="TimeLogEntry">
            {editingLogId === log.id ? (
              <>
                <input
                  type="number"
                  value={editLogMinutes}
                  onChange={(e) => setEditLogMinutes(e.target.value)}
                  className="TextFields"
                  style={{ width: "70px" }}
                />
                <button onClick={() => handleEditLog(log.id)}>Save</button>
                <button onClick={() => setEditingLogId(null)}>Cancel</button>
              </>
            ) : (
              <>
                <span>{log.minutes} min - {log.timestamp}</span>
                <button
                  className="EditButton"
                  onClick={() => {
                    setEditingLogId(log.id);
                    setEditLogMinutes(log.minutes);
                  }}
                >
                  Edit
                </button>
                <button
                  className="DeleteButton"
                  onClick={() => {
                    axios
                      .delete(`http://127.0.0.1:5000/tasks/${task.id}/log_time/${log.id}`)
                      .then((res) => {
                        const updatedLogs = res.data.logs;
                        setSelectedTaskLogs(updatedLogs);
                        setTasks((prev) =>
                          prev.map((t) =>
                            t.id === task.id ? { ...t, time_logs: updatedLogs } : t
                          )
                        );
                      })
                      .catch((err) => console.error(err));
                  }}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}

        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "10px" }}>
          <input
            type="number"
            placeholder="Minutes"
            value={logInput}
            onChange={(e) => setLogInput(e.target.value)}
            className="TextFields"
          />
          <button
            className="SubtaskButton SubtaskConfirmButton"
            onClick={() => {
              const minutes = parseInt(logInput);
              if (isNaN(minutes) || minutes <= 0 || minutes > 1440) {
                alert("Please enter a time between 1 and 1440 minutes.");
                return;
              }

              axios
                .post(`http://127.0.0.1:5000/tasks/${task.id}/log_time`, { minutes })
                .then((res) => {
                  const updatedLogs = res.data.logs;
                  setSelectedTaskLogs(updatedLogs);
                  setLogInput("");
                  setTasks((prev) =>
                    prev.map((t) =>
                      t.id === task.id ? { ...t, time_logs: updatedLogs } : t
                    )
                  );
                })
                .catch((err) => console.error(err));
            }}
            style={{ backgroundColor: "#66dd66", color: "#fff", padding: "5px 10px" }}
          >
            Log Time
          </button>
        </div>

        {errorMsg && <p className="ErrorMessage">{errorMsg}</p>}

        <button
          className="Buttons"
          onClick={onClose}
          style={{ marginTop: "20px" }}
        >
          Close
        </button>
      </div>
    </div>
  );
}



function TaskPage() {
  const {user} = useGlobal();
  const [ loggedIn, setLoggedIn ] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [newTask, setNewTask] = useState({
    username: "",
    name: "",
    description: "",
    due_time: "",
    priority: "Medium",
    color_tag: "",
    status: "To-Do",
    start_date: "",
    time_log: "", 
    subtasks: [],
    completion_date: ""

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
  const [logModalTask, setLogModalTask] = useState(null);
  const [timeLogInput, setTimeLogInput] = useState("");
  const [timeLogError, setTimeLogError] = useState("");
  const [selectedTaskLogs, setSelectedTaskLogs] = useState([]);
  const [totalAcrossAllTasks, setTotalAcrossAllTasks] = useState(0);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const COLORS = [
    { name: "red", value: "#fbb9c5" },
    { name: "orange", value: "#fdd0b1" },
    { name: "yellow", value: "#f9efc7" },
    { name: "green", value: "#c3edbf" },
    { name: "blue", value: "#b8dfe6" },
    { name: "purple", value: "#c5bbde"}
  ];
  useEffect(() => {
    axios.get("http://127.0.0.1:5000/time_summary")
      .then(res => setTotalAcrossAllTasks(res.data.total_time_spent))
      .catch(err => console.error(err));
  }, [tasks]);

  useEffect(() => {
    if (user !== "Guest") {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
      setShowModal(false);
    }
  
    axios.get("http://127.0.0.1:5000/tasks")
      .then(response => {
        const today = new Date().toISOString().split("T")[0];
  
        const activeTasks = response.data.filter(task => !task.start_date || task.start_date <= today);
        const futureTasks = response.data.filter(task => task.start_date && task.start_date > today);
  
        setTasks(activeTasks);
        setScheduledTasks(futureTasks);
      })
      .catch(error => console.error("Error fetching tasks:", error));
  }, [user]);

  const handleAddSubtask = () => {
    if (!newSubtaskName.trim()) return;
  
    const newSubtask = {
      id: ((editingTask?.subtasks || newTask?.subtasks || []).length) + 1,
      name: newSubtaskName.trim(),
      completed: false,
    };
  
    if (editingTask) {
      setEditingTask(prev => ({
        ...prev,
        subtasks: [...(prev.subtasks || []), newSubtask],
      }));
    } else {
      setNewTask(prev => ({
        ...prev,
        subtasks: [...(prev.subtasks || []), newSubtask],
      }));
    }
  
    setNewSubtaskName(""); // Reset input field
  };
  
  const handleToggleSubtask = (taskId, subtaskId, completed) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map(sub =>
                sub.id === subtaskId ? { ...sub, completed } : sub
              ),
              status: task.subtasks.every(sub => sub.id === subtaskId ? completed : sub.completed) ? "Completed" : "In Progress",
            }
          : task
      )
    );
  
    axios.put(`http://127.0.0.1:5000/tasks/${taskId}/subtasks/${subtaskId}`, { completed })
      .catch(error => console.error("Error updating subtask:", error));
  };


  //changes state of pending to current task
  const handleDeleteClick = (taskId) => {
      if (pendingDelete === taskId) {
        handleDeleteConfirm(taskId);
      } else {
        setPendingDelete(taskId);
      }
  };

  const handleEditClick = (taskId) => {
    const taskToEdit = tasks.find(task => task.id === taskId)|| scheduledTasks.find(task => task.id === taskId);
    if (!taskToEdit) return;
    setEditingTask({ 
      ...taskToEdit, 
      subtasks: taskToEdit.subtasks ? taskToEdit.subtasks : [] // Ensure subtasks exist
    });
  
    setShowModal(true);
  };

  //officially deletes tasks
  const handleDeleteConfirm = (taskId) => {
    axios.delete(`http://127.0.0.1:5000/tasks/${taskId}`)
      .then(() => {
        setTasks(tasks.filter(task => task.id !== taskId)); // Remove task from UI
        setScheduledTasks(prev => prev.filter(task => task.id !== taskId)); // Remove task from scheduled tasks
        setPendingDelete(null); // restore Edit and Delete buttons
        setWarning("");
        setError("");
      })
      .catch(error => console.error("Error deleting task:", error));
  };
  
  //Resets pending back to null and resores edit/delete buttons
  const handleDeleteUndo = (taskId) => {
    setPendingDelete(null);
  };  

  // buttons to show delete/edit or confirm/undo
  const deleteButtons = (taskId) => {
    if (pendingDelete === taskId) {
      return (
        <div>
          <button className="ConfirmButton" onClick={() => handleDeleteConfirm(taskId)}>Confirm</button>
          <button className="UndoButton" onClick={() => handleDeleteUndo(taskId)}>Undo</button>
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
    const { name, value } = e.target;
  
    if (editingTask) {
      const updatedTask = { ...editingTask, [name]: value };
  
      // Trigger warning if completion_date is after due_time
      if (name === "completion_date" && updatedTask.due_time) {
        const due = new Date(updatedTask.due_time);
        const comp = new Date(value);
        if (comp > due) {
          setTaskWarning("This completion will not count toward your streak since it is after the due date.");
        } else {
          setTaskWarning(""); // Clear warning if it's valid
        }
      }
  
      setEditingTask(updatedTask);
    } else {
      const updatedTask = { ...newTask, [name]: value };
  
      if (name === "completion_date" && updatedTask.due_time) {
        const due = new Date(updatedTask.due_time);
        const comp = new Date(value);
        if (comp > due) {
          setTaskWarning("This completion will not count toward your streak since it is after the due date.");
        } else {
          setTaskWarning("");
        }
      }
  
      setNewTask(updatedTask);
    }
  };
  

  const handleSubmit = () => {
    setError("");
    setWarning("");
    const { due_time, start_date } = newTask;
    if (start_date && due_time) {
      const startDateObj = new Date(start_date);
      const dueDateObj = new Date(due_time);
      if (startDateObj > dueDateObj) {
        setError("Start date cannot be after the due date.");
        return;
      }
    }
    axios.post("http://127.0.0.1:5000/tasks", {
      username: user,
      name: newTask.name,
      description: newTask.description,
      due_time: newTask.due_time,
      priority: newTask.priority,
      color_tag: newTask.color_tag,
      status: newTask.status,
      start_date: newTask.start_date,
      time_log: newTask.time_log, 
      subtasks: newTask.subtasks,
      completion_date: newTask.status === "Completed" ? newTask.completion_date : null

    })
      .then(response => {
        const addedTask = response.data.task;

        // If task has a future start date, add to scheduledTasks instead
        const today = new Date().toISOString().split("T")[0]; // Get today's date in "YYYY-MM-DD" format
        if (addedTask.start_date && addedTask.start_date > today) {
          setScheduledTasks(prev => [...prev, addedTask]); 
        } else {
          setTasks(prev => [...prev, addedTask]); // Otherwise, add to active tasks
        }
        
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
          status: "To-Do",
          start_date: "",
          time_log: "", // Reset time log
          subtasks: [],
          completion_date: ""
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

  // Handle manual start of scheduled tasks
  const handleStartNow = (taskId) => {
    axios.put(`http://127.0.0.1:5000/tasks/${taskId}/start_now`)
      .then(() => {
        setScheduledTasks(prev => prev.filter(task => task.id !== taskId));
        axios.get("http://127.0.0.1:5000/tasks")  // Refresh tasks list
          .then(response => {
            const today = new Date().toISOString().split("T")[0];
            const activeTasks = response.data.filter(task => !task.start_date || task.start_date <= today);
            setTasks(activeTasks);
          });
      })
      .catch(error => {
        console.error("Error starting task early:", error);
      });
  };
  const handleFinishNow = (taskId) => {
    const taskToFinish = scheduledTasks.find(task => task.id === taskId);
    if (!taskToFinish) return;
  
    const today = new Date().toISOString().split("T")[0];
  
    axios.put(`http://127.0.0.1:5000/tasks/${taskId}`, {
      username: user,
      name: taskToFinish.name,
      description: taskToFinish.description,
      due_time: taskToFinish.due_time,
      priority: taskToFinish.priority,
      color_tag: taskToFinish.color_tag,
      status: "Completed",
      start_date: null,
      time_logs: taskToFinish.time_logs || [],
      subtasks: taskToFinish.subtasks || [],
      completion_date: today
    }).then(res => {
      setScheduledTasks(prev => prev.filter(t => t.id !== taskId));
      setTasks(prev => [...prev, res.data.task]);
    }).catch(err => console.error("Finish failed:", err));
  };
  
  
  // modify task in DB and UI
  const handleUpdateTask = () => {
    setError("");
  
    const { start_date, due_time } = editingTask;
    if (start_date && due_time) {
      const startDateObj = new Date(start_date);
      const dueDateObj = new Date(due_time);
      if (startDateObj > dueDateObj) {
        setError("Start date cannot be after the due date.");
        return;
      }
    }
  
    axios.put(`http://127.0.0.1:5000/tasks/${editingTask.id}`, {
      username: user,
      name: editingTask.name,
      description: editingTask.description,
      due_time: editingTask.due_time,
      priority: editingTask.priority,
      color_tag: editingTask.color_tag,
      status: editingTask.status,
      start_date: editingTask.start_date,
      time_log: editingTask.time_log,
      subtasks: editingTask.subtasks || [],
      completion_date: editingTask.status === "Completed" ? editingTask.completion_date : null
    })
      .then(response => {
        const updatedTask = response.data.task;
        const today = new Date().toISOString().split("T")[0];
  
        if (updatedTask.start_date && updatedTask.start_date > today) {
          // Move to scheduled tasks
          setScheduledTasks(prev => [...prev, updatedTask]);
          setTasks(prev => prev.filter(t => t.id !== updatedTask.id));
        } else {
          // Move to active tasks
          setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
          setScheduledTasks(prev => prev.filter(t => t.id !== updatedTask.id));
        }
  
        setEditingTask(null);
        setShowModal(false);
      })
      .catch(error => {
        if (error.response) {
          setError(error.response.data.error);
        } else {
          console.error("Error updating task:", error);
        }
      });
  };
  
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
  const navigate = useNavigate()
  return (
    <div>
      <h1 className="App">Your Tasks</h1>
      {/* Active Tasks Section */}
      <h2>Active Tasks</h2>
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
          <div className="TaskCell">Subtasks</div>
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
          <div className="TaskCell">Time Spent</div>
          <div className="TaskCell">Make Changes</div>
        </div>

        {taskWarning && (
          <div className="modal-overlay" onMouseDown={() => setTaskWarning("")}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
              <h3>⚠️ Heads up!</h3>
              <p>{taskWarning}</p>
              <button className="Buttons" onClick={() => setTaskWarning("")}>Got it</button>
            </div>
          </div>
        )}

        {tasks.length === 0 ? (
          // show 'No tasks avaible.' if tasks table empty
          <div>No tasks available.</div>
        ) : (
        filteredTasks.length === 0 ? (
          // show 'No tasks match.' if 0 tasks meet filter condition(s)
          <div>No tasks match.</div>
        ) : (
          filteredTasks.map(task => (
          <div key={task.id} className="TaskRow" style={{ backgroundColor: task.color_tag || '#faf7f0' }}>
            <div className="Task">{}</div>
            <div className="Task">{}</div>
            <div className="TaskCell">{task.name}</div>
            <td className="TaskCell" style={{ textAlign: "left"}}>
              {task.subtasks && task.subtasks.length > 0 ? (
                <div>
                  {task.subtasks.map(subtask => (
                    <div>
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => handleToggleSubtask(task.id, subtask.id, !subtask.completed)}
                      />
                      <span className={subtask.completed ? "SubtaskCompleted" : ""}>{subtask.name}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </td>
            <div className="TaskCell">{task.priority}</div>
            <div className="TaskCell">
              {task.status}
              {task.status === "Completed" && task.completion_date && (
                <span style={{ fontSize: "12px", display: "block" }}>
                  ({formatDate(task.completion_date)})
                </span>
              )}
            </div>


            <div className="TaskCell">{formatDate(task.due_time)}</div>
            
            <TaskTimeCell
              task={task}
              onLogClick={() => {
                axios.get(`http://127.0.0.1:5000/tasks/${task.id}`)
                  .then(res => {
                    setLogModalTask(task);
                    setSelectedTaskLogs(res.data.time_logs || []);
                    setTimeLogInput("");
                    setTimeLogError("");
                  })
                  .catch(err => console.error(err));
              }}
            />
            <div className="TaskCell">
              {deleteButtons(task.id)}
            </div>
          </div>
        ))
      ))}
      
      {scheduledTasks.length > 0 && (
        <div style={{ marginTop: "40px", opacity: 0.8 }}>
          <h3 style={{ fontSize: "16px", fontWeight: "bold" }}>Scheduled Tasks</h3>
          <div className="ScheduledTaskContainer">
            {scheduledTasks.map(task => (
              <div
                key={task.id}
                className="ScheduledTask"
                style={{
                  backgroundColor: task.color_tag || '#faf7f0',
                  fontSize: "14px",
                  padding: "5px",
                  borderRadius: "5px",
                  marginBottom: "5px"
                }}
              >
                <div>{task.name}</div>
                <div style={{ fontSize: "12px", color: "#555" }}>Starts on: {formatDate(task.start_date)}</div>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button className="EditButton" onClick={() => handleEditClick(task.id)}>Edit</button>
                  <button className="DeleteButton" onClick={() => handleDeleteClick(task.id)}>Delete</button>
                  <button className="ConfirmButton" onClick={() => handleStartNow(task.id)}>Start Now</button>
                  <button className="ConfirmButton" onClick={() => handleFinishNow(task.id)}>Finish</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="TimeSummary">
        <h3>Total Time Spent Across All Tasks: {totalAcrossAllTasks} min</h3>
      </div>

      </div>

      { loggedIn &&
        <button className="MakeTaskButton" onClick={() => setShowModal(true)}>Create Task</button>
      }
      { !loggedIn &&
        <h3 style={{textAlign: "center"}}>Log in to start making tasks!</h3>
      } 
      <button className="Buttons" onClick={() => navigate('/streak')} style={{ margin: "10px auto", display: "block" }}>
        Streak Tracker
      </button>
      {taskWarning && (
          <div className="TaskWarning">
          <p>{taskWarning}</p>
          <button onClick={() => setTaskWarning("")} className="CloseWarningButton">✖</button>
          </div>)}
      
      {logModalTask && (
        <TaskLogModal
          task={logModalTask}
          logs={selectedTaskLogs}
          logInput={timeLogInput}
          setLogInput={setTimeLogInput}
          errorMsg={timeLogError}
          onClose={() => setLogModalTask(null)}
          setTasks={setTasks} 
          setSelectedTaskLogs={setSelectedTaskLogs}
        />
      )}

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
                status: "To-Do",
                start_date: "",
                time_log: "", 
                subtasks: []
              });
              setNewSubtaskName("");
              setIsAddingSubtask(false);
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
            {/* Added start_date input */}
            <label style={{ fontSize: "14px", marginTop: "10px" }}>Start Date (optional)</label>
            <input type="date" name="start_date" 
              value={editingTask ? editingTask.start_date : newTask.start_date}
              onChange={handleChange}
              className="TextFields"
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

            {(editingTask?.status === "Completed" || newTask.status === "Completed") && (
              <>
                <label style={{ fontSize: "14px", marginTop: "10px" }}>Completion Date</label>
                <input
                  type="date"
                  name="completion_date"
                  value={editingTask ? editingTask.completion_date : newTask.completion_date}
                  onChange={handleChange}
                  className="TextFields"
                  required
                />
              </>
            )}

            {(editingTask || newTask) && (
              <div className="SubtaskContainer" style={{ textAlign: "left", width: "100%" }}>
                <h3>Subtasks</h3>
                {(editingTask?.subtasks || newTask?.subtasks || []).map((subtask, index) => (
                  <div key={index} className="SubtaskRow" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => {
                      if (editingTask) {
                        const updatedSubtasks = [...editingTask.subtasks];
                        updatedSubtasks[index].completed = !subtask.completed;
                        setEditingTask({ ...editingTask, subtasks: updatedSubtasks });
                      } else {
                        const updatedSubtasks = [...editingTask.subtasks];
                        updatedSubtasks[index].completed = !subtask.completed;
                        setNewTask({ ...newTask, subtasks: updatedSubtasks });
                      }
                    }}
                  />
            
                  {!subtask.isEditing ? (
                    <span className={subtask.completed ? "SubtaskCompleted" : ""}>{subtask.name}</span>
                  ) : (
                    <input
                      type="text"
                      value={subtask.name}
                      onChange={(e) => {
                        if (editingTask) {
                          const updatedSubtasks = [...editingTask.subtasks];
                          updatedSubtasks[index].name = e.target.value;
                          setEditingTask({ ...editingTask, subtasks: updatedSubtasks });
                        } else {
                          const updatedSubtasks = [...newTask.subtasks];
                          updatedSubtasks[index].name = e.target.value;
                          setNewTask({ ...newTask, subtasks: updatedSubtasks });
                        }
                      }}
                      className="SubtaskInput"
                      style={{ width: "80%" }}
                    />
                  )}
            
                  {!subtask.isEditing ? (
                    <button
                      className="SubtaskButton SubtaskEditButton"
                      onClick={() => {
                        if (editingTask) {
                          const updatedSubtasks = [...editingTask.subtasks];
                          updatedSubtasks[index].isEditing = true;
                          setEditingTask({ ...editingTask, subtasks: updatedSubtasks });
                        } else {
                          const updatedSubtasks = [...newTask.subtasks];
                          updatedSubtasks[index].isEditing = true;
                          setNewTask({ ...newTask, subtasks: updatedSubtasks });
                        }
                      }}
                    >
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        className="SubtaskButton SubtaskConfirmButton"
                        onClick={() => {
                          if (editingTask) {
                            const updatedSubtasks = [...editingTask.subtasks];
                            updatedSubtasks[index].isEditing = false;
                            setEditingTask({ ...editingTask, subtasks: updatedSubtasks });
                          } else {
                            const updatedSubtasks = [...newTask.subtasks];
                            updatedSubtasks[index].isEditing = false;
                            setNewTask({ ...newTask, subtasks: updatedSubtasks });
                          }
                        }}
                      >
                        Save
                      </button>
                      <button
                        className="SubtaskButton SubtaskCancelButton"
                        onClick={() => {
                          const updatedSubtasks = [...(editingTask?.subtasks || newTask?.subtasks)];
                          updatedSubtasks[index].isEditing = false;

                          if (editingTask) {
                            setEditingTask({ ...editingTask, subtasks: updatedSubtasks });
                          } else {
                            setNewTask({ ...newTask, subtasks: updatedSubtasks });
                          }
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
            
                  <button
                    className="SubtaskButton SubtaskDeleteButton"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this subtask?")) {
                        if (editingTask) {
                          setEditingTask(prev => ({
                            ...prev,
                            subtasks: prev.subtasks.filter((_, i) => i !== index)
                          }));
                        } else {
                          setNewTask(prev => ({
                            ...prev,
                            subtasks: prev.subtasks.filter((_, i) => i !== index)
                        }));
                      }
                    }
                  }}
                  >
                    Delete
                  </button>
                </div>
              ))}
              {isAddingSubtask ? (
                <div className="AddSubtaskRow" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="text"
                    value={newSubtaskName}
                    onChange={(e) => setNewSubtaskName(e.target.value)}
                    className="TextFields"
                    placeholder="Enter new subtask..."
                  />
                  <button
                    onClick={() => {
                      if (newSubtaskName.trim() !== "") {
                        if (editingTask) {
                          setEditingTask((prev) => ({
                            ...prev,
                            subtasks: [...prev.subtasks, { id: prev.subtasks.length + 1, name: newSubtaskName.trim(), completed: false, isEditing: false }],
                          }));
                        } else {
                          setNewTask((prev) => ({
                            ...prev,
                            subtasks: [...prev.subtasks, { id: prev.subtasks.length + 1, name: newSubtaskName.trim(), completed: false, isEditing: false }],
                          }));
                        }
                        setNewSubtaskName("");
                        setIsAddingSubtask(false);
                      }
                    }}
                    className="SubtaskButton SubtaskConfirmButton"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => {setNewSubtaskName("");setIsAddingSubtask(false)}}
                    className="SubtaskButton SubtaskCancelButton"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingSubtask(true)}
                  className="SubtaskButton"
                >
                  + Add Subtask
                </button>
              )}
            </div>
            )}
            <div className = "ButtonContainer"> 
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
                status: "To-Do",
                start_date: "",
                time_log: "", // Reset time log
                subtasks:[]});setNewSubtaskName("");setIsAddingSubtask(false);setShowModal(false);}} className="Buttons">Cancel</button>
            </div>
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', height: '3vh', padding: '10px' }}>
      <button className="Buttons" onClick={() => navigate('/')}>Planorama</button>

      {/* Commented out these buttons because they were moved to a different menu (top right)
      You can uncomment them for testing if you want*/}
      {/* <button className="Buttons" onClick={() => navigate('/login')}>Log In</button>
      <button className="Buttons" onClick={() => navigate('/createaccount')}>Create Account</button>
      <button className="ProfileIcon" onClick={() => navigate('/profile')}>
        <img src="/default-profile.png" alt="Profile" className="ProfileIconImage" />
      </button> */}
      <div className="SettingsButton" onClick={() => navigate('/settings')}> 
        <IoSettingsOutline />
      </div>
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
            <Route path="/streak" element={<StreakTracker />} />
          </Routes>
        </GlobalProvider>
    </Router>
  );
}

export default App;
