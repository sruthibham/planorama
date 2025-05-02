import "./App.css";
import TaskPage from "./TaskPage";
import ProfilePage from "./ProfilePage";
import SettingsPage from "./SettingsPage";
import TaskDependenciesPage from "./TaskDependenciesPage";
import WeeklySummaryPage from "./WeeklySummaryPage";
import NavBar from "./NavBar";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import { GlobalProvider, useGlobal } from "./GlobalContext";
import { IoSettingsOutline } from "react-icons/io5";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useRef } from "react";
import axios from "axios";
import React from "react";
import StreakTracker from "./StreakTracker";
import ProductivityPage from "./ProductivityPage";

// const resizeObserverErrorHandler = (e) => {
//   if (
//     e.message.includes(
//       "ResizeObserver loop completed with undelivered notifications"
//     )
//   ) {
//     e.stopImmediatePropagation();
//   }
// };

// window.addEventListener("error", resizeObserverErrorHandler);
// window.addEventListener("unhandledrejection", resizeObserverErrorHandler);

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
    if (showExtraButtons === false) {
      setShowExtraButtons(true);
    } else {
      setShowExtraButtons(false);
    }
  };

  const handleLogout = () => {
    axios.get("http://127.0.0.1:5000/logout").then((response) => {
      setUser(response.data);
    });
  };

  const navigate = useNavigate();

  return (
    <div
      className="User"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "70px",
      }}
    >
      <div
        style={{
          color: "black",
          padding: "5px",
          cursor: "pointer",
          fontSize: "15px",
        }}
        onClick={handleClick}
      >
        {user}
      </div>
      {showExtraButtons && (
        <div
          style={{
            marginTop: "5px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {!showLogoutButton && (
            <>
              <button className="Buttons" onClick={() => navigate("/login")}>
                Log In
              </button>
              <button
                className="Buttons"
                onClick={() => navigate("/createaccount")}
              >
                Create Account
              </button>
            </>
          )}
          {showLogoutButton && (
            <>
              <button className="Buttons" onClick={() => navigate("/profile")}>
                <img
                  src="/default-profile.png"
                  alt="Profile"
                  className="ProfileIconImage"
                />
              </button>
              <button className="Buttons" onClick={handleLogout}>
                Log Out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}


/*

const TasksContext = createContext();

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);

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

  return (
    <TasksContext.Provider value={{ tasks, setTasks, archivedTasks, setArchivedTasks, archiveTask}}>
      {children}
    </TasksContext.Provider>
  )
}

*/

//const useTasks = () => useContext(TasksContext);

function CreateAccountPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errMsg, setErrMsg] = useState([]);

  const { setUser } = useGlobal();

  const navigate = useNavigate();

  const handleSubmit = () => {
    axios
      .post("http://127.0.0.1:5000/createuser", {
        username: username,
        email: email,
        password: password,
      })
      .then((response) => {
        setErrMsg(response.data.msg);
        if (response.data.success) {
          setUser(username); // Update global state
          navigate("/");
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
    axios
      .post("http://127.0.0.1:5000/loguser", {
        username: username,
        password: password,
      })
      .then((response) => {
        setErrMsg(response.data.msg);
        if (response.data.success) {
          setUser(username); // Update global state
          navigate("/");
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
      <div>{errMsg}</div>
    </div>
  );
}

function TeamsPage() {
  const navigate = useNavigate();
  const [teamList, setTeamList] = useState([]);
  const [showFields, setShowFields] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [teamName, setTeamName] = useState("");
  const { user } = useGlobal();
  const [inviteList, setInviteList] = useState([]);

  // Open and close text field
  const handleOpen = () => {
    setShowFields(true);
  };
  const handleClose = () => {
    setShowFields(false);
    setTeamName("");
  };

  // Create new team
  const handleCreate = () => {
    axios
      .post("http://127.0.0.1:5000/createteam", { teamName: teamName })
      .then((response) => {
        setTeamList([...teamList, response.data]);
        return axios.get("http://127.0.0.1:5000/getteams");
      })
      .then((response) => {
        setTeamList(response.data);
      });
  };
  // Join members list
  const handleJoin = (teamID) => {
    axios
      .post("http://127.0.0.1:5000/jointeam", { teamID: teamID })
      .then(() => {
        return axios.get("http://127.0.0.1:5000/getteams");
      })
      .then((response) => {
        setTeamList(response.data);
      });
    handleDeny(teamID);
  };

  // Remove off recipients list
  const handleDeny = (teamID) => {
    axios
      .post("http://127.0.0.1:5000/denyinvite", { teamID: teamID })
      .then(() => {
        return axios.get("http://127.0.0.1:5000/getinvites");
      })
      .then((response) => {
        setInviteList(response.data);
      });
  };

  // Update team page when changing user
  useEffect(() => {
    if (user !== "Guest") {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }

    axios
      .get("http://127.0.0.1:5000/getteams")
      .then((response) => {
        setTeamList(response.data);
      })
      .catch((error) => console.error("Error fetching teams:", error));

    axios
      .get("http://127.0.0.1:5000/getinvites")
      .then((response) => {
        setInviteList(response.data);
      })
      .catch((error) => console.error("Error fetching invites:", error));
  }, [user]);

  return (
    <div>
      <div className="Headers" style={{marginTop:35}}>
        <h1>Teams</h1>
        {loggedIn && !showFields && (
          <button className="Button" onClick={handleOpen}>
            Create Team
          </button>
        )}
        {loggedIn && showFields && (
          <div className="Container">
            <input
              type="text"
              placeholder="Team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="TextFields"
            />
            <div className="ButtonContainer">
              <button onClick={handleClose}>Cancel</button>
              <button onClick={handleCreate}>Create</button>
            </div>
          </div>
        )}
        {!loggedIn && (
          <h3 style={{ textAlign: "center" }}>Log in to make or join teams!</h3>
        )}
      </div>

      <div className="TeamContainer">
        {teamList.map((team) => (
          <button
            key={team.teamID}
            onClick={() => navigate(`/team/${team.teamID}`)}
            style={{
              padding: "12px 20px",
              margin: "8px",
            }}
          >
            {team.teamName}
          </button>
        ))}
      </div>
      <div className="BotRight">
        <h3 className="centered">Invites</h3>
        {inviteList.map((team) => (
          <div key={team.teamID} className="user-row">
            {team.teamName} - {team.owner}
            <div style={{ display: "flex", gap: "2px" }}>
              <button
                className="Invite"
                onClick={() => handleJoin(team.teamID)}
              >
                Join
              </button>
              <button
                className="Invite"
                onClick={() => handleDeny(team.teamID)}
              >
                Deny
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TeamPage = () => {
  const { teamID } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const { user } = useGlobal();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [userList, setUserList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [showError1, setShowError1] = useState(false);
  const [showError2, setShowError2] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showList, setShowList] = useState(false);
  const [currentOpen, setCurrentOpen] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [displayNames, setDisplayNames] = useState({});
  const [showDisplay, setShowDisplay] = useState(null);

  const [commentText, setCommentText] = useState("");

  const [activeComment, setActiveComment] = useState("");
  const [comments, setComments] = useState([]);
  const [activeMenu, setActiveMenu] = useState("");

  const handleList = (curr) => {
    if (showList === true && curr === currentOpen) {
      setShowList(false);
    } else {
      setShowList(true);
      setCurrentOpen(curr);
    }
  };
  useEffect(() => {
    axios
      .get(`http://127.0.0.1:5000/getteam?teamID=${teamID}`)
      .then((response) => {
        setTeam(response.data);
      })
      .catch((error) => console.error("Error fetching team:", error));
  }, [teamID]);

  useEffect(() => {
    if (user === "Guest") {
      navigate("/teams");
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadInitialData = () => {
      if (teamID) {
        axios
          .get(`http://127.0.0.1:5000/get_comment?teamID=${teamID}`)
          .then((response) => {
            console.log("Comments received:", response.data.comments);
            setComments(response.data.comments);
          })
          .catch((error) => console.error("Error loading comments:", error));
      }
    };

    loadInitialData();
  }, [teamID]);

  const handleSaveComment = (taskName, currentUser) => {
    axios
      .post(`http://127.0.0.1:5000/add_comment`, {
        teamID: teamID,
        taskName: taskName,
        username: currentUser,
        commentText: commentText,
      })
      .then((response) => {
        console.log("Comment saved:", response.data);
        setComments(response.data.comments);
        setCommentText("");
        setActiveComment(null);
      })
      .catch((err) => {
        console.error("Error saving comment:", err);
      });
  };

  const handleOpenConfirm = () => {
    if (showConfirm) {
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  const handleExpand = () => {
    if (showCompleted) {
      setShowCompleted(false);
    } else {
      setShowCompleted(true);
    }
  };

  const handleOpenSearch = () => {
    if (showSearch) {
      setShowSearch(false);
    } else {
      setShowSearch(true);
    }
  };

  // Remove off members list
  const handleLeave = () => {
    axios
      .post("http://127.0.0.1:5000/leaveteam", { teamID: team.teamID })
      .then(() => {
        navigate("/teams");
      });
  };

  const handleInvite = (username) => {
    // send owner and recipient to backend
    // store invites like members
    // useEffect updates invites for everyone
    axios
      .post("http://127.0.0.1:5000/sendinvite", {
        teamID: team.teamID,
        recipient: username,
      })
      .then(() => {
        //Grey out invited user
        return axios.get(`http://127.0.0.1:5000/getteam?teamID=${teamID}`);
      })
      .then((response) => {
        setTeam(response.data); // Update state with new recipients list
      })
      .catch((error) =>
        console.error("Error updating team after invite:", error)
      );
  };

  const handleView = (username) => {
    const camefrom = teamID;
    navigate(`/profile/${username}/from/${camefrom}`);
  };

  useEffect(() => {
    axios
      .post("http://127.0.0.1:5000/search", { query: query })
      .then((response) => {
        setUserList(response.data);
      });
  }, [query]);

  const handleDelete = () => {
    axios
      .post("http://127.0.0.1:5000/deleteteam", { teamID: teamID })
      .then((response) => {
        navigate("/teams");
      });
  };

  const handleCreate = () => {
    if (taskName === "" || deadline === "") {
      setShowError2(false);
      setShowError1(true);
      return;
    }

    axios
      .post("http://127.0.0.1:5000/createteamtask", {
        teamID: teamID,
        taskName: taskName,
        deadline: deadline,
      })
      .then(() => {
        return axios.get(`http://127.0.0.1:5000/getteam?teamID=${teamID}`);
      })
      .then((response) => {
        setTeam(response.data);
        // Reset all fields
        setTaskName("");
        setDeadline("");
        setShowModal(false);
        setShowError1(false);
        setShowError2(false);
      })
      .catch((error) => {
        setShowError1(false);
        setShowError2(true);
        setErrorMsg(error.response.data.error);
      });
  };

  const handleDeleteTask = (task_name) => {
    axios
      .post("http://127.0.0.1:5000/deleteteamtask", {
        teamID: teamID,
        taskName: task_name,
      })
      .then(() => {
        return axios.get(`http://127.0.0.1:5000/getteam?teamID=${teamID}`);
      })
      .then((response) => {
        setTeam(response.data);
      });
  };

  const handleClaim = (task_name, target) => {
    axios
      .post("http://127.0.0.1:5000/claim", {
        teamID: teamID,
        user: target,
        taskName: task_name,
      })
      .then(() => {
        console.log(target);
        return axios.get(`http://127.0.0.1:5000/getteam?teamID=${teamID}`);
      })
      .then((response) => {
        setTeam(response.data);
      });
  };

  const handleComplete = (task_name, clickedBy) => {
    axios
      .post("http://127.0.0.1:5000/completetask", {
        teamID: teamID,
        user: clickedBy,
        taskName: task_name,
      })
      .then(() => {
        return axios.get(`http://127.0.0.1:5000/getteam?teamID=${teamID}`);
      })
      .then((response) => {
        setTeam(response.data);
      });
  };

  const handleReopen = (task_name, clickedBy) => {
    axios
      .post("http://127.0.0.1:5000/reopentask", {
        teamID: teamID,
        user: clickedBy,
        taskName: task_name,
      })
      .then(() => {
        return axios.get(`http://127.0.0.1:5000/getteam?teamID=${teamID}`);
      })
      .then((response) => {
        setTeam(response.data);
      });
  };

  const handleDeleteCompleted = (task_name) => {
    axios
      .post("http://127.0.0.1:5000/deletecompletedtask", {
        teamID: teamID,
        taskName: task_name,
      })
      .then(() => {
        return axios.get(`http://127.0.0.1:5000/getteam?teamID=${teamID}`);
      })
      .then((response) => {
        setTeam(response.data);
      });
  };

  const handleChangeDisplay = (member) => {
    if (showDisplay === member) {
      setShowDisplay(null);
    } else {
      setShowDisplay(member);
      setDisplayName("");
    }
  };

  const handleCommentTask = (task_name) => {
    if (activeComment === task_name) {
      setActiveComment(null);
    } else {
      setActiveComment(task_name);
    }
  };

  const handleDeleteComment = () => {};

  /*
  const handleSaveComment = (taskName, currentUser) => {
    
    const newComment = {
      taskName,
      text: commentText,
      user: currentUser
    }

    setComments([...comments, newComment]);
    setCommentText("");
    setActiveComment(null);
  }
    */

  const handleMenuClick = (taskName) => {
    if (activeMenu === taskName) {
      setActiveMenu(null);
    } else {
      setActiveMenu(taskName);
    }

    if (teamID) {
      axios
        .get(`http://127.0.0.1:5000/get_comment?teamID=${teamID}`)
        .then((response) => {
          setComments(response.data.comments || []);
        })
        .catch((error) => console.error("Error refreshing comments:", error));
    }
  };

  const handleSetDisplay = (member) => {
    axios
      .post("http://127.0.0.1:5000/setdisplayname", {
        teamID: teamID,
        username: member,
        displayName: displayName,
      })
      .then(() => {
        setDisplayNames((prev) => ({
          ...prev,
          [member]: displayName,
        }));

        setShowDisplay(null);
        setDisplayName("");
        return axios.get(`http://127.0.0.1:5000/getteam?teamID=${teamID}`);
      })
      .then((response) => {
        setTeam(response.data);
      });
  };

  const handleResetDisplay = (member) => {
    axios
      .post("http://127.0.0.1:5000/resetdisplayname", {
        teamID: teamID,
        username: member,
        displayName: member,
      })
      .then(() => {
        setDisplayNames((prev) => ({
          ...prev,
          [member]: member,
        }));

        setShowDisplay(null);
        setDisplayName("");
        return axios.get(`http://127.0.0.1:5000/getteam?teamID=${teamID}`);
      })
      .then((response) => {
        setTeam(response.data);
      });
  };

  if (!team) return <h3 className="Headers">Loading team...</h3>;

  return (
    <div>
      <div className="Headers" style={{marginTop:35}}>
        <h1>- {team.teamName} -</h1>
        <button onClick={() => navigate("/teams")}>Back</button>
      </div>
      <div style={{ display: "flex" }}>
        <div style={{ width: "50%" }}>
          <h3 className="AddMember" style={{ marginBottom: 20 }}>
            Leader: {team.display[team.owner] || team.owner}
          </h3>

          <div className="MemberList">
            <h4>
              Members:
              {user === team.owner && (
                <button
                  onClick={handleOpenSearch}
                  style={{ marginBottom: 10, marginLeft: 10, padding: 5 }}
                >
                  Add member
                </button>
              )}
            </h4>
            <ul>
              {team.members.map((member, index) => (
                <div className="SideBySide">
                  <div className="ChangeDisplay">
                    <li key={index}>
                      {team.display[member] || member}
                      {user === member && (
                        <button
                          onClick={() => handleChangeDisplay(member)}
                          style={{ marginLeft: 20, padding: 5 }}
                        >
                          Change Display Name
                        </button>
                      )}
                    </li>
                  </div>
                  <div className="ChangeDisplay">
                    {user === member && showDisplay === member && (
                      <input
                        style={{ marginRight: 10, marginTop: 5 }}
                        type="text"
                        placeholder="Change Display Name..."
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="DisplayBar"
                      />
                    )}
                    {user === member &&
                      showDisplay /*&& displayName !== ""*/ && (
                        <div className="SetButtons">
                          {
                            <button
                              className="SetDisplayName"
                              onClick={() => handleSetDisplay(member)}
                            >
                              Set
                            </button>
                          }
                          {
                            <button
                              className="SetResetName"
                              onClick={() => handleResetDisplay(member)}
                            >
                              Reset
                            </button>
                          }
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </ul>
          </div>

          <div className="SideBySide">
            <div
              className="AddMember"
              style={{ display: "flex", flexDirection: "column" }}
            >
              {user === team.owner && showSearch && (
                <input
                  style={{ marginRight: 10 }}
                  type="text"
                  placeholder="Search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="SearchBar"
                />
              )}
              {user === team.owner && showSearch && query !== "" && (
                <div className="Column">
                  {userList.map((username, index) => (
                    <div key={index} className="user-row">
                      {username}
                      <div style={{ display: "flex", gap: "2px" }}>
                        {!team.recipients.includes(username) &&
                        !team.members.includes(username) ? (
                          <button
                            className="Invite"
                            onClick={() => handleInvite(username)}
                          >
                            Invite
                          </button>
                        ) : null}
                        <button
                          className="Invite"
                          onClick={() => handleView(username)}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {showModal && (
            <div className="modal-overlay">
              <div className="modal" style={{ width: 300 }}>
                {showError1 && <p>All fields are required</p>}
                {showError2 && <p>{errorMsg}</p>}

                <div>Task name</div>
                <input
                  type="text"
                  placeholder="Name"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="TextFields"
                ></input>
                <div>Deadline</div>
                <input
                  className="TextFields"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                ></input>
                <button
                  style={{ marginBottom: 5 }}
                  onClick={() => {
                    handleCreate();
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setTaskName("");
                    setDeadline("");
                    setShowError1(false);
                    setShowError2(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {user !== team.owner && (
            <div className="AddMember">
              <button
                style={{ marginTop: 20, backgroundColor: "red" }}
                onClick={handleLeave}
              >
                Leave Team
              </button>
            </div>
          )}
          {user === team.owner && (
            <div className="DTButton">
              <button
                style={{ marginTop: 20, backgroundColor: "red" }}
                onClick={handleOpenConfirm}
              >
                Delete Team
              </button>
            </div>
          )}
          {user === team.owner && showConfirm && (
            <div className="DTText">
              <p style={{ marginTop: 20 }}>
                Are you sure? Team will be deleted for all members.
              </p>
              <div>
                <button
                  style={{ marginLeft: 10, backgroundColor: "red" }}
                  onClick={handleDelete}
                >
                  Confirm
                </button>
                <button
                  style={{ marginLeft: 10, marginTop: 10 }}
                  onClick={handleOpenConfirm}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        <div style={{ width: "80%" }}>
          <h2 className="Headers" style={{ marginTop: 10 }}>
            Tasks<button onClick={() => setShowModal(true)}>Create Task</button>
          </h2>
          <div
            className="Columns"
            style={{ marginTop: 10, backgroundColor: "lightgrey" }}
          >
            <h4>Mark as Complete</h4>
            <h3>Task</h3>
            <h3>Deadline</h3>
            <h3>Assigned to</h3>
            <h4>Options</h4>
          </div>
          {team.tasks && team.tasks.length === 0 ? (
            <h3 className="Columns">No tasks</h3>
          ) : null}
          <div>
            {team.tasks.map((task, index) => (
              <div key={index} className="Columns">
                <button
                  className="Invite"
                  style={{ margin: "auto" }}
                  onClick={() => handleComplete(task.taskName, user)}
                >
                  ✓
                </button>
                <h4>{task.taskName}</h4>
                <h4>{task.deadline}</h4>
                <h4>
                  {task.assignee !== ""
                    ? team.display[task.assignee] || task.assignee
                    : "Unassigned"}
                </h4>
                {user === team.owner && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    {task.assignee === "" && (
                      <button
                        className="Invite"
                        style={{ margin: "auto", width: 58, height: 30 }}
                        onClick={() => handleList(task.taskName)}
                      >
                        Assign
                      </button>
                    )}
                    {task.assignee !== "" && (
                      <button
                        className="Invite"
                        style={{ margin: "auto", width: 80, height: 30 }}
                        onClick={() =>
                          handleClaim(task.taskName, task.assignee)
                        }
                      >
                        Unnassign
                      </button>
                    )}
                    <button
                      className="Invite"
                      style={{ margin: "auto", backgroundColor: "red" }}
                      onClick={() => handleDeleteTask(task.taskName)}
                    >
                      Delete
                    </button>

                    <div
                      style={{
                        display: "flex",
                        gap: "5px",
                        justifyContent: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        className="Comment"
                        style={{ margin: "auto" }}
                        onClick={() => handleCommentTask(task.taskName)}
                      >
                        Comment
                      </button>
                      <button
                        className="SeeComments"
                        onClick={() => handleMenuClick(task.taskName)}
                      >
                        :
                      </button>
                    </div>

                    {activeComment === task.taskName && (
                      <div className="CommentInput">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write comment..."
                        />
                        <button
                          className="SaveComment"
                          onClick={() => handleSaveComment(task.taskName, user)}
                        >
                          Save
                        </button>
                      </div>
                    )}

                    {activeMenu === task.taskName && (
                      <div className="CommentBox">
                        {comments && comments.length > 0 ? (
                          comments
                            .filter((c) => c.taskName === task.taskName)
                            .map((comment, index) => (
                              <div key={index} className="CommentDisplay">
                                <div>{comment.text}</div>
                                <div>
                                  - {team.display[comment.user] || comment.user}{" "}
                                  -
                                </div>

                                {comment.user === user && (
                                  <button
                                    className="DeleteButton"
                                    onClick={() =>
                                      handleDeleteComment(task.taskName, index)
                                    }
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            ))
                        ) : (
                          <div>No comments yet</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "5px",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {user !== team.owner && task.assignee === "" && (
                    <button
                      className="Invite"
                      style={{ margin: "auto", width: 58, height: 30 }}
                      onClick={() => handleClaim(task.taskName, user)}
                    >
                      Claim
                    </button>
                  )}
                  {user !== team.owner && task.assignee === user && (
                    <button
                      className="Invite"
                      style={{ margin: "auto", width: 64, height: 30 }}
                      onClick={() => handleClaim(task.taskName, user)}
                    >
                      Unclaim
                    </button>
                  )}
                  {user !== team.owner && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "5px",
                          justifyContent: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          className="Comment"
                          style={{ margin: "auto" }}
                          onClick={() => handleCommentTask(task.taskName)}
                        >
                          Comment
                        </button>
                        <button
                          className="SeeComments"
                          onClick={() => handleMenuClick(task.taskName)}
                        >
                          :
                        </button>
                      </div>

                      {activeComment === task.taskName && (
                        <div className="CommentInput">
                          <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write comment..."
                          />
                          <button
                            className="SaveComment"
                            onClick={() =>
                              handleSaveComment(task.taskName, user)
                            }
                          >
                            Save
                          </button>
                        </div>
                      )}

                      {activeMenu === task.taskName && (
                        <div className="CommentBox">
                          {comments
                            .filter((c) => c.taskName === task.taskName)
                            .map((comment, index) => (
                              <div key={index} className="CommentDisplay">
                                <div>{comment.text}</div>
                                <div>
                                  - {team.display[comment.user] || comment.user}{" "}
                                  -
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {showList && currentOpen === task.taskName && (
                  <>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div>
                      {team.members.map((member, index) => (
                        <div key={index} className="Column">
                          <div className="user-row" style={{ width: 200 }}>
                            {team.display[member] || member}
                            <button
                              className="Invite"
                              style={{ width: 60 }}
                              onClick={() => {
                                handleClaim(task.taskName, member);
                                handleList(task.taskName);
                              }}
                            >
                              Choose
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
            <h2
              className="Headers"
              style={{ marginTop: 30, justifyContent: "left" }}
            >
              Completed
              <button
                style={{ marginLeft: 10, width: 30, height: 30, padding: 0 }}
                onClick={handleExpand}
              >
                {showCompleted === true ? "▲" : "▼"}
              </button>
            </h2>

            {showCompleted && (
              <>
                <div
                  className="Columns"
                  style={{ marginTop: 10, backgroundColor: "lightgrey" }}
                >
                  <h4>Mark incomplete</h4>
                  <h3>Task</h3>
                  <h3>Deadline</h3>
                  <h3>Completed by</h3>
                  <h4>Options</h4>
                </div>
                {team.completed && team.completed.length === 0 ? (
                  <h3 className="Columns">No completed tasks</h3>
                ) : null}
                {team.completed.map((completed, index) => (
                  <div key={index} className="Columns">
                    <button
                      className="Invite"
                      style={{
                        margin: "auto",
                        fontSize: 30,
                        width: 35,
                        paddingBottom: 5,
                      }}
                      onClick={() => handleReopen(completed.taskName, user)}
                    >
                      ↻
                    </button>
                    <h4>{completed.taskName}</h4>
                    <h4>{completed.deadline}</h4>
                    <h4>
                      {completed.assignee !== ""
                        ? team.display[completed.assignee] || completed.assignee
                        : "Unassigned"}
                    </h4>
                    <button
                      className="Invite"
                      style={{ margin: "auto", backgroundColor: "red" }}
                      onClick={() => handleDeleteCompleted(completed.taskName)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function SearchPage() {
  const navigate = useNavigate();
  const { user } = useGlobal();
  const [query, setQuery] = useState("");
  const [userList, setUserList] = useState([]);

  const handleView = (username) => {
    const camefrom = "gensearch";
    navigate(`/profile/${username}/from/${camefrom}`);
  };

  useEffect(() => {
    axios
      .post("http://127.0.0.1:5000/search", { query: query })
      .then((response) => {
        setUserList(response.data);
      });
  }, [query]);

  return (
    <div className="centered">
      <h2>Find users</h2>
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="SearchBar"
      />

      <div className="Column">
        {userList.map((username, index) => (
          <div key={index} className="user-row">
            {username}
            <div style={{ display: "flex" }}>
              <button className="Invite" onClick={() => handleView(username)}>
                View
              </button>
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

  const [profile, setProfile] = useState({
    username: usern,
    profile_picture: "",
    achievements: "",
  });

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:5000/getprof?usern=${usern}`)
      .then((response) => {
        setProfile({
          username: response.data.usern,
          profile_picture: response.data.pfp,
          achievements: response.data.achievements,
        });
      })
      .catch((error) => console.error("Error fetching team:", error));
  }, [usern]);

  // Convert camefrom to link, go back
  const handleBack = () => {
    if (camefrom === "gensearch") {
      navigate("/gensearch");
    } else {
      navigate(`/team/${camefrom}`);
    }
  };

  return (
    <div className="ProfileContainer">
      <h2 className="ProfileTitle">{profile.username}'s Profile</h2>
      <div className="ProfilePictureContainer">
        <img
          className="ProfilePicture"
          src={
            profile.profile_picture
              ? `/profile_pics/${profile.profile_picture}`
              : "/default-profile.png"
          }
          alt="Profile"
        />
      </div>

      <div className="Achievements">
        <h3>Achievements</h3>
        <p>{profile.achievements || "No achievements yet."}</p>
      </div>
      <button onClick={handleBack}>Back</button>
    </div>
  );
};

function taskTemplates() {}

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
    { name: "purple", value: "#c5bbde" },
  ];

  const openModal = () => {
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
  };
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
  };

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
      </div>

      <div></div>

      <div className="create-template">
        <button className="MakeTaskButton" onClick={openModal}>
          Create New Template
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create Template</h2>
            <input
              type="text"
              name="name"
              placeholder="Template Name"
              //value={editingTemplate ? editingTemplate.name : newTemplate.name}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, name: e.target.value })
              }
              className="TextFields"
              required
            />
            <input
              type="text"
              name="description"
              placeholder="Description (Optional)"
              //value={editingTemplate ? editingTemplate.description : newTemplate.description}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, description: e.target.value })
              }
              className="TextFields"
            />
            <input
              type="date"
              name="due_time"
              //value={editingTemplate ? editingTemplate.due_time : newTemplate.due_time}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, due_time: e.target.value })
              }
              className="TextFields"
              required
            />
            {/* Added start_date input */}
            <input
              type="date"
              name="start_date"
              //value={editingTemplate ? editingTemplate.start_date : newTemplate.start_date}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, start_date: e.target.value })
              }
              className="TextFields"
            />
            <select
              name="priority"
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, priority: e.target.value })
              }
              className="TextFields"
              //value={editingTemplate ? editingTemplate.priority : newTemplate.priority}
            >
              <option value="Low">Low</option>
              <option value="Medium" selected>
                Medium
              </option>
              <option value="High">High</option>
            </select>

            <select
              name="color_tag"
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, color_tag: e.target.value })
              }
              className="TextFields"
              //value={editingTemplate ? editingTemplate.color_tag : newTemplate.color_tag}
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
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, status: e.target.value })
              }
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
  );
}


function rollOver() {
  //for rolling over
  // const[originalRollColors, setOriginalRollColors] = useState(new Map());
  // const isOverdue = (deadline) => {
  //   const now = new Date();
  //   const due = new Date(deadline);
  //   return now > due;
  // }
  // const handleRollOver = (taskId) => {
  //   setTasks((prevTasks) =>
  //     prevTasks.map((task) => {
  //       if (task.id === taskId) {
  //         if (!originalRollColors.has(taskId)) {
  //           setOriginalRollColors((prev) => prev.set(task.id, task.color_tag));
  //           return {
  //             ...task,
  //             color_tag: "#FFE5E5",
  //           };
  //         } else {
  //           const originalColor = originalRollColors.get(task.id);
  //           return {
  //             ...task,
  //             color_tag: originalColor,
  //           };
  //         }
  //       }
  //       return task;
  //     })
  //   );
  // }
  // const overDue = isOverdue(task.deadline)
  // return (
  //   <div>
  //     {/* {overdue && (
  //       <button onClick={handleRollOver}>Roll Over</button>
  //     )} */}
  //   </div>
  // )
}

function ArchivePage() {
  return (
    <div>
      <h1>Archived Tasks</h1>
      {/*
      {archivedTasks.length === 0 ? (
        <p>No tasks archived.</p>
      ) : (
        <div className="TaskList">
          {archivedTasks.map((task) => (
            <div key={task.id} className="TaskRow">
              <div className="TaskCell">{task.name}</div>
              <div className="TaskCell">{task.status}</div>
              <div className="TaskCell">{task.priority}</div>
              <div className="TaskCell">{task.due_time}</div>
            </div>
          ))}
        </div>
      )}
      */}
    </div>
  );
}

function App() {
  return (
    <Router>
      <GlobalProvider>
        <NavBar />

        <div>
          <DisplayUsername />
        </div>
        <Routes>
          <Route path="/" element={<TaskPage />} />
          <Route path="/createaccount" element={<CreateAccountPage />} />
          <Route path="/login" element={<LogInPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/profile/:usern/from/:camefrom"
            element={<ViewProfile />}
          />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/streak" element={<StreakTracker />} />
          <Route path="/weeklysummary" element={<WeeklySummaryPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/team/:teamID" element={<TeamPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/gensearch" element={<SearchPage />} />
          <Route path="/dependencies" element={<TaskDependenciesPage />} />
          <Route path="/productivity" element={<ProductivityPage />} />
        </Routes>
      </GlobalProvider>
    </Router>
  );
}

export default App;
