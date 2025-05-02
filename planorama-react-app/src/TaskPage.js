import { useNavigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import { GlobalProvider, useGlobal } from "./GlobalContext";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axios from "axios";
import React from "react";
import { colors } from "@mui/material";

export default function TaskPage() {
  const { user } = useGlobal();
  const [loggedIn, setLoggedIn] = useState(false);
  //const {tasks, setTasks} = useTasks();
  //const {archivedTasks, setArchivedTasks} = useTasks();
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(true);
  const [highlightedTask, setHighlightedTask] = useState(null);
  const [archivedTasks, setArchivedTasks] = useState([]); //for the archived tasks
  const [showArchived, setShowArchived] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [autoArchiveEnabled, setAutoArchiveEnabled] = useState(false);
  const [archivePeriod, setArchivePeriod] = useState("weekly");
  const [archiveTime, setArchiveTime] = useState("12:00");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [taskTemplates, setTaskTemplates] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [suggestedSubtasks, setSuggestedSubtasks] = useState([]);
  const [rejectedSuggestions, setRejectedSuggestions] = useState([]);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState([]);
  const [acceptedSuggestionsSnapshot, setAcceptedSuggestionsSnapshot] =
    useState([]);
  const [rejectedSuggestionsSnapshot, setRejectedSuggestionsSnapshot] =
    useState([]);
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
    completion_date: "",
    rollover_count: 0,
    estimated_time: "",
  });
  const [editingTask, setEditingTask] = useState(null);
  //for filtering by priority
  const [filterPriority, setFilteredPriority] = useState("None");
  const [filterStatus, setFilteredStatus] = useState("None");
  const [filterColor, setFilterColor] = useState("None");
  const [showFilters, setShowFilters] = useState(false);
  // Popup filter menu
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  //for deletions that haven't been decided yet
  const [pendingDelete, setPendingDelete] = useState([null]);
  const [error, setError] = useState("");
  const [dependencyError, setDependencyError] = useState("");
  const [warning, setWarning] = useState("");
  const [taskWarning, setTaskWarning] = useState("");
  const [logModalTask, setLogModalTask] = useState(null);
  const [timeLogInput, setTimeLogInput] = useState("");
  const [timeLogError, setTimeLogError] = useState("");
  const [selectedTaskLogs, setSelectedTaskLogs] = useState([]);
  const [totalAcrossAllTasks, setTotalAcrossAllTasks] = useState(0);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [draggingOverIndex, setDraggingOverIndex] = useState(null);
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [timeModalTask, setTimeModalTask] = useState(null);
  const [filterTimePerformance, setFilterTimePerformance] = useState("None");
  const [autoRollOverEnabled, setAutoRollOverEnabled] = useState(false);
  const [autoRollOverTime, setAutoRollOverTime] = useState("00:00");

  const COLORS = [
    { name: "red", value: "#fbb9c5" },
    { name: "orange", value: "#fdd0b1" },
    { name: "yellow", value: "#f9efc7" },
    { name: "green", value: "#c3edbf" },
    { name: "blue", value: "#b8dfe6" },
    { name: "purple", value: "#c5bbde" },
  ];
  useEffect(() => {
    axios
      .get("http://127.0.0.1:5000/time_summary")
      .then((res) => setTotalAcrossAllTasks(res.data.total_time_spent))
      .catch((err) => console.error(err));
  }, [tasks]);

  const [isCheck, setIsCheck] = useState(false);
  const [completedTasks, setCompletedTasks] = useState({});

  useEffect(() => {
    if (user !== "Guest") {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
      setShowModal(false);
    }

    axios
      .get("http://127.0.0.1:5000/tasks")
      .then((response) => {
        const today = new Date().toISOString().split("T")[0];

        const activeTasks = response.data.filter(
          (task) => !task.start_date || task.start_date <= today
        );
        const futureTasks = response.data.filter(
          (task) => task.start_date && task.start_date > today
        );

        setTasks(activeTasks);
        setScheduledTasks(futureTasks);
      })
      .catch((error) => console.error("Error fetching tasks:", error));

    axios
      .get(`http://127.0.0.1:5000/notifications?username=${user}`)
      .then((res) => {
        console.log("Fetched notifications:", res.data.notifications);
        setNotifications(res.data.notifications || []);
      })
      .catch((err) => console.error("Error fetching notifications:", err));
  }, [user]);

  useEffect(() => {
    const handleClickOutside = () => setHighlightedTask(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      autoRollOverTasks();
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRollOverEnabled, autoRollOverTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      axios
        .get(`http://127.0.0.1:5000/get_auto_rollover`)
        .then((response) => {
          setAutoRollOverEnabled(response.data.auto_rollover_enabled);
          setAutoRollOverTime(response.data.auto_rollover_time);
        })
        .catch((err) => console.error("Error with rollover stuff:", err));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const refreshNotifications = () => {
    if (!notificationsEnabled || user === "Guest") return;
    axios
      .get(`http://127.0.0.1:5000/notifications?username=${user}`)
      .then((res) => {
        const newNotifs = res.data.notifications || [];
        setNotifications([...newNotifs]); // Replace, not merge
        setDismissedIndices(new Set()); // Reset dismissed
      })
      .catch((err) => console.error("Error refreshing notifications:", err));
  };

  const handleRollOverEnabledChange = (e) => {
    const isEnabled = e.target.checked;
    setAutoRollOverEnabled(isEnabled);

    axios
      .put(`http://127.0.0.1:5000/update_auto_rollover`, {
        auto_rollover_enabled: isEnabled,
        auto_rollover_time: autoRollOverTime,
      })
      .catch((err) => console.error("Error updating roll over enabled", err));
  };

  const handleRollOverTimeChange = (e) => {
    const newTime = e.target.value;
    setAutoRollOverTime(newTime);

    axios
      .put(`http://127.0.0.1:5000/update_auto_rollover`, {
        auto_rollover_enabled: autoRollOverEnabled,
        auto_rollover_time: newTime,
      })
      .catch((err) => console.error("Error updating roll over time", err));
  };

  const handleAddSubtask = () => {
    if (!newSubtaskName.trim()) return;

    const newSubtask = {
      id: (editingTask?.subtasks || newTask?.subtasks || []).length + 1,
      name: newSubtaskName.trim(),
      completed: false,
    };

    if (editingTask) {
      setEditingTask((prev) => ({
        ...prev,
        subtasks: [...(prev.subtasks || []), newSubtask],
      }));
    } else {
      setNewTask((prev) => ({
        ...prev,
        subtasks: [...(prev.subtasks || []), newSubtask],
      }));
    }

    setNewSubtaskName(""); // Reset input field
  };

  const handleToggleSubtask = (taskId, subtaskId, completed) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((sub) =>
                sub.id === subtaskId ? { ...sub, completed } : sub
              ),
              status: task.subtasks.every((sub) =>
                sub.id === subtaskId ? completed : sub.completed
              )
                ? "Completed"
                : "In Progress",
            }
          : task
      )
    );

    axios
      .put(`http://127.0.0.1:5000/tasks/${taskId}/subtasks/${subtaskId}`, {
        completed,
      })
      .catch((error) => console.error("Error updating subtask:", error));
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
    const taskToEdit =
      tasks.find((task) => task.id === taskId) ||
      scheduledTasks.find((task) => task.id === taskId);
    if (!taskToEdit) return;
    setEditingTask({
      ...taskToEdit,
      subtasks: taskToEdit.subtasks ? taskToEdit.subtasks : [], // Ensure subtasks exist
    });

    setAcceptedSuggestionsSnapshot(acceptedSuggestions);
    setRejectedSuggestionsSnapshot(rejectedSuggestions);

    setShowModal(true);

    axios
      .post(`http://127.0.0.1:5000/suggest_subtasks/${taskToEdit.id}`, {
        name: taskToEdit.name,
        description: taskToEdit.description,
      })
      .then((res) => {
        const rawSuggestions = res.data.subtasks || [];

        const filteredSuggestions = rawSuggestions.filter(
          (s) =>
            !rejectedSuggestions.includes(s) && !acceptedSuggestions.includes(s)
        );

        setSuggestedSubtasks(filteredSuggestions);
      })
      .catch((err) => {
        console.error("Failed to fetch suggestions:", err);
        setSuggestedSubtasks([]); // fallback so .length doesn't error
      });
  };

  //officially deletes tasks
  const handleDeleteConfirm = (taskId) => {
    axios
      .delete(`http://127.0.0.1:5000/tasks/${taskId}`)
      .then(() => {
        setTasks(tasks.filter((task) => task.id !== taskId)); // Remove task from UI
        setScheduledTasks((prev) => prev.filter((task) => task.id !== taskId)); // Remove task from scheduled tasks
        setPendingDelete(null); // restore Edit and Delete buttons
        setWarning("");
        setError("");
        refreshNotifications();
      })
      .catch((error) => {
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
          <button
            className="ConfirmButton"
            onClick={() => handleDeleteConfirm(taskId)}
          >
            Confirm
          </button>
          <button
            className="UndoButton"
            onClick={() => handleDeleteUndo(taskId)}
          >
            Undo
          </button>
        </div>
      );
    } else {
      return (
        <div>
          <button
            className="EditButton"
            onClick={() => handleEditClick(taskId)}
          >
            Edit
          </button>
          <button
            className="DeleteButton"
            onClick={() => handleDeleteClick(taskId)}
          >
            Delete
          </button>
        </div>
      );
    }
  };

  const closeArchiveModal = () => {
    setShowArchiveModal(false);
  };

  const archiveTask = (taskId) => {
    const taskToArchive = tasks.find((task) => task.id === taskId);

    if (taskToArchive) {
      const updatedTasks = tasks.filter((task) => task.id !== taskId);

      setArchivedTasks((prevArchivedTasks) => [
        ...prevArchivedTasks,
        taskToArchive,
      ]);

      setTasks(updatedTasks);
    }
  };

  const unarchiveTask = (taskId) => {
    const taskToUnarchive = archivedTasks.find((task) => task.id === taskId);

    if (taskToUnarchive) {
      const updatedTasks = archivedTasks.filter((task) => task.id !== taskId);

      setTasks((prevTasks) => [...prevTasks, taskToUnarchive]);

      setArchivedTasks(updatedTasks);
    }
  };

  const createTaskFromTemplate = () => {};

  const editTemplate = () => {};

  const deleteTemplate = () => {};

  //for rolling over

  const [originalRollColors, setOriginalRollColors] = useState(new Map());

  const isOverdue = (deadline) => {
    const [year, month, day] = deadline.split("-").map(Number);
    //subtract 1 because months start at 0
    const due = new Date(year, month - 1, day);
    const now = new Date();

    now.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return now > due;
  };

  const handleRollOver = (taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          const today = new Date();
          const tomorrow = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1
          );

          console.log("today:", today.toISOString().split("T")[0]);
          console.log("tomorrow", tomorrow.toISOString().split("T")[0]);

          const updatedTask = {
            ...task,
            due_time: tomorrow.toISOString().split("T")[0],
            rollover_count: task.rollover_count + 1,
          };

          axios
            .put(`http://127.0.0.1:5000/tasks/${updatedTask.id}`, {
              username: user,
              name: updatedTask.name,
              due_time: updatedTask.due_time,
              rollover_count: updatedTask.rollover_count,
            })
            .then((response) => {
              //updatedTask = response.data.task;
            })
            .catch((error) => {
              if (error.response) {
                setError(error.response.data.error);
              } else {
                console.error("Error updating roll over task:", error);
              }
            });
          return updatedTask;
        }
        return task;
      })
    );
  };

  const autoRollOverTasks = (taskId) => {
    const today = new Date();
    const time = today.toTimeString().slice(0, 5);

    if (!autoRollOverEnabled || time < autoRollOverTime) {
      return;
    }

    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (isOverdue(task.due_time)) {
          const tomorrow = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1
          );

          console.log("today:", today.toISOString().split("T")[0]);
          console.log("tomorrow", tomorrow.toISOString().split("T")[0]);

          const updatedTask = {
            ...task,
            due_time: tomorrow.toISOString().split("T")[0],
            rollover_count: task.rollover_count + 1,
          };

          axios
            .put(`http://127.0.0.1:5000/tasks/${updatedTask.id}`, {
              username: user,
              name: updatedTask.name,
              due_time: updatedTask.due_time,
              rollover_count: updatedTask.rollover_count,
            })
            .then((response) => {
              //updatedTask = response.data.task;
            })
            .catch((error) => {
              if (error.response) {
                setError(error.response.data.error);
              } else {
                console.error("Error updating roll over task:", error);
              }
            });

          return updatedTask;
        }
        return task;
      })
    );
  };

  //for the colors before they were marked completed
  const [originalColors, setOriginalColors] = useState(new Map());

  //jack
  //mark as complete check mark
  const markComplete = (taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          if (!task.completed) {
            setOriginalColors((prev) => prev.set(task.id, task.color_tag));
            return {
              ...task,
              completed: true,
              color_tag: "#90EE90",
            };
          } else {
            const originalColor = originalColors.get(task.id);
            return {
              ...task,
              completed: false,
              color_tag: originalColor,
            };
          }
        }
        return task;
      })
    );
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
          setTaskWarning(
            "This completion will not count toward your streak since it is after the due date."
          );
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
          setTaskWarning(
            "This completion will not count toward your streak since it is after the due date."
          );
        } else {
          setTaskWarning("");
        }
      }

      setNewTask(updatedTask);
    }
    if (name === "estimated_time") {
      if (value === "") {
        setError("Estimated time is required.");
        return;
      }
      const num = parseInt(value);
      if (isNaN(num)) {
        setError("Estimated time must be a number.");
        return;
      }
      if (num < 0) {
        setError("Estimated time cannot be negative.");
        return;
      }
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
    axios
      .post("http://127.0.0.1:5000/tasks", {
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
        completion_date:
          newTask.status === "Completed" ? newTask.completion_date : null,
        rollover_count: newTask.rollover_count,
        estimated_time: newTask.estimated_time,
      })
      .then((response) => {
        const addedTask = response.data.task;

        // If task has a future start date, add to scheduledTasks instead
        const today = new Date().toISOString().split("T")[0]; // Get today's date in "YYYY-MM-DD" format
        if (addedTask.start_date && addedTask.start_date > today) {
          setScheduledTasks((prev) => [...prev, addedTask]);
        } else {
          setTasks((prev) => [...prev, addedTask]); // Otherwise, add to active tasks
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
          completion_date: "",
          rollover_count: 0,
          estimated_time: "",
        });

        setShowModal(false);
        refreshNotifications();
      })
      .catch((error) => {
        if (error.response) {
          setError(error.response.data.error);
        } else {
          console.error("Error creating task:", error);
        }
      });
  };

  // Handle manual start of scheduled tasks
  const handleStartNow = (taskId) => {
    axios
      .put(`http://127.0.0.1:5000/tasks/${taskId}/start_now`)
      .then(() => {
        setScheduledTasks((prev) => prev.filter((task) => task.id !== taskId));
        axios
          .get("http://127.0.0.1:5000/tasks") // Refresh tasks list
          .then((response) => {
            const today = new Date().toISOString().split("T")[0];
            const activeTasks = response.data.filter(
              (task) => !task.start_date || task.start_date <= today
            );
            setTasks(activeTasks);
          });
      })
      .catch((error) => {
        console.error("Error starting task early:", error);
      });
  };
  const handleFinishNow = (taskId) => {
    const taskToFinish = scheduledTasks.find((task) => task.id === taskId);
    if (!taskToFinish) return;

    const today = new Date().toISOString().split("T")[0];

    axios
      .put(`http://127.0.0.1:5000/tasks/${taskId}`, {
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
        completion_date: today,
        rollover_count: taskToFinish.rollover_count,
      })
      .then((res) => {
        setScheduledTasks((prev) => prev.filter((t) => t.id !== taskId));
        setTasks((prev) => [...prev, res.data.task]);
      })
      .catch((err) => console.error("Finish failed:", err));
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

    axios
      .put(`http://127.0.0.1:5000/tasks/${editingTask.id}`, {
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
        completion_date:
          editingTask.status === "Completed"
            ? editingTask.completion_date
            : null,
        rollover_count: editingTask.rollover_count,
        estimated_time: editingTask
          ? editingTask.estimated_time
          : newTask.estimated_time,
      })
      .then((response) => {
        const updatedTask = response.data.task;
        const today = new Date().toISOString().split("T")[0];

        if (updatedTask.start_date && updatedTask.start_date > today) {
          // Update in scheduledTasks
          setScheduledTasks((prev) =>
            prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
          );
          setTasks((prev) => prev.filter((t) => t.id !== updatedTask.id)); // Remove from active if present
        } else {
          // Update in active tasks
          setTasks((prev) =>
            prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
          );
          setScheduledTasks((prev) =>
            prev.filter((t) => t.id !== updatedTask.id)
          ); // Remove from scheduled if present
        }

        setEditingTask(null);
        setShowModal(false);
        refreshNotifications();
      })
      .catch((error) => {
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
  let filteredTasks = tasks;

  //checks if priority is filtered
  if (filterPriority !== "None") {
    filteredTasks = filteredTasks.filter(
      (task) => task.priority === filterPriority
    );
  }

  //checks if status is filtered
  if (filterStatus !== "None") {
    filteredTasks = filteredTasks.filter(
      (task) => task.status === filterStatus
    );
  }

  // checks if color tag is filtered
  if (filterColor !== "None") {
    filteredTasks = filteredTasks.filter(
      (task) => task.color_tag === filterColor
    );
  }
  if (filterTimePerformance !== "None") {
    filteredTasks = filteredTasks.filter((task) => {
      const estimated = parseInt(task.estimated_time);
      const actual = (task.time_logs || []).reduce(
        (sum, log) => sum + (log.minutes || 0),
        0
      );
      if (isNaN(estimated)) return false;
      if (filterTimePerformance === "Under Time") return actual < estimated;
      if (filterTimePerformance === "Over Time") return actual > estimated;
      if (filterTimePerformance === "On Time") return actual === estimated;
      return true;
    });
  }
  const navigate = useNavigate();

  const handleMarkComplete = () => {};
  const [dismissedIndices, setDismissedIndices] = useState(() => new Set());
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const stored = localStorage.getItem("notificationsEnabled");
    return stored === null ? true : stored === "true";
  });

  const dismissNotification = (indexToRemove) => {
    setDismissedIndices((prev) => new Set(prev).add(indexToRemove));
  };

  const dismissAllNotifications = () => {
    setDismissedIndices(new Set(notifications.map((_, i) => i)));
    setShowNotifications(false);
  };

  const visibleNotifications = notifications.filter(
    (_, i) => !dismissedIndices.has(i)
  );

  useEffect(() => {
    sessionStorage.setItem("notificationsEnabled", notificationsEnabled);
  }, [notificationsEnabled]);

  const NotificationPanel = () => (
    <div
      className="NotificationPanel"
      style={{
        position: "absolute",
        bottom: "3rem",
        right: "2rem",
        zIndex: 3000,
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "10px",
        width: "260px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        fontSize: "13px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <span style={{ fontWeight: "bold" }}>Notifications</span>
        <button
          onClick={dismissAllNotifications}
          style={{
            fontSize: "11px",
            padding: "2px 6px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Dismiss All
        </button>
      </div>
      {visibleNotifications.length === 0 ? (
        <div style={{ color: "#666", fontStyle: "italic" }}>
          No new notifications
        </div>
      ) : (
        <ul style={{ padding: 0, margin: 0, listStyleType: "none" }}>
          {visibleNotifications.map((notif, index) => {
            const taskId = notif.id;
            const message = notif.message;
            const [taskNameRaw, status] = message.split(" is ");
            const taskName = taskNameRaw.replace(/^"|"$/g, "");
            const actualIndex = notifications.findIndex(
              (n, i) =>
                !dismissedIndices.has(i) &&
                n.id === notif.id &&
                n.message === notif.message
            );
            return (
              <li
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#f0f0f0",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    padding: "6px 8px",
                    fontSize: "12px",
                    flexGrow: 1,
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setHighlightedTask(taskId);
                  }}
                >
                  <div>
                    <strong>{taskName}</strong>{" "}
                    <span style={{ fontSize: "12px" }}>is {status}</span>
                  </div>
                </div>
                <button
                  onClick={() => dismissNotification(actualIndex)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#888",
                    cursor: "pointer",
                    fontSize: "12px",
                    marginLeft: "6px",
                  }}
                  title="Dismiss"
                >
                  ✖
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  return (
    <div>
      {notificationsEnabled && (
        <>
          <div
            style={{
              position: "absolute",
              bottom: "1rem",
              right: "2rem",
              zIndex: 2000,
            }}
          >
            <button
              onClick={() => setShowNotifications((prev) => !prev)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "24px",
              }}
              title="Toggle Notifications"
            >
              🔔
            </button>
          </div>

          {showNotifications && <NotificationPanel />}
        </>
      )}

      <h1 className="App">Active Tasks</h1>
      {/* Active Tasks Section */}

      {/* Filter menu popup button and dropdown */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "89.2%",
          margin: "auto",
          alignItems: "flex-end",
        }}
      >
        <button
          className="Buttons"
          style={{ marginBottom: "5px", width: "55px" }}
          onClick={() => setShowFilterMenu(!showFilterMenu)}
        >
          Filter
        </button>
      </div>

      {showFilterMenu && (
        <div
          className="FilterMenuPopup"
          style={{
            position: "fixed",
            top: "180px",
            right: "20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            padding: "10px",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {[
            ["Color", filterColor, setFilterColor, COLORS.map((c) => [c.name, c.value])],
            ["Priority", filterPriority, setFilteredPriority, [["Low"], ["Medium"], ["High"]]],
            ["Status", filterStatus, setFilteredStatus, [["To-Do"], ["In Progress"], ["Completed"]]],
            ["Time Spent", filterTimePerformance, setFilterTimePerformance, [["Under Time"], ["On Time"], ["Over Time"]]],
          ].map(([labelText, value, setter, options]) => (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
                alignItems: "center",
              }}
              key={labelText}
            >
              <label>{labelText}:</label>
              <select value={value} onChange={(e) => setter(e.target.value)}>
                <option value="None">None</option>
                {options.map(([name, val]) => (
                  <option key={val || name} value={val || name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="TaskTable">
        <div className="TaskRow TaskHeader">
          {/* <label>✔</label> */}
          <div style={{color: "var(--themed-text-color)"}}>✔</div>
          <div className="HeaderCell">Task</div>
          <div className="HeaderCell">Subtasks</div>
          <div className="HeaderCell">Priority</div>
          <div className="HeaderCell">Status</div>
          <div className="HeaderCell">Due</div>
          {/* <div className="HeaderCell">Time</div> */}
          <div className="HeaderCell">Time Spent</div>
          <div className="HeaderCell">Dependencies</div>
          <div className="HeaderCell">Update</div>
          {/* <div className="HeaderCell">Notes</div> */}
          <div className="HeaderCell">
            RollOver{" "}
            {/* {
              <label>
                Auto
                <input
                  type="checkbox"
                  checked={autoRollOverEnabled}
                  onChange={
                    handleRollOverEnabledChange
                  }
                />
                {autoRollOverEnabled && (
                  <label>
                    <input
                      type="time"
                      value={autoRollOverTime}
                      onChange={
                        handleRollOverTimeChange
                      } 
                    />
                    Time:
                  </label>
                )}
              </label>
            } */}
          </div>
        </div>

        {taskWarning && (
          <div className="modal-overlay" onMouseDown={() => setTaskWarning("")}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
              <h3>⚠️ Heads up!</h3>
              <p>{taskWarning}</p>
              <button className="Buttons" onClick={() => setTaskWarning("")}>
                Got it
              </button>
            </div>
          </div>
        )}

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
              axios
                .post(
                  "http://127.0.0.1:5000/tasks/reorder",
                  reordered.map((task) => task.id)
                )
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
                        <Draggable
                          draggableId={String(task.id)}
                          index={index}
                          key={task.id}
                        >
                          {(provided, snapshot) => (
                            <div
                              className="TaskRow"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                backgroundColor: snapshot.isDragging
                                  ? "#e0e0e0"
                                  : isOverdue(task.due_time)
                                  ? "#c46b60"
                                  : task.color_tag || "#faf7f0",
                                ...provided.draggableProps.style,
                                boxShadow: snapshot.isDragging
                                  ? "0 0 10px rgba(0,0,0,0.3)"
                                  : "none",
                                border:
                                  highlightedTask === task.id
                                    ? "3px solid black"
                                    : "none",
                              }}
                            >
                              <div className="TaskCell">
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() => {
                                    markComplete(task.id);
                                    if (!task.completed) {
                                      setTimeout(() => archiveTask(task.id), 100); // slight delay to ensure UI update
                                    }
                                  }}
                                />
                                {task.complete ? (
                                  <button
                                    onClick={() => alert("Task Completed!")}
                                  >
                                    Completed
                                  </button>
                                ) : null}
                              </div>
                              <div className="TaskCell">{task.name}</div>
                              <div
                                className="TaskCell"
                                style={{ textAlign: "left" }}
                              >
                                {task.subtasks && task.subtasks.length > 0 ? (
                                  <div>
                                    {task.subtasks.map((subtask) => (
                                      <div key={subtask.id}>
                                        <input
                                          type="checkbox"
                                          checked={subtask.completed}
                                          onChange={() =>
                                            handleToggleSubtask(
                                              task.id,
                                              subtask.id,
                                              !subtask.completed
                                            )
                                          }
                                        />
                                        <span
                                          className={
                                            subtask.completed
                                              ? "SubtaskCompleted"
                                              : ""
                                          }
                                        >
                                          {subtask.name}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                              <div className="TaskCell">{task.priority}</div>

                              <div className="TaskCell">
                                {task.status}
                                {task.status === "Completed" &&
                                  task.completion_date && (
                                    <span
                                      style={{
                                        fontSize: "12px",
                                        display: "block",
                                      }}
                                    >
                                      ({formatDate(task.completion_date)})
                                    </span>
                                  )}
                              </div>
                              <div className="TaskCell">
                                {formatDate(task.due_time)}
                              </div>
{/* 
                              <button
                                className="SubtaskButton"
                                onClick={() => setTimeModalTask(task)}
                              >
                                {(() => {
                                  const actual = (task.time_logs || []).reduce(
                                    (sum, log) => sum + (log.minutes || 0),
                                    0
                                  );
                                  const estimated = parseInt(
                                    task.estimated_time
                                  );
                                  if (isNaN(estimated)) return "No Estimate";

                                  const diff = actual - estimated;
                                  if (diff === 0) return "On Time";
                                  if (diff < 0) return `Under Time`;
                                  return `Over Time`;
                                })()}
                              </button> */}

                              <TaskTimeCell
                                task={task}
                                onLogClick={() => {
                                  axios
                                    .get(
                                      `http://127.0.0.1:5000/tasks/${task.id}`
                                    )
                                    .then((res) => {
                                      setLogModalTask(task);
                                      setSelectedTaskLogs(
                                        res.data.time_logs || []
                                      );
                                      setTimeLogInput("");
                                      setTimeLogError("");
                                    })
                                    .catch((err) => console.error(err));
                                }}
                              />

                              <div className="TaskCell">
                                {(task.dependencies || []).map((depId, idx) => {
                                  const dep = tasks.find((t) => t.id === depId);
                                  if (!dep) return null;
                                  return (
                                    <div key={idx}>
                                      <span
                                        className={
                                          dep.status === "Completed"
                                            ? "SubtaskCompleted"
                                            : ""
                                        }
                                      >
                                        {dep.name} - {formatDate(dep.due_time)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="TaskCell">
                                {deleteButtons(task.id)}
                              </div>
                              {/* <div className="TaskCell">{<Notes />}</div> */}
                              <div className="TaskCell">
                                {
                                  <div>
                                    <span># - {task.rollover_count}</span>
                                    <div position="relative" >
                                    {isOverdue(task.due_time) && (
                                      <button
                                        onClick={() => handleRollOver(task.id)}
                                        style={{ padding: "5px", margin: "0 5px" }}
                                      >
                                        ✔
                                      </button>
                                    )}
                                    </div>
                                  </div>
                                }
                              </div>
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
            <h3 style={{ fontSize: "16px", fontWeight: "bold" }}>
              Scheduled Tasks
            </h3>
            <div className="ScheduledTaskContainer">
              {scheduledTasks.map((task) => (
                <div
                  key={task.id}
                  className="ScheduledTask"
                  style={{
                    backgroundColor: task.color_tag || "#faf7f0",
                    fontSize: "14px",
                    padding: "5px",
                    borderRadius: "5px",
                    marginBottom: "5px",
                  }}
                >
                  <div>{task.name}</div>
                  <div style={{ fontSize: "12px", color: "#555" }}>
                    Starts on: {formatDate(task.start_date)}
                  </div>
                  <div
                    style={{ display: "flex", gap: "8px", marginTop: "8px" }}
                  >
                    <button
                      className="EditButton"
                      onClick={() => handleEditClick(task.id)}
                    >
                      Edit
                    </button>
                    <button
                      className="DeleteButton"
                      onClick={() => handleDeleteClick(task.id)}
                    >
                      Delete
                    </button>
                    <button
                      className="ConfirmButton"
                      onClick={() => handleStartNow(task.id)}
                    >
                      Start Now
                    </button>
                    <button
                      className="ConfirmButton"
                      onClick={() => handleFinishNow(task.id)}
                    >
                      Finish
                    </button>
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

      {loggedIn && (
        <button
          className="MakeTaskButton"
          onClick={() => {
            setSuggestedSubtasks([]);
            setAcceptedSuggestions([]);
            setRejectedSuggestions([]);
            setAcceptedSuggestionsSnapshot([]);
            setRejectedSuggestionsSnapshot([]);
            setShowModal(true);
          }}
        >
          Create Task
        </button>
      )}

      {loggedIn && (
        <div>
          {/* Archive Button */}
          <button
            className="ArchiveButton"
            onClick={() => setShowArchiveModal(true)}
          >
            All Archived
          </button>

          {showArchiveModal && (
            <div className="modal-overlay">
              <div className="modal">
                <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Archived Tasks</h3>

                <div className="AutoArchiveSettings">
                  <label>
                    <input
                      type="checkbox"
                      checked={autoArchiveEnabled}
                      onChange={() => setAutoArchiveEnabled(!autoArchiveEnabled)}
                    />
                    Auto-Archive
                  </label>

                  <select
                    value={archivePeriod}
                    onChange={(e) => setArchivePeriod(e.target.value)}
                    className="TextFields"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>

                  <input
                    type="time"
                    value={archiveTime}
                    onChange={(e) => setArchiveTime(e.target.value)}
                    className="TextFields"
                  />
                </div>

                <div style={{ marginTop: '15px', width: '100%' }}>
                  {archivedTasks.length > 0 ? (
                    archivedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="TaskRow"
                        style={{
                          backgroundColor: 'var(--themed-background-color)',
                          padding: '10px',
                          borderRadius: '8px',
                          marginBottom: '10px',
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!task.completed}
                          onChange={() => unarchiveTask(task.id)}
                        />
                        <span className="TaskCell"><strong>{task.name}</strong></span>
                        <span className="TaskCell">{task.due_time ? formatDate(task.due_time) : "N/A"}</span>
                        <span className="TaskCell">Priority: {task.priority}</span>
                        <span className="TaskCell">Status: {task.status}</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ marginTop: '10px' }}>No archived tasks.</p>
                  )}
                </div>
                <button
                  onClick={closeArchiveModal}
                  className="CloseArchiveButton"
                  style={{ marginTop: '20px' }}
                >
                  Close
                </button>
              </div>
            </div>
          )}


          {/* Template Button (unchanged) */}
          <button
            className="TemplateButton"
            onClick={() => setShowTemplateModal(true)}
          >
            Templates
          </button>

          {showTemplateModal && (
            <div className="Modal">
              <div className="TemplateModalContent">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="CloseArchiveButton"
                >
                  Close
                </button>
                <h3>Task Templates</h3>

                {taskTemplates.length > 0 ? (
                  taskTemplates.map((template) => (
                    <div key={template.id} className="TemplateCard">
                      <div className="TemplateInfo">
                        <strong>{template.name}</strong>
                        <p>{template.description}</p>
                      </div>
                      <div className="TemplateActions">
                        <button onClick={() => createTaskFromTemplate(template)}>New</button>
                        <button onClick={() => editTemplate(template)}>Edit</button>
                        <button onClick={() => deleteTemplate(template)}>Delete</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No templates.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!loggedIn && (
        <h3 style={{ textAlign: "center" }}>Log in to start making tasks!</h3>
      )}

      {dependencyError && (
        <div className="TaskWarning">
          <p>{dependencyError}</p>
          <button
            onClick={() => setDependencyError("")}
            className="CloseWarningButton"
          >
            ✖
          </button>
        </div>
      )}

      {taskWarning && (
        <div className="TaskWarning">
          <p>{taskWarning}</p>
          <button
            onClick={() => setTaskWarning("")}
            className="CloseWarningButton"
          >
            ✖
          </button>
        </div>
      )}

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
      {timeModalTask && (
        <div
          className="modal-overlay"
          onMouseDown={() => setTimeModalTask(null)}
        >
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <h3>Time Performance</h3>
            <p>
              <strong>Estimated:</strong>{" "}
              {timeModalTask.estimated_time || "N/A"} min
            </p>
            <p>
              <strong>Actual:</strong>{" "}
              {(timeModalTask.time_logs || []).reduce(
                (sum, log) => sum + (log.minutes || 0),
                0
              )}{" "}
              min
            </p>
            {timeModalTask.estimated_time &&
              (() => {
                const actual = (timeModalTask.time_logs || []).reduce(
                  (sum, log) => sum + (log.minutes || 0),
                  0
                );
                const estimated = parseInt(timeModalTask.estimated_time);
                const diff = actual - estimated;
                let color = "gray";
                if (diff > 0) color = "red";
                else if (diff < 0) color = "green";
                return (
                  <p style={{ color }}>
                    {diff === 0
                      ? "On Time"
                      : diff > 0
                      ? `Over by ${diff} min`
                      : `Under by ${-diff} min`}
                  </p>
                );
              })()}
            <button className="Buttons" onClick={() => setTimeModalTask(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={() => {
            setError("");
            setWarning("");
            setAcceptedSuggestions(acceptedSuggestionsSnapshot);
            setRejectedSuggestions(rejectedSuggestionsSnapshot);
            if (editingTask) {
              const cleanedSubtasks = editingTask.subtasks.map((sub) => ({
                ...sub,
                isEditing: false,
                editName: undefined,
              }));
              setEditingTask((prev) => ({
                ...prev,
                subtasks: cleanedSubtasks,
              }));
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
              subtasks: [],
              completion_date: "",
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

            <input
              type="text"
              name="name"
              placeholder="Task Name"
              value={editingTask ? editingTask.name : newTask.name}
              onChange={handleChange}
              className="TextFields"
              required
            />
            <input
              type="text"
              name="description"
              placeholder="Description (Optional)"
              value={
                editingTask ? editingTask.description : newTask.description
              }
              onChange={handleChange}
              className="TextFields"
            />
            <input
              type="date"
              name="due_time"
              value={editingTask ? editingTask.due_time : newTask.due_time}
              onChange={handleChange}
              className="TextFields"
              required
            />
            <label>Estimated Time</label>
            <input
              type="number"
              name="estimated_time"
              className="TextFields"
              value={
                editingTask
                  ? editingTask.estimated_time
                  : newTask.estimated_time
              }
              onChange={handleChange}
            />

            {/* Added start_date input */}
            <label style={{ fontSize: "14px", marginTop: "10px" }}>
              Start Date (optional)
            </label>
            <input
              type="date"
              name="start_date"
              value={editingTask ? editingTask.start_date : newTask.start_date}
              onChange={handleChange}
              className="TextFields"
            />
            <select
              name="priority"
              onChange={handleChange}
              className="TextFields"
              value={editingTask ? editingTask.priority : newTask.priority}
            >
              <option value="Low">Low</option>
              <option value="Medium" selected>
                Medium
              </option>
              <option value="High">High</option>
            </select>

            <select
              name="color_tag"
              onChange={handleChange}
              className="TextFields"
              value={editingTask ? editingTask.color_tag : newTask.color_tag}
            >
              <option value="">No color</option>
              {COLORS.map((color) => (
                <option
                  key={color.value}
                  value={color.value}
                  style={{ backgroundColor: color.value }}
                >
                  {color.name}
                </option>
              ))}
            </select>

            <select
              name="status"
              onChange={handleChange}
              className="TextFields"
              value={editingTask ? editingTask.status : newTask.status}
            >
              <option value="To-Do">To-Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            {(editingTask?.status === "Completed" ||
              newTask.status === "Completed") && (
              <>
                <label style={{ fontSize: "14px", marginTop: "10px" }}>
                  Completion Date
                </label>
                <input
                  type="date"
                  name="completion_date"
                  value={
                    editingTask
                      ? editingTask.completion_date
                      : newTask.completion_date
                  }
                  onChange={handleChange}
                  className="TextFields"
                  required
                />
              </>
            )}

            {(editingTask || newTask) && (
              <div
                className="SubtaskContainer"
                style={{ textAlign: "left", width: "100%" }}
              >
                <h3>Subtasks</h3>
                {(editingTask?.subtasks || newTask?.subtasks || []).map(
                  (subtask, index) => (
                    <div
                      key={index}
                      className="SubtaskRow"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => {
                          if (editingTask) {
                            const updatedSubtasks = [...editingTask.subtasks];
                            updatedSubtasks[index].completed =
                              !subtask.completed;
                            setEditingTask({
                              ...editingTask,
                              subtasks: updatedSubtasks,
                            });
                          } else {
                            const updatedSubtasks = [...editingTask.subtasks];
                            updatedSubtasks[index].completed =
                              !subtask.completed;
                            setNewTask({
                              ...newTask,
                              subtasks: updatedSubtasks,
                            });
                          }
                        }}
                      />

                      {!subtask.isEditing ? (
                        <span
                          className={
                            subtask.completed ? "SubtaskCompleted" : ""
                          }
                        >
                          {subtask.name}
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={subtask.editName}
                          onChange={(e) => {
                            if (editingTask) {
                              const updatedSubtasks = [...editingTask.subtasks];
                              updatedSubtasks[index].editName = e.target.value;
                              setEditingTask({
                                ...editingTask,
                                subtasks: updatedSubtasks,
                              });
                            } else {
                              const updatedSubtasks = [...newTask.subtasks];
                              updatedSubtasks[index].editName = e.target.value;
                              setNewTask({
                                ...newTask,
                                subtasks: updatedSubtasks,
                              });
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
                                editName: updatedSubtasks[index].name,
                              };
                              setEditingTask((prev) => ({
                                ...prev,
                                subtasks: updatedSubtasks,
                              }));
                            } else {
                              const updatedSubtasks = [...newTask.subtasks];
                              updatedSubtasks[index] = {
                                ...updatedSubtasks[index],
                                isEditing: true,
                                editName: updatedSubtasks[index].name,
                              };
                              setNewTask((prev) => ({
                                ...prev,
                                subtasks: updatedSubtasks,
                              }));
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
                                const updatedSubtasks = [
                                  ...editingTask.subtasks,
                                ];
                                updatedSubtasks[index].name =
                                  updatedSubtasks[index].editName;
                                updatedSubtasks[index].isEditing = false;
                                delete updatedSubtasks[index].editName;
                                setEditingTask({
                                  ...editingTask,
                                  subtasks: updatedSubtasks,
                                });
                              } else {
                                const updatedSubtasks = [...newTask.subtasks];
                                updatedSubtasks[index].name =
                                  updatedSubtasks[index].editName;
                                updatedSubtasks[index].isEditing = false;
                                delete updatedSubtasks[index].editName;
                                setNewTask({
                                  ...newTask,
                                  subtasks: updatedSubtasks,
                                });
                              }
                            }}
                          >
                            Save
                          </button>
                          <button
                            className="SubtaskButton SubtaskCancelButton"
                            onClick={() => {
                              const updatedSubtasks = [
                                ...(editingTask?.subtasks || newTask?.subtasks),
                              ];
                              updatedSubtasks[index].isEditing = false;
                              delete updatedSubtasks[index].editName;

                              if (editingTask) {
                                setEditingTask({
                                  ...editingTask,
                                  subtasks: updatedSubtasks,
                                });
                              } else {
                                setNewTask({
                                  ...newTask,
                                  subtasks: updatedSubtasks,
                                });
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
                          if (
                            window.confirm(
                              "Are you sure you want to delete this subtask?"
                            )
                          ) {
                            if (editingTask) {
                              setEditingTask((prev) => ({
                                ...prev,
                                subtasks: prev.subtasks.filter(
                                  (_, i) => i !== index
                                ),
                              }));
                            } else {
                              setNewTask((prev) => ({
                                ...prev,
                                subtasks: prev.subtasks.filter(
                                  (_, i) => i !== index
                                ),
                              }));
                            }
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )
                )}
                {suggestedSubtasks.length > 0 && (
                  <div
                    className="SubtaskSuggestionList"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    {suggestedSubtasks.map((suggestion, index) => (
                      <div
                        key={index}
                        style={{
                          border: "2px dashed gray",
                          backgroundColor: "#f9f9f9",
                          padding: "10px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                          width: "100%",
                        }}
                      >
                        <span style={{ fontStyle: "italic", fontSize: "14px" }}>
                          {suggestion}
                        </span>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            className="SubtaskButton SubtaskConfirmButton"
                            onClick={() => {
                              const newSub = {
                                id: Date.now(),
                                name: suggestion,
                                completed: false,
                              };
                              if (editingTask) {
                                setEditingTask((prev) => ({
                                  ...prev,
                                  subtasks: [...prev.subtasks, newSub],
                                }));
                              } else {
                                setNewTask((prev) => ({
                                  ...prev,
                                  subtasks: [...prev.subtasks, newSub],
                                }));
                              }
                              axios
                                .post(
                                  `http://127.0.0.1:5000/tasks/${
                                    editingTask?.id || "new"
                                  }/accept_suggestion`,
                                  { suggestion }
                                )
                                .then(() => {
                                  setAcceptedSuggestions((prev) => [
                                    ...prev,
                                    suggestion,
                                  ]);
                                  setSuggestedSubtasks((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  );
                                })
                                .catch((err) =>
                                  console.error(
                                    "Failed to accept suggestion:",
                                    err
                                  )
                                );
                            }}
                          >
                            Add
                          </button>
                          <button
                            className="SubtaskButton SubtaskEditButton"
                            onClick={() => {
                              const editedName = prompt(
                                "Edit subtask name:",
                                suggestion
                              );
                              if (editedName) {
                                const newSub = {
                                  id: Date.now(),
                                  name: editedName,
                                  completed: false,
                                };
                                if (editingTask) {
                                  setEditingTask((prev) => ({
                                    ...prev,
                                    subtasks: [...prev.subtasks, newSub],
                                  }));
                                } else {
                                  setNewTask((prev) => ({
                                    ...prev,
                                    subtasks: [...prev.subtasks, newSub],
                                  }));
                                }

                                // Mark original as accepted and remove from suggestions
                                axios
                                  .post(
                                    `http://127.0.0.1:5000/tasks/${
                                      editingTask?.id || "new"
                                    }/accept_suggestion`,
                                    { suggestion }
                                  )
                                  .then(() => {
                                    setAcceptedSuggestions((prev) => [
                                      ...prev,
                                      suggestion,
                                    ]);
                                    setSuggestedSubtasks((prev) =>
                                      prev.filter((_, i) => i !== index)
                                    );
                                  })
                                  .catch((err) =>
                                    console.error(
                                      "Failed to accept edited suggestion:",
                                      err
                                    )
                                  );
                              }
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="SubtaskButton SubtaskDeleteButton"
                            onClick={() => {
                              axios
                                .post(
                                  `http://127.0.0.1:5000/tasks/${
                                    editingTask?.id || "new"
                                  }/reject_suggestion`,
                                  { suggestion }
                                )
                                .then(() => {
                                  setRejectedSuggestions((prev) => [
                                    ...prev,
                                    suggestion,
                                  ]);
                                  setSuggestedSubtasks((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  );
                                })
                                .catch((err) =>
                                  console.error(
                                    "Failed to reject suggestion:",
                                    err
                                  )
                                );
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isAddingSubtask ? (
                  <div
                    className="AddSubtaskRow"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
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
                              subtasks: [
                                ...prev.subtasks,
                                {
                                  id: prev.subtasks.length + 1,
                                  name: newSubtaskName.trim(),
                                  completed: false,
                                  isEditing: false,
                                },
                              ],
                            }));
                          } else {
                            setNewTask((prev) => ({
                              ...prev,
                              subtasks: [
                                ...prev.subtasks,
                                {
                                  id: prev.subtasks.length + 1,
                                  name: newSubtaskName.trim(),
                                  completed: false,
                                  isEditing: false,
                                },
                              ],
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
                      onClick={() => {
                        setNewSubtaskName("");
                        setIsAddingSubtask(false);
                      }}
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
            <div className="ButtonsContainer">
              <button
                onClick={() => {
                  setIsAddingSubtask(false);
                  setNewSubtaskName("");
                  editingTask ? handleUpdateTask() : handleSubmit();
                }}
                className="Buttons"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setError("");
                  setWarning("");
                  setEditingTask(null);
                  setAcceptedSuggestions([]);
                  setRejectedSuggestions([]);
                  setAcceptedSuggestionsSnapshot(acceptedSuggestions);
                  setRejectedSuggestionsSnapshot(rejectedSuggestions);
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
                  });
                  setNewSubtaskName("");
                  setIsAddingSubtask(false);
                  setShowModal(false);
                }}
                className="Buttons"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskTimeCell({ task, onLogClick }) {
  const total = (task.time_logs || []).reduce(
    (sum, log) => sum + (log.minutes || 0),
    0
  );
  const estimated = parseInt(task.estimated_time);
  let timeStatus = "no-estimate";

  if (!isNaN(estimated)) {
    const diff = total - estimated;
    if (diff === 0) timeStatus = "on-time";
    else if (diff < 0) timeStatus = "under-time";
    else timeStatus = "over-time";
  }

  const statusColor = {
    "under-time": "#2ecc71", // green
    "over-time": "#e74c3c",  // red
    "on-time": "#7f8c8d",    // gray
    "no-estimate": "#333",   // default dark
  }[timeStatus];

  return (
    <div className="TaskCell">
      <div>
        <strong>{total} min</strong>
      </div>
      <button
        className="SubtaskButton"
        onClick={onLogClick}
        style={{
          marginTop: "4px",
          color: "white",
          backgroundColor: statusColor,
          border: "none",
          padding: "6px 10px",
          borderRadius: "4px",
          fontWeight: "bold",
        }}
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
  setSelectedTaskLogs,
}) {
  const [editingLogId, setEditingLogId] = useState(null);
  const [editLogMinutes, setEditLogMinutes] = useState("");
  const [breakReminderVisible, setBreakReminderVisible] = useState(false);
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [breakThreshold, setBreakThreshold] = useState("120"); // default 120 min
  const [breakBlocked, setBreakBlocked] = useState(false);
  const [remainingBreakTime, setRemainingBreakTime] = useState(60); // 1 minute in seconds
  const [lastBreakEndTime, setLastBreakEndTime] = useState(null);

  const totalActual = (logs || []).reduce((sum, log) => sum + (log.minutes || 0), 0);
  const estimated = parseInt(task.estimated_time);
  const diff = estimated ? totalActual - estimated : null;
  let timeColor = "gray";
  if (diff > 0) timeColor = "red";
  else if (diff < 0) timeColor = "green";

  useEffect(() => {
    let interval;

    if (breakBlocked) {
      interval = setInterval(() => {
        setRemainingBreakTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [breakBlocked]);

  useEffect(() => {
    if (remainingBreakTime === 0 && breakBlocked) {
      setBreakBlocked(false);
      setRemainingBreakTime(60);
      setBreakReminderVisible(false);
      setLastBreakEndTime(new Date().toISOString());
    }
  }, [remainingBreakTime, breakBlocked]);

  const handleEditLog = (logId) => {
    const minutes = parseInt(editLogMinutes);
    if (isNaN(minutes) || minutes <= 0 || minutes > 1440) {
      alert("Please enter a time between 1 and 1440 minutes.");
      return;
    }

    axios
      .put(`http://127.0.0.1:5000/tasks/${task.id}/log_time/${logId}`, {
        minutes,
      })
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
        {estimated && (
          <div style={{ color: timeColor, marginBottom: "10px" }}>
            <strong>Estimated:</strong> {estimated} min<br />
            <strong>Actual:</strong> {totalActual} min<br />
            {diff === 0
              ? "On Time"
              : diff > 0
              ? `Over by ${diff} min`
              : `Under by ${-diff} min`}
          </div>
        )}
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
                <span>
                  {log.minutes} min - {log.timestamp}
                </span>
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
                      .delete(
                        `http://127.0.0.1:5000/tasks/${task.id}/log_time/${log.id}`
                      )
                      .then((res) => {
                        const updatedLogs = res.data.logs;
                        setSelectedTaskLogs(updatedLogs);
                        setTasks((prev) =>
                          prev.map((t) =>
                            t.id === task.id
                              ? { ...t, time_logs: updatedLogs }
                              : t
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

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            marginTop: "10px",
          }}
        >
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
              if (breakBlocked) {
                alert(
                  `Break in progress. Please wait ${Math.ceil(
                    remainingBreakTime / 60
                  )} minute(s) before logging more time.`
                );
                return;
              }

              const minutes = parseInt(logInput);
              if (isNaN(minutes) || minutes <= 0 || minutes > 1440) {
                alert("Please enter a time between 1 and 1440 minutes.");
                return;
              }

              axios
                .post(`http://127.0.0.1:5000/tasks/${task.id}/log_time`, {
                  minutes,
                })
                .then((res) => {
                  const updatedLogs = res.data.logs;
                  const now = new Date();
                  const totalLogged = updatedLogs.reduce((sum, log) => {
                    const logTime = new Date(log.timestamp);
                    if (
                      !lastBreakEndTime ||
                      logTime >= new Date(lastBreakEndTime)
                    ) {
                      return sum + log.minutes;
                    }
                    return sum;
                  }, 0);
                  setSelectedTaskLogs(updatedLogs);
                  setLogInput("");
                  setTasks((prev) =>
                    prev.map((t) =>
                      t.id === task.id ? { ...t, time_logs: updatedLogs } : t
                    )
                  );
                  if (!breakBlocked && totalLogged >= breakThreshold) {
                    setBreakReminderVisible(true);
                  } else {
                    setBreakReminderVisible(false);
                  }
                })
                .catch((err) => console.error(err));
            }}
            style={{
              backgroundColor: "#66dd66",
              color: "#fff",
              padding: "5px 10px",
            }}
          >
            Log Time
          </button>
        </div>

        <div style={{ marginTop: "10px" }}>
          <label style={{ marginRight: "5px" }}>
            Set break threshold (min):
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={String(breakThreshold)}
            onChange={(e) => {
              const raw = e.target.value;
              if (/^\d*$/.test(raw)) {
                setBreakThreshold(raw === "" ? "" : parseInt(raw));
              }
            }}
            onBlur={() => {
              if (
                breakThreshold === "" ||
                isNaN(breakThreshold) ||
                breakThreshold < 10 ||
                breakThreshold > 1440
              ) {
                setBreakThreshold(120);
                alert("Please enter a valid number between 10 and 1440.");
              }
            }}
            className="TextFields"
            style={{ width: "80px" }}
          />
        </div>

        {errorMsg && <p className="ErrorMessage">{errorMsg}</p>}

        <button
          className="Buttons"
          onClick={onClose}
          style={{ marginTop: "20px" }}
        >
          Close
        </button>

        {breakReminderVisible && (
          <div className="modal-overlay" onMouseDown={() => {}}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
              <h3>⏸️ Time for a break!</h3>
              <p>
                You’ve been working for {breakThreshold} minutes. Consider
                taking a short break.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                }}
              >
                <button
                  className="Buttons"
                  onClick={() => {
                    setBreakReminderVisible(false);
                    setSnoozeCount(0);
                    setBreakBlocked(true);
                  }}
                >
                  Accept
                </button>
                <button
                  className="Buttons"
                  onClick={() => {
                    if (snoozeCount >= 2) {
                      setBreakBlocked(true);
                      alert(
                        "You've snoozed too many times. Take a break before logging more time."
                      );
                    } else {
                      setBreakReminderVisible(false);
                      setSnoozeCount((prev) => prev + 1);
                      setTimeout(
                        () => setBreakReminderVisible(true),
                        15 * 1000
                      );
                    }
                  }}
                >
                  Snooze
                </button>
              </div>
            </div>
          </div>
        )}

        {breakBlocked && (
          <div
            style={{ marginTop: "15px", color: "#b22222", fontWeight: "bold" }}
          >
            ⏳ Break in progress. Time left:{" "}
            {Math.floor(remainingBreakTime / 60)}:
            {("0" + (remainingBreakTime % 60)).slice(-2)}
          </div>
        )}
      </div>
    </div>
  );
}

// function Notes() {
//   const [showNotes, setShowNotes] = useState(false);
//   const [edit, setEdit] = useState();
//   //const [notes, setNotes] = useState([]);

//   const applyFormating = (format) => {
//     console.log(format);
//   };

//   return (
//     <div>
//       <button className="NotesButton" onClick={() => setShowNotes(!showNotes)}>
//         {showNotes ? "Close Notes" : "Open Notes"}
//       </button>

//       {showNotes && (
//         <div>
//           <h3>Notes</h3>
//           <button className="BoldButton" onClick={() => applyFormating("bold")}>
//             Bold
//           </button>
//           <button
//             className="BulletButton"
//             onClick={() => applyFormating("bullet")}
//           >
//             Bullet
//           </button>
//           <button
//             className="ItalicsButton"
//             onClick={() => applyFormating("italics")}
//           >
//             Italics
//           </button>

//           <textarea
//             value={edit}
//             onChange={(e) => setEdit(e.target.value)}
//             placeholder="Put notes here..."
//             rows={5}
//           />
//         </div>
//       )}
//     </div>
//   );
// }
