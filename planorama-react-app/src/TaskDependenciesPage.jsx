import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaTrash } from 'react-icons/fa';
import { ReactFlowProvider, useNodesState, useEdgesState } from 'reactflow';
import ReactFlow from 'reactflow';
import { Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';

function TaskDependenciesPage() {
  const [tasks, setTasks] = useState([]);
  const [taskMap, setTaskMap] = useState({});
  const [showDropdownTask, setShowDropdownTask] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [collapsedTasks, setCollapsedTasks] = useState({});

  

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = () => {
    axios.get("http://127.0.0.1:5000/tasks").then(res => {
      setTasks(res.data);
      const map = {};
      const collapsedMap = {};
      res.data.forEach(task => {
        map[task.id] = task;
        collapsedMap[task.id] = true;
      });
      setTaskMap(map);
      setCollapsedTasks(collapsedMap);
      updateGraph(res.data);
    });
  };

  const updateGraph = (taskList) => {
    const taskMap = {};
    taskList.forEach(task => taskMap[task.id] = task);

    const levels = {};
    const forwardMap = {};
    taskList.forEach(task => {
      task.dependencies.forEach(depId => {
        if (!forwardMap[depId]) forwardMap[depId] = [];
        forwardMap[depId].push(task.id);
      });
    });

    // Include all tasks in the level map initially
    taskList.forEach(task => {
      if (!(task.id in levels)) {
        levels[task.id] = 0;
      }
    });

    const queue = taskList.map(task => ({ id: task.id, level: levels[task.id] }));
    while (queue.length > 0) {
      const { id, level } = queue.shift();
      levels[id] = Math.max(levels[id] || 0, level);
      (forwardMap[id] || []).forEach(childId => {
        queue.push({ id: childId, level: level + 1 });
      });
    }

    const xPositions = {};
    const occupied = new Set();
    const xSpacing = 250;
    const ySpacing = 120;
    let currentX = 0;

    const sortedTaskIds = Object.keys(levels)
      .map(id => parseInt(id))
      .sort((a, b) => levels[a] - levels[b]);

      sortedTaskIds.forEach(taskId => {
        const task = taskMap[taskId];
        const deps = task.dependencies;
      
        if (deps.length > 0) {
          const avgX = deps
            .map(depId => xPositions[depId])
            .filter(x => x !== undefined);
      
          if (avgX.length > 0) {
            const x = Math.round(avgX.reduce((a, b) => a + b, 0) / avgX.length);
            let adjustedX = x;
      
            while (occupied.has(`${levels[taskId]}-${adjustedX}`)) {
              adjustedX++;
            }
      
            xPositions[taskId] = adjustedX;
            occupied.add(`${levels[taskId]}-${adjustedX}`);
          } else {
            // Fallback if dependencies aren't placed yet
            while (occupied.has(`${levels[taskId]}-${currentX}`)) {
              currentX++;
            }
      
            xPositions[taskId] = currentX;
            occupied.add(`${levels[taskId]}-${currentX}`);
          }
        } else {
          // No dependencies
          while (occupied.has(`${levels[taskId]}-${currentX}`)) {
            currentX++;
          }
      
          xPositions[taskId] = currentX;
          occupied.add(`${levels[taskId]}-${currentX}`);
        }
      });

    const nodeList = sortedTaskIds.map(taskId => {
      const task = taskMap[taskId];
      return {
        id: task.id.toString(),
        data: { label: task.name },
        position: {
          x: xPositions[task.id] * xSpacing,
          y: levels[task.id] * ySpacing
        },
        style: {
          borderRadius: 10,
          padding: 10,
          background: task.color_tag || '#ffffff',
          border: '1px solid black',
          textDecoration: task.status === "Completed" ? 'line-through' : 'none'
        },
        draggable: false
      };
    });

    const edgeList = [];
    taskList.forEach(task => {
      task.dependencies.forEach(depId => {
        edgeList.push({
          id: `e${depId}-${task.id}`,
          source: depId.toString(),
          target: task.id.toString(),
          animated: false,
          type: 'default',
          style: { stroke: 'black' },
          markerEnd: { type: 'arrowclosed', color: 'black' }
        });
      });
    });

    setNodes(nodeList);
    setEdges(edgeList);
  };
  
  
  
  const toggleCollapse = (parentId, taskId) => {
    const key = `${parentId || 'root'}-${taskId}`;
    setCollapsedTasks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isTaskReachableFrom = (targetId, currentId, visited = new Set()) => {
    if (visited.has(currentId)) return false;
    visited.add(currentId);
    const deps = taskMap[currentId]?.dependencies || [];
    if (deps.includes(targetId)) return true;
    return deps.some(dep => isTaskReachableFrom(targetId, dep, visited));
  };

  const getAllDependencies = (taskId, visited = new Set()) => {
    if (!taskMap[taskId] || visited.has(taskId)) return [];
    visited.add(taskId);
    let deps = [...taskMap[taskId].dependencies];
    for (const depId of taskMap[taskId].dependencies) {
      deps = deps.concat(getAllDependencies(depId, visited));
    }
    return [...new Set(deps)];
  };

  const addDependency = (taskId, dependencyId) => {
    const task = taskMap[taskId];
    const allDeps = getAllDependencies(taskId, new Set());
    if (allDeps.includes(dependencyId) || taskId === dependencyId) {
      setErrorMessage("This task is already a dependency or circular.");
      return;
    }
    if (task.status === "Completed") {
      setErrorMessage("Cannot add a dependency to a completed task.");
      return;
    }

    const updatedDeps = [...task.dependencies, dependencyId];
    axios.put(`http://127.0.0.1:5000/tasks/${taskId}`, {
      username: task.username,
      name: task.name,
      description: task.description,
      due_time: task.due_time,
      priority: task.priority,
      color_tag: task.color_tag,
      status: task.status,
      subtasks: task.subtasks,
      start_date: task.start_date,
      time_logs: task.time_logs,
      order_index: task.order_index,
      dependencies: updatedDeps,
    }).then(() => {
      fetchTasks();
      setShowDropdownTask(null);
      setErrorMessage("");
    }).catch(err => {
      setErrorMessage(err.response?.data?.error || "Failed to add dependency.");
    });
  };

  const removeDependency = (taskId, dependencyId) => {
    const task = taskMap[taskId];
    if (!task) return;

    const updatedDeps = task.dependencies.filter(id => id !== dependencyId);
    axios.put(`http://127.0.0.1:5000/tasks/${taskId}`, {
      username: task.username,
      name: task.name,
      description: task.description,
      due_time: task.due_time,
      priority: task.priority,
      color_tag: task.color_tag,
      status: task.status,
      subtasks: task.subtasks,
      start_date: task.start_date,
      time_logs: task.time_logs,
      order_index: task.order_index,
      dependencies: updatedDeps,
    }).then(() => {
      fetchTasks();
    }).catch(err => {
      console.error("Remove dependency failed", err);
      setErrorMessage(err.response?.data?.error || "Failed to remove dependency.");
    });
  };

  
  const renderDependencies = (taskId, level = '', visited = new Set(), parentId = null, depth = 0, isTopLevel = false) => {
    const task = taskMap[taskId];
    if (!task || visited.has(taskId)) return null;
    const newVisited = new Set(visited);
    newVisited.add(taskId);
  
    const hasDependencies = task.dependencies.length > 0;
    const key = `${parentId || 'root'}-${taskId}`;
    const isCollapsed = collapsedTasks[key] ?? true;
  
    return (
      <div style={{ paddingLeft: `${level.split('.').length * 20}px`, marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', cursor: hasDependencies ? 'pointer' : 'default' }}>
          {hasDependencies && (
            <span onClick={() => toggleCollapse(parentId, taskId)} style={{ marginRight: 5 }}>
              {isCollapsed ? '▶' : '▼'}
            </span>
          )}
          <span>{level} {task.name}</span>
  
          {/* Delete button ONLY for first-degree dependencies */}
          {parentId && depth === 1 && (
            <button
              onClick={() => removeDependency(parentId, taskId)}
              style={{ marginLeft: '10px', background: 'transparent', border: 'none', cursor: 'pointer' }}
              title="Remove Dependency"
            >
              <FaTrash color="red" />
            </button>
          )}
        </div>
  
        {/* Collapsible dependencies */}
        {!isCollapsed && task.dependencies.map((depId, index) => (
          <div key={`${taskId}-${depId}`}>
            {renderDependencies(depId, `${level}${index + 1}.`, newVisited, taskId, depth + 1, false)}
          </div>
        ))}
  
        {/* "+ Add" button ONLY for top-level tasks */}
        {isTopLevel && (
          <div style={{ paddingLeft: '20px' }}>
            {showDropdownTask === taskId ? (
              <select
                onChange={(e) => addDependency(taskId, parseInt(e.target.value))}
                onBlur={() => setShowDropdownTask(null)}
                defaultValue=""
              >
                <option value="" disabled>Select task...</option>
                {tasks
                    .filter(t => {
                        // prevent: self-reference or circularity
                        return (
                        t.id !== taskId &&
                        !getAllDependencies(taskId, new Set()).includes(t.id) &&
                        !isTaskReachableFrom(taskId, t.id) // prevent reverse cycle
                        );
                    })
                    .map(t => (
                        <option key={t.id} value={t.id}>
                        {t.name} - [{new Date(t.due_time).toLocaleDateString('en-US')}]
                        </option>
                    ))}

              </select>
            ) : (
              <button
                onClick={() => setShowDropdownTask(taskId)}
                style={{ marginTop: '5px' }}
              >
                + Add
              </button>
            )}
          </div>
        )}
      </div>
    );
  };
  
  

  return (
    <div style={{ padding: '40px' }}>
      <h1>Task Dependencies Outline</h1>
      {errorMessage && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px', marginBottom: '15px', border: '1px solid #f5c6cb', position: 'relative' }}>
          {errorMessage}
          <button
            onClick={() => setErrorMessage("")}
            style={{ position: 'absolute', right: '10px', top: '5px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ×
          </button>
        </div>
      )}
      <div style={{ display: 'flex', gap: '40px' }}>
        <div style={{ flex: 1 }}>
          {tasks.map((task, idx) => (
            <div key={task.id}>{renderDependencies(task.id, `${idx + 1}.`, new Set(), null, 0, true)}</div>
          ))}
        </div>

        <div style={{ 
            flex: 2, 
            height: '600px', 
            border: '1px solid #ccc', 
            borderRadius: '12px', 
            padding: '10px', 
            overflow: 'auto' // makes the container scrollable
        }}>
          <h2 style={{ textAlign: 'center' }}>Dependency Flow Graph</h2>
          <ReactFlowProvider>
          <div style={{ width: '100%', height: '90%' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={() => {}}
              onEdgesChange={() => {}}
              fitView
              zoomOnScroll={false}
              zoomOnPinch={false}
              zoomOnDoubleClick={false}
              panOnScroll={true}
              panOnDrag={true}
              nodesDraggable={false}
              nodesConnectable={false}
              edgesUpdatable={false}
              fitViewOptions={{ padding: 0.2 }}
            >
            <Controls showZoom={true} showFitView={true} />
            <Background />
            </ReactFlow>
            </div>
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}

export default TaskDependenciesPage;
