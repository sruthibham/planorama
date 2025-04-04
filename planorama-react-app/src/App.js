import './App.css';
import ProfilePage from './ProfilePage';
import SettingsPage from './SettingsPage';
import TaskDependenciesPage from './TaskDependenciesPage';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { GlobalProvider, useGlobal } from "./GlobalContext";
import { IoSettingsOutline } from "react-icons/io5";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useRef } from 'react';
import axios from 'axios';
import React from 'react';


const resizeObserverErrorHandler = (e) => {
  if (e.message.includes("ResizeObserver loop completed with undelivered notifications")) {
    e.stopImmediatePropagation();
  }
};

window.addEventListener("error", resizeObserverErrorHandler);
window.addEventListener("unhandledrejection", resizeObserverErrorHandler);

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

function TaskPage() {
  const {user} = useGlobal();
  const [ loggedIn, setLoggedIn ] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [newTask, setNewTask] = useState({
    username: "",
    name: "",
    description: "",
    due_time: "",
    priority: "Medium",
    color_tag: "",
    status: "To-Do",
    start_date: "",
    time_log: "", // This will store the time log for the task
    subtasks: [],

  });
  const [editingTask, setEditingTask] = useState(null);
  //for filtering by priority
  const [filterPriority, setFilteredPriority] = useState("None");
  const [filterStatus, setFilteredStatus] = useState("None");
  const [filterColor, setFilterColor] = useState("None");
  //for deletions that haven't been decided yet
  const [pendingDelete, setPendingDelete] = useState([null]);
  const [error, setError] = useState("");
  const [dependencyError, setDependencyError] = useState("");
  const [warning, setWarning] = useState("");
  const [taskWarning, setTaskWarning] = useState("");
  const [timeLogInput, setTimeLogInput] = useState("");
  const [timeLogError, setTimeLogError] = useState("");
  const [selectedTaskLogs, setSelectedTaskLogs] = useState([]);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [draggingOverIndex, setDraggingOverIndex] = useState(null);
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const COLORS = [
    { name: "red", value: "#fbb9c5" },
    { name: "orange", value: "#fdd0b1" },
    { name: "yellow", value: "#f9efc7" },
    { name: "green", value: "#c3edbf" },
    { name: "blue", value: "#b8dfe6" },
    { name: "purple", value: "#c5bbde"}
  ];

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

  const getTotalTime = (task) => {
    return (task.time_logs || []).reduce((sum, log) => sum + (log.minutes || 0), 0);
  };

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
    const taskToEdit = tasks.find(task => task.id === taskId);
  
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
        setPendingDelete(null); // restore Edit and Delete buttons
        setWarning("");
        setError("");
      })
      .catch(error => {
        const msg = error.response?.data?.error || "Error deleting task.";
        const blockingTasks = error.response?.data?.blocking_tasks || [];
      
        if (blockingTasks.length > 0) {
          const fullMsg = `${msg} Blocking tasks: ${blockingTasks.join(", ")}`;
          setDependencyError(fullMsg);
          setError("");
        } else {
          setError(msg);
          setDependencyError("");
        }
      });
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
      status: newTask.status,
      start_date: newTask.start_date,
      time_log: newTask.time_log, 
      subtasks: newTask.subtasks
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
          subtasks: []
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
        window.location.reload();
      })
      .catch(error => {
        console.error("Error starting task early:", error);
      });
  };

  const handleAddTimeLog = (taskId) => {
    const minutes = parseInt(timeLogInput);
    if (isNaN(minutes)) {
      setTimeLogError("Please enter a valid number.");
      return;
    }
    if (minutes <= 0 || minutes > 1440) {
      setTimeLogError("Time must be between 1 and 1440 minutes.");
      return;
    }
    axios.post(`http://127.0.0.1:5000/tasks/${taskId}/log_time`, { minutes })
      .then(res => {
        setSelectedTaskLogs(res.data.logs);
        setTotalTimeSpent(res.data.total);
        setTimeLogInput("");
        setTimeLogError("");
      })
      .catch(err => {
        console.error(err);
      });
  };
  
  const handleDeleteTimeLog = (taskId, logId) => {
    axios.delete(`http://127.0.0.1:5000/tasks/${taskId}/log_time/${logId}`)
      .then(res => {
        setSelectedTaskLogs(res.data.logs);
        setTotalTimeSpent(res.data.total);
      })
      .catch(err => console.error(err));
  };
  
  const fetchTimeLogs = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    setEditingTask(task);
    setShowModal(true);
    axios.get(`http://127.0.0.1:5000/tasks/${taskId}`)
      .then(res => {
        setSelectedTaskLogs(res.data.time_logs || []);
        setTotalTimeSpent(res.data.total_time || 0);
      })
      .catch(err => console.error(err));
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
      status: editingTask.status,
      start_date: editingTask.start_date,
      time_log: editingTask.time_log, 
      subtasks: editingTask.subtasks || []
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
          <div className="TaskCell">Time Spent</div>
          <div className="TaskCell">Deadline</div>
          <div className="TaskCell">Dependencies</div>
          <div className="TaskCell">Make Changes</div>
        </div>

        {tasks.length === 0 ? (
          <div>No tasks available.</div>
        ) : filteredTasks.length === 0 ? (
          <div>No tasks match.</div>
        ) : (
          <DragDropContext
          onDragEnd={(result) => {
            const { destination, source } = result;
          
            // Always clear highlight bar
            setDraggingOverIndex(null);
            setDraggingTaskId(null);
          
            if (!destination || destination.index === source.index) return;
          
            const reordered = Array.from(filteredTasks);
            const [movedTask] = reordered.splice(source.index, 1);
            reordered.splice(destination.index, 0, movedTask);
          
            setTasks(reordered);
            axios.post("http://127.0.0.1:5000/tasks/reorder", reordered.map(task => task.id))
              .catch((err) => console.error("Failed to reorder:", err));
          }}
            onDragUpdate={(update) => {
              if (!update.destination) {
                setDraggingOverIndex(null);
                return;
              }
            
              const sourceIndex = update.source.index;
              const destIndex = update.destination.index;
            
              let adjustedIndex = destIndex;
              
              if (destIndex > sourceIndex) {
                adjustedIndex = destIndex + 1;
              }
            
              setDraggingOverIndex(adjustedIndex);
            }}
          >
            <Droppable droppableId="task-list">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {filteredTasks.map((task, index) => {
                  const shouldShowBar = draggingOverIndex === index;
                  return (
                    <React.Fragment key={task.id}>
                      {shouldShowBar && (
                        <div
                          style={{
                            height: "8px",
                            backgroundColor: "#d0d0d0",
                            margin: "4px 0",
                            borderRadius: "4px",
                            transition: "background-color 0.2s ease",
                          }}
                        />
                      )}
                    <Draggable draggableId={String(task.id)} index={index} key={task.id}>
                      {(provided, snapshot) => (
                        <div
                          className="TaskRow"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            backgroundColor: snapshot.isDragging
                              ? "#e0e0e0"
                              : task.color_tag || "#faf7f0",
                            ...provided.draggableProps.style,
                            boxShadow: snapshot.isDragging
                              ? "0 0 10px rgba(0,0,0,0.3)"
                              : "none",
                          }}
                        >
                          <div className="Task"></div>
                          <div className="Task"></div>
                          <div className="TaskCell">{task.name}</div>
                          <td className="TaskCell" style={{ textAlign: "left" }}>
                            {task.subtasks && task.subtasks.length > 0 ? (
                              <div>
                                {task.subtasks.map(subtask => (
                                  <div key={subtask.id}>
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
                          <div className="TaskCell">{task.status}</div>
                          <TaskTimeCell task={task} onLogClick={handleEditClick} />
                          <div className="TaskCell">{formatDate(task.due_time)}</div>
                          <div className="TaskCell">
                            {(task.dependencies || []).map((depId, idx) => {
                              const dep = tasks.find(t => t.id === depId);
                              if (!dep) return null;
                              return (
                                <div key={idx}>
                                  <span className={dep.status === 'Completed' ? 'SubtaskCompleted' : ''}>
                                    {dep.name} - {formatDate(dep.due_time)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="TaskCell">{deleteButtons(task.id)}</div>
                        </div>
                      )}
                    </Draggable>
                  </React.Fragment>
                  );
                })}
                  {draggingOverIndex === filteredTasks.length && (
                    <div
                      style={{
                        height: "8px",
                        backgroundColor: "#d3d3d3",
                        borderRadius: "4px",
                        margin: "4px 0",
                        transition: "all 0.2s ease-in-out",
                      }}
                    />
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      {scheduledTasks.length > 0 && (
        <div style={{ marginTop: "40px", opacity: 0.8 }}>
          <h3 style={{ fontSize: "16px", fontWeight: "bold" }}>Scheduled Tasks</h3>
          <div className="ScheduledTaskContainer">
            {scheduledTasks.map(task => (
              <div key={task.id} className="ScheduledTask" style={{
                backgroundColor: task.color_tag || '#faf7f0',
                fontSize: "14px",
                padding: "5px",
                borderRadius: "5px",
                marginBottom: "5px"
              }}>
                <div>{task.name}</div>
                <div style={{ fontSize: "12px", color: "#555" }}>Starts on: {formatDate(task.start_date)}</div>
                <button className="ConfirmButton" onClick={() => handleStartNow(task.id)}>Start Now</button>
              </div>
            ))}
          </div>
        </div>
      )}

      </div>

      { loggedIn &&
        <button className="MakeTaskButton" onClick={() => setShowModal(true)}>Create Task</button>
      }
      { !loggedIn &&
        <h3 style={{textAlign: "center"}}>Log in to start making tasks!</h3>
      } 

      {dependencyError && (
        <div className="TaskWarning">
          <p>{dependencyError}</p>
          <button onClick={() => setDependencyError("")} className="CloseWarningButton">✖</button>
        </div>
      )}

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
              if (editingTask) {
                const cleanedSubtasks = editingTask.subtasks.map(sub => ({
                  ...sub,
                  isEditing: false,
                  editName: undefined,
                }));
                setEditingTask(prev => ({ ...prev, subtasks: cleanedSubtasks }));
              }
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
            <input type="date" name="start_date"
              value={editingTask ? editingTask.start_date : newTask.start_date}
              onChange={handleChange}
              className="TextFields"
            />
            <div className="TimeLogSection">
              <h3>Time Logs</h3>
              {selectedTaskLogs.map(log => (
                <div key={log.id} className="TimeLogEntry">
                  <span>{log.minutes} min - {log.timestamp}</span>
                  <button onClick={() => handleDeleteTimeLog(editingTask.id, log.id)}>Delete</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "10px" }}>
                <input
                  type="number"
                  placeholder="Minutes"
                  value={timeLogInput}
                  onChange={(e) => setTimeLogInput(e.target.value)}
                  className="TextFields"
                />
                <button className="SubtaskButton SubtaskConfirmButton" onClick={() => handleAddTimeLog(editingTask.id)}>Log Time</button>
              </div>
              {timeLogError && <p className="ErrorMessage">{timeLogError}</p>}
              <p><strong>Total Time Spent:</strong> {totalTimeSpent} min</p>
            </div>
            <h3>Total Time Spent Across All Tasks: {totalTimeSpent} min</h3>
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
                      value={subtask.editName}
                      onChange={(e) => {
                        if (editingTask) {
                          const updatedSubtasks = [...editingTask.subtasks];
                          updatedSubtasks[index].editName = e.target.value;
                          setEditingTask({ ...editingTask, subtasks: updatedSubtasks });
                        } else {
                          const updatedSubtasks = [...newTask.subtasks];
                          updatedSubtasks[index].editName = e.target.value;
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
                          updatedSubtasks[index] = {
                            ...updatedSubtasks[index],
                            isEditing: true,
                            editName: updatedSubtasks[index].name
                          };
                          setEditingTask(prev => ({ ...prev, subtasks: updatedSubtasks }));
                        } else {
                          const updatedSubtasks = [...newTask.subtasks];
                          updatedSubtasks[index] = {
                            ...updatedSubtasks[index],
                            isEditing: true,
                            editName: updatedSubtasks[index].name
                          };
                          setNewTask(prev => ({ ...prev, subtasks: updatedSubtasks }));
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
                            updatedSubtasks[index].name = updatedSubtasks[index].editName;
                            updatedSubtasks[index].isEditing = false;
                            delete updatedSubtasks[index].editName;
                            setEditingTask({ ...editingTask, subtasks: updatedSubtasks });
                          } else {
                            const updatedSubtasks = [...newTask.subtasks];
                            updatedSubtasks[index].name = updatedSubtasks[index].editName;
                            updatedSubtasks[index].isEditing = false;
                            delete updatedSubtasks[index].editName;
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
                          delete updatedSubtasks[index].editName;

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

function TaskTimeCell({ task, onLogClick }) {
  const total = (task.time_logs || []).reduce((sum, log) => sum + (log.minutes || 0), 0);
  return (
    <div className="TaskCell">
      <div><strong>{total} min</strong></div>
      <button
        className="SubtaskButton SubtaskConfirmButton"
        onClick={() => onLogClick(task.id)}
        style={{ marginTop: "4px" }}
      >
        Log Time
      </button>
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

function TeamsPage() {
  const navigate = useNavigate();
  const [ teamList, setTeamList ] = useState([]);
  const [ showFields, setShowFields ] = useState(false);
  const [ loggedIn, setLoggedIn ] = useState(false);
  const [ teamName, setTeamName ] = useState("");
  const {user} = useGlobal();
  const [ inviteList, setInviteList ] = useState([]);

  // Open and close text field
  const handleOpen = () => {
    setShowFields(true);
  }
  const handleClose = () => {
    setShowFields(false);
    setTeamName("");
  }

  // Create new team
  const handleCreate = () => {
    axios.post("http://127.0.0.1:5000/createteam", { teamName: teamName })
    .then((response) => {
      setTeamList([...teamList, response.data])
      return axios.get("http://127.0.0.1:5000/getteams");
    })
    .then((response) => {
      setTeamList(response.data);
    })
  }
  // Join members list
  const handleJoin = (teamID) => {
    axios.post("http://127.0.0.1:5000/jointeam", { teamID: teamID })
    .then(() => {
      return axios.get("http://127.0.0.1:5000/getteams");
    })
    .then((response) => {
      setTeamList(response.data);
    })
    handleDeny(teamID)
  }

  // Remove off recipients list
  const handleDeny = (teamID) => {
    axios.post("http://127.0.0.1:5000/denyinvite", { teamID: teamID})
    .then(() => {
      return axios.get("http://127.0.0.1:5000/getinvites");
    })
    .then((response) => {
      setInviteList(response.data);
    })
  }

  // Update team page when changing user
  useEffect(() => {
    if (user !== "Guest") {
       setLoggedIn(true);
    } else {
       setLoggedIn(false);
    }
  
    axios.get("http://127.0.0.1:5000/getteams")
    .then(response => {
      setTeamList(response.data);
    })
    .catch(error => console.error("Error fetching teams:", error));
    
    axios.get("http://127.0.0.1:5000/getinvites")
    .then(response => {
      setInviteList(response.data);
    })
    .catch(error => console.error("Error fetching invites:", error));

  }, [ user ]);


  return (
    <div>
      <div className="Headers">
        <h1>Teams</h1>
        { loggedIn && !showFields && <button className="Button" onClick={handleOpen}>Create Team</button> }
        { loggedIn && showFields && (
            <div className="Container">
              <input
                type="text"
                placeholder="Team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className='TextFields'
              />
              <div className="ButtonContainer">
                <button onClick={handleClose}>Cancel</button>
                <button onClick={handleCreate}>Create</button>
              </div>
            </div>
          )
        }
        { !loggedIn &&
          <h3 style={{textAlign: "center"}}>Log in to make or join teams!</h3>
        } 
      </div>
    
      <div className="TeamContainer">
      {teamList.map(team => (
        <button key={team.teamID} onClick={() => navigate(`/team/${team.teamID}`) } style={{
          padding: "12px 20px",
          margin: "8px",
        }}>{team.teamName}</button>
      ))}
      </div>
      <div className='BotRight'>
        <h3 className='centered'>Invites</h3>
        {inviteList.map(team => (
          <div key={team.teamID} className='user-row'>
            {team.teamName} - {team.owner}
            <div style={{ display: 'flex', gap: '2px'}}>
              <button className='Invite' onClick={() => handleJoin(team.teamID)}>Join</button>
              <button className='Invite' onClick={() => handleDeny(team.teamID)}>Deny</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const TeamPage = () => {
  const { teamID } = useParams();
  const navigate = useNavigate();
  const [ team, setTeam ] = useState(null);
  const { user } = useGlobal();
  const [ showConfirm, setShowConfirm ] = useState(false);
  const [ showSearch, setShowSearch ] = useState(false);
  const [query, setQuery] = useState("");
  const [ userList, setUserList ] = useState([]);

  useEffect(() => {
    axios.get(`http://127.0.0.1:5000/getteam?teamID=${teamID}`)
      .then(response => {
        setTeam(response.data);
      })
      .catch(error => console.error("Error fetching team:", error));
  }, [teamID]);


  useEffect(() => {
    if (user === "Guest") {
      navigate("/teams")
    }
  }, [user, navigate]);

  const handleOpenConfirm = () => {
    if (showConfirm) {
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  }

  const handleOpenSearch = () => {
    if (showSearch) {
      setShowSearch(false);
    } else {
      setShowSearch(true);
    }
  }

  // Remove off members list
  const handleLeave = () => {
    axios.post("http://127.0.0.1:5000/leaveteam", { teamID: team.teamID})
    .then(() => {
      navigate("/teams")
    })
  }

  const handleInvite = (username) => {
    // send owner and recipient to backend
    // store invites like members
    // useEffect updates invites for everyone
    axios.post("http://127.0.0.1:5000/sendinvite", {teamID: team.teamID, recipient: username})
    .then(() => {
      //Grey out invited user
      return axios.get(`http://127.0.0.1:5000/getteam?teamID=${teamID}`);
    })
    .then((response) => {
      setTeam(response.data); // Update state with new recipients list
    })
    .catch((error) => console.error("Error updating team after invite:", error));
  };

  const handleView = (username) => {
    const camefrom = teamID
    navigate(`/profile/${username}/from/${camefrom}`)
  }

  useEffect(() => {
    axios.post("http://127.0.0.1:5000/search", {query: query})
    .then((response) => {
      setUserList(response.data)
    })
  }, [query]);

  const handleDelete = () => {
    axios.post("http://127.0.0.1:5000/deleteteam", {teamID: teamID})
    .then((response) => {
      navigate("/teams")
    })
  }

  if (!team) return <h3 className='Headers'>Loading team...</h3>;

  return (
    <div>
      <div className="Headers">
        <h1>- {team.teamName} -</h1>
        <button onClick={() => navigate("/teams")}>Back</button>
      </div>
      <h3 className='Headers' style={{"marginBottom":20}}>Leader: {team.owner}</h3>
      <div className='MemberList'> 
        <h4>Members: </h4>
        <ul>
          {team.members.map((member, index) => (
            <li key={index}>{member}</li>
          ))}
        </ul>
      </div>
      <div className='SideBySide'>
        <div className='AddMember'>      
          {user === team.owner && <button onClick={handleOpenSearch} style={{marginBottom: 10}}>Add member</button>}
        </div>
        <div className='AddMember'>
          { user === team.owner && showSearch && (
            <input
              style={{marginRight: 10}}
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className='SearchBar'
            />
          )}
          { user === team.owner && showSearch && query !== "" && (
            <div className='Column'>
              {userList.map((username, index) => (
                <div key={index} className='user-row'>
                  {username}
                  <div style={{ display: 'flex', gap: '2px'}}>
                    {!team.recipients.includes(username) ? (
                      <button className='Invite' onClick={() => handleInvite(username)}>Invite</button>
                    ) : null}
                    <button className='Invite' onClick={() => handleView(username)}>View</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <h2 className='AddMember' style={{marginTop:10}}>Tasks</h2>

      { user !== team.owner && (
        <div className='AddMember'>      
          <button style={{"marginTop":20, backgroundColor: "red"}} onClick={handleLeave}>Leave Team</button>
        </div>
      )}
      { user === team.owner && (
        <div className='AddMember'>      
          <button style={{"marginTop":20, backgroundColor: "red"}} onClick={handleOpenConfirm}>Delete Team</button>
        </div>
      )}
      { user === team.owner && showConfirm && (
        <div>
          <p className='AddMember' style={{"marginTop":20}}>Are you sure? Team will be deleted for all members.</p>
          <div className='AddMember'>
            <button style={{"marginTop":10, backgroundColor:"red"}} onClick={handleDelete}>Confirm</button>
            <button style={{"marginLeft":10, marginTop:10}} onClick={handleOpenConfirm}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchPage() {
  const navigate = useNavigate();
  const { user } = useGlobal();
  const [query, setQuery] = useState("");
  const [ userList, setUserList ] = useState([]);

  const handleView = (username) => {
    const camefrom = "gensearch"
    navigate(`/profile/${username}/from/${camefrom}`)
  }

  useEffect(() => {
    axios.post("http://127.0.0.1:5000/search", {query: query})
    .then((response) => {
      setUserList(response.data)
    })
  }, [query]);

  return (
    <div className='centered'>
      <h2>Find users</h2>
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className='SearchBar'
      />
  
      <div className='Column'>
        {userList.map((username, index) => (
          <div key={index} className='user-row'>
            {username}
            <div style={{ display: 'flex' }}>
              <button className='Invite' onClick={() => handleView(username)}>View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ViewProfile = () => {
  const { usern, camefrom } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ username: usern, profile_picture: '', achievements: '' });

  useEffect(() => {
    axios.get(`http://127.0.0.1:5000/getprof?usern=${usern}`)
      .then(response => {
        setProfile({username: response.data.usern, profile_picture: response.data.pfp, achievements: response.data.achievements })
      })
      .catch(error => console.error("Error fetching team:", error));
  }, [usern]);

  // Convert camefrom to link, go back
  const handleBack = () => {
    if (camefrom === "gensearch") {
      navigate("/gensearch")
    } else {
      navigate(`/team/${camefrom}`)
    }
  };


  return (
      <div className="ProfileContainer">
          <h2 className="ProfileTitle">{profile.username}'s Profile</h2>
          <div className="ProfilePictureContainer">
              <img
                  className="ProfilePicture"
                  src={profile.profile_picture ? `/profile_pics/${profile.profile_picture}` : '/default-profile.png'}
                  alt="Profile"
              />
          </div>
          
          <div className="Achievements">
              <h3>Achievements</h3>
              <p>{profile.achievements || 'No achievements yet.'}</p>
          </div>
          <button onClick={handleBack}>Back</button>
      </div>
  );
};

function taskTemplates() {
  
}

function TemplatesPage() {

  const [templates, setTemplate] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
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
  });
  const [editingTemplate, setEditingTemplate] = useState(null);

  const COLORS = [
    { name: "red", value: "#fbb9c5" },
    { name: "orange", value: "#fdd0b1" },
    { name: "yellow", value: "#f9efc7" },
    { name: "green", value: "#c3edbf" },
    { name: "blue", value: "#b8dfe6" },
    { name: "purple", value: "#c5bbde"}
  ];

  const openModal = () => {setShowModal(true)}
  const closeModal = () => {
    setShowModal(false)
  }
  const resetModal = () => {
    setNewTemplate({
      username: "",
      name: "",
      description: "",
      due_time: "",
      priority: "Medium",
      color_tag: "",
      status: "To-Do",
      start_date: "",
      time_log: "", // This will store the time log for the task
      subtasks: [],
    });
  }

  //formerly handleSubmit
  const createTaskTemplate = () => {

    const newTemplate = {
      id: Date.now(),
      name: newTemplate.name,
      description: newTemplate.description,
      due_time: newTemplate.dueTime,
      priority: newTemplate.priority,
      color_tag: newTemplate.colorTag,
      status: newTemplate.status,
      start_date: newTemplate.startDate,
      time_log: newTemplate.timeLog,
      subtasks: newTemplate.subtasks,
    };

    setTemplate([...templates, newTemplate]);

    /*
    //setError("");
    //setWarning("");

    if (!newTemplate.name || !newTemplate.due_time) {
      //setError("Template name or due date required")
      return;
    }
    axios.post("http://127.0.0.1:5000/tasks", {
      //username: user,
      name: newTemplate.name,
      description: newTemplate.description,
      due_time: newTemplate.due_time,
      priority: newTemplate.priority,
      color_tag: newTemplate.color_tag,
      status: newTemplate.status,
      start_date: newTemplate.start_date,
      time_log: newTemplate.time_log, 
      //subtasks: newTemplate.subtasks
    })
      .then(response => {
        const addedTemplate = response.data.task;
  
        setNewTemplate({
          //username: user,
          name: "",
          description: "",
          due_time: "",
          priority: "Medium",
          color_tag: "",
          status: "To-Do",
          start_date: "",
          time_log: "", // Reset time log
          subtasks: []
        });
  
        setShowModal(false);
        resetModal();
      })
      .catch(error => {
        if (error.response) {
          //setError(error.response.data.error);
        } else {
          console.error("Error creating template:", error);
        }
      });
      */
  };

  //const createTaskTemplate = () => {
    
  //}

  return (
    <div>
      <div className="Headers">
        <h1 className="App">Templates</h1>
      </div>

      <h2>All Templates</h2>
      <div className="TaskTable">
        <div className="TaskRow TaskHeader">
          <label></label>
          <label>Color</label>
          <div className="TaskCell">Task</div>
          <div className="TaskCell">Subtasks</div>
          <div className="TaskCell">Priority</div>
          <div className="TaskCell">Status</div>
          <div className="TaskCell">Time Spent</div>
          <div className="TaskCell">Deadline</div>
          <div className="TaskCell">Dependencies</div>
          <div className="TaskCell">Make Changes</div>
        </div>

        <div>
          <ul>
            {templates.map((template) => (
              <li key={template.id}>
                <strong>{template.name}</strong> - {template.priority} ({template.status})
                <p>{template.description}</p>
                <p>Due Date: {template.due_time}</p>
                <p>Start Date: {template.start_date}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>

      </div>

      <div className="create-template">
        <button className="MakeTaskButton" onClick={openModal}>Create New Template</button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create Template</h2>
            <input 
              type="text" name="name" placeholder="Template Name" 
              //value={editingTemplate ? editingTemplate.name : newTemplate.name}
              onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})} 
              className="TextFields" required 
            />
            <input 
              type="text" name="description" placeholder="Description (Optional)"
              //value={editingTemplate ? editingTemplate.description : newTemplate.description}
              onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})} 
              className="TextFields" 
            />
            <input 
              type="date" name="due_time" 
              //value={editingTemplate ? editingTemplate.due_time : newTemplate.due_time}
              onChange={(e) => setNewTemplate({...newTemplate, due_time: e.target.value})} 
              className="TextFields" required 
            />
            {/* Added start_date input */}
            <input 
            type="date" name="start_date"
              //value={editingTemplate ? editingTemplate.start_date : newTemplate.start_date}
              onChange={(e) => setNewTemplate({...newTemplate, start_date: e.target.value})}
              className="TextFields"
            />
            <select
              name="priority"
              onChange={(e) => setNewTemplate({...newTemplate, priority: e.target.value})}
              className="TextFields"
              //value={editingTemplate ? editingTemplate.priority : newTemplate.priority}
            >
              <option value="Low">Low</option>
              <option value="Medium" selected>Medium</option>
              <option value="High">High</option>
            </select>

            <select 
              name="color_tag"
              onChange={(e) => setNewTemplate({...newTemplate, color_tag: e.target.value})}
              className="TextFields"
              //value={editingTemplate ? editingTemplate.color_tag : newTemplate.color_tag}
            >
              <option value="">No color</option>
              {COLORS.map((color) => (
                <option key={color.value} value={color.value} style={{ backgroundColor: color.value }}>
                  {color.name}
                </option>
              ))}
            </select>
              
            <select 
              name="status"
              onChange={(e) => setNewTemplate({...newTemplate, status: e.target.value})}
              className="TextFields"
              //value={editingTemplate ? editingTemplate.status : newTemplate.status}
            >
              <option value="To-Do">To-Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            <div className="ButtonContainer">
              <button onClick={createTaskTemplate}>Save</button>
              <button onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NavigationButtons() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', height: '3vh', padding: '10px' }}>
      <button className="Buttons" onClick={() => navigate('/')}>Planorama</button>
      <button className="Buttons" style={{marginLeft: 5}} onClick={() => navigate('/dependencies')}>Dependencies</button>
      <button className="Buttons" style={{marginLeft: 5}} onClick={() => navigate('/teams')}>Teams</button>
      {/* Commented out these buttons because they were moved to a different menu (top right)
      You can uncomment them for testing if you want*/}
      {/* <button className="Buttons" onClick={() => navigate('/login')}>Log In</button>
      <button className="Buttons" onClick={() => navigate('/createaccount')}>Create Account</button>
      <button className="ProfileIcon" onClick={() => navigate('/profile')}>
        <img src="/default-profile.png" alt="Profile" className="ProfileIconImage" />
      </button> */}
      <button className='Buttons' style={{marginLeft: 5}} onClick={() => navigate('/gensearch')}>Search</button>
      <button className='Buttons' style={{marginLeft: 5}} onClick={() => navigate('/templates')}>Templates</button>
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
            <Route path="/profile/:usern/from/:camefrom" element={<ViewProfile />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/team/:teamID" element={<TeamPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/gensearch" element={<SearchPage />} />
            <Route path="/dependencies" element={<TaskDependenciesPage />} />
          </Routes>
        </GlobalProvider>
    </Router>
  );
}

export default App;
