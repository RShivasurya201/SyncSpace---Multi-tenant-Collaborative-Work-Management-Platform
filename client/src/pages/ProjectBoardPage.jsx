import "../styles/projectBoard.css";
import "../styles/projects.css";

import {
  FaPlus,
  FaCalendarAlt,
  FaExclamationCircle,
  FaCheckCircle,
  FaTasks,
  FaClock,
  FaBan,
  FaUserCircle,
  FaPencilAlt,
  FaTrash,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProjects } from "../api/projects";
import {
  getTasks,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
} from "../api/tasks";
import TaskModal from "../components/TaskModal";
import PageLoader from "../components/PageLoader";
import { hasCurrentPermission } from "../utils/authStorage";

const initialColumns = [
  { title: "To Do", color: "todo", status: "BACKLOG", tasks: [] },
  { title: "In Progress", color: "progress", status: "IN_PROGRESS", tasks: [] },
  { title: "Review", color: "review", status: "REVIEW", tasks: [] },
  { title: "Done", color: "done", status: "DONE", tasks: [] },
];

function formatDueDate(dueDate, status) {
  if (!dueDate) {
    return status === "DONE" ? "Done" : "TBD";
  }

  const date = new Date(dueDate);
  if (isNaN(date.getTime())) return dueDate;

  if (status === "DONE") return "Done";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function mapTaskToCard(task) {
  const assignedTo = task.assignedTo;
  const assignee = assignedTo?.name || (typeof assignedTo === "string" ? assignedTo : "Unassigned");

  return {
    _id: task._id,
    title: task.title || "Untitled",
    description: task.description || "",
    priority: task.priority || "MEDIUM",
    assignee,
    due: formatDueDate(task.dueDate, task.status),
    blocked: Boolean(task.isBlocked),
    ai: task.blockerSummary || "Blocked by external dependency.",
    status: task.status || "BACKLOG",
  };
}

export default function ProjectBoardPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [columns, setColumns] = useState(initialColumns);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const canCreateTasks = hasCurrentPermission("CREATE_TASK");
  const canUpdateTasks = hasCurrentPermission("UPDATE_TASK");
  const canDeleteTasks = hasCurrentPermission("MANAGE_PROJECT");
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState("MEDIUM");
  const [updatingTask, setUpdatingTask] = useState(false);
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [deletingTask, setDeletingTask] = useState(null);
  const [deletingTaskInProgress, setDeletingTaskInProgress] = useState(false);

  async function loadProjectBoard() {
    setLoading(true);

    if (!projectId) {
      setProject(null);
      setColumns(initialColumns);
      setLoading(false);
      return;
    }

    try {
      const [projects, tasks] = await Promise.all([getProjects(), getTasks(projectId)]);

      const foundProject = Array.isArray(projects)
        ? projects.find((p) => p._id === projectId || p.id === projectId)
        : null;

      setProject(foundProject || null);

      const taskCards = Array.isArray(tasks) ? tasks.map(mapTaskToCard) : [];

      const grouped = initialColumns.map((column) => ({
        ...column,
        tasks: taskCards.filter((task) => task.status === column.status),
      }));

      setColumns(grouped);
    } catch (error) {
      console.error("Failed to load project board", error);
      setProject(null);
      setColumns(initialColumns);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjectBoard();
  }, [projectId]);

  async function travelToDate(asOf) {
    if (!projectId) return;
    try {
      setLoading(true);
      const { getProjectSnapshot } = await import("../api/projects");
      const resp = await getProjectSnapshot(projectId, asOf);
      // resp.tasks or resp.tasks array
      const taskCards = Array.isArray(resp.tasks) ? resp.tasks.map(mapTaskToCard) : [];

      const grouped = initialColumns.map((column) => ({
        ...column,
        tasks: taskCards.filter((task) => task.status === column.status),
      }));

      setColumns(grouped);
      setShowCalendar(false);
    } catch (error) {
      console.error("Time travel failed", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <PageLoader message="Loading project board..." />;
  }

  function openAddModal() {
    if (!projectId) return;
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
    setTaskTitle("");
    setTaskDescription("");
    setTaskDueDate("");
  }

  function openEditTaskModal(task) {
    setEditingTask(task);
    setEditTaskTitle(task.title || "");
    setEditTaskDescription(task.description || "");
    setEditTaskPriority(task.priority || "MEDIUM");
    setShowEditTaskModal(true);
  }

  function closeEditTaskModal() {
    setShowEditTaskModal(false);
    setEditingTask(null);
    setEditTaskTitle("");
    setEditTaskDescription("");
    setEditTaskPriority("MEDIUM");
  }

  async function handleUpdateTask(event) {
    event.preventDefault();
    if (!editingTask || !editTaskTitle.trim()) return;

    setUpdatingTask(true);
    try {
      await updateTask(editingTask._id, {
        title: editTaskTitle.trim(),
        description: editTaskDescription,
        priority: editTaskPriority,
      });
      closeEditTaskModal();
      await loadProjectBoard();
    } catch (error) {
      console.error("Failed to update task", error);
    } finally {
      setUpdatingTask(false);
    }
  }

  function openDeleteTaskModal(task) {
    setDeletingTask(task);
    setShowDeleteTaskModal(true);
  }

  function closeDeleteTaskModal() {
    setShowDeleteTaskModal(false);
    setDeletingTask(null);
  }

  async function handleDeleteTask() {
    if (!deletingTask) return;

    setDeletingTaskInProgress(true);
    try {
      await deleteTask(deletingTask._id);
      closeDeleteTaskModal();
      await loadProjectBoard();
    } catch (error) {
      console.error("Failed to delete task", error);
    } finally {
      setDeletingTaskInProgress(false);
    }
  }

  async function handleAddTask(event) {
    event.preventDefault();
    if (!projectId || !taskTitle.trim()) return;

    setCreating(true);
    try {
      await createTask(projectId, {
        title: taskTitle.trim(),
        description: taskDescription,
        dueDate: taskDueDate || undefined,
      });

      closeAddModal();
      await loadProjectBoard();
    } catch (error) {
      console.error("Failed to add task", error);
    } finally {
      setCreating(false);
    }
  }

  function handleDragOver(e, columnTitle) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    console.log("drag over column", columnTitle);
  }

  function handleTaskDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function clearDragState() {
    setDraggingTaskId(null);
    setIsDragging(false);
    document.querySelectorAll(".kanban-column.drop-target").forEach((el) => {
      el.classList.remove("drop-target");
    });
  }

  function handleDragEnter(e, columnTitle) {
    e.preventDefault();
    console.log("drag enter column", columnTitle);
    e.currentTarget.classList.add("drop-target");
  }

  function handleDragLeave(e, columnTitle) {
    console.log("drag leave column", columnTitle);
    e.currentTarget.classList.remove("drop-target");
  }

  async function handleDrop(e, toStatus) {
    e.preventDefault();
    clearDragState();
    console.log("drop on status", toStatus);
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;

    // find source column and task
    const sourceIdx = columns.findIndex((col) => col.tasks.some((t) => t._id === taskId));
    const destIdx = columns.findIndex((col) => col.status === toStatus);
    if (sourceIdx === -1 || destIdx === -1) return;

    const task = columns[sourceIdx].tasks.find((t) => t._id === taskId);
    if (!task) return;
    if (task.status === toStatus) return;

    // Optimistic UI update
    const newColumns = columns.map((col, idx) => {
      if (idx === sourceIdx) {
        return { ...col, tasks: col.tasks.filter((t) => t._id !== taskId) };
      }
      if (idx === destIdx) {
        const moved = { ...task, status: toStatus };
        return { ...col, tasks: [...col.tasks, moved] };
      }
      return col;
    });

    setColumns(newColumns);

    try {
      await updateTaskStatus(taskId, toStatus);
    } catch (err) {
      console.error("Failed to update task status", err);
      // Revert on error by reloading board
      await loadProjectBoard();
    }
  }

  return (
    <div className="board-page">

      {/* HEADER */}

      <div className="board-header">

        <div>

          <h1>{project?.name || "Project Board"}</h1>

          <p>{project?.description || "Project details will appear here once a project is selected."}</p>

          {/* <div className="project-progress">

  <div className="project-progress-top">

    <span>

      68% Complete

    </span>

    <span>

      16 / 24 Tasks

    </span>

  </div>

  <div className="project-progress-bar">

    <div
      className="project-progress-fill"
      style={{
        width: "68%",
      }}
    />

  </div>

</div> */}

        </div>

        {canCreateTasks && (
          <button className="add-task-btn" onClick={openAddModal}>
            <FaPlus />
            Add Task
          </button>
        )}
        
        <button onClick={() => setShowCalendar((s) => !s)} className="time-travel-btn" title="Time Travel">
          <FaCalendarAlt />
        </button>

      </div>

      {showAddModal && (
        <div className="project-modal-overlay" onClick={closeAddModal}>
          <form className="project-modal" onSubmit={handleAddTask} onClick={(e) => e.stopPropagation()}>
            <h3>Add Task</h3>

            <div className="project-modal-field">
              <label>Title</label>
              <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
            </div>

            <div className="project-modal-field">
              <label>Description</label>
              <textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} rows={4} />
            </div>

            <div className="project-modal-field">
              <label>Due Date</label>
              <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
            </div>

            <div className="project-modal-actions">
              <button type="button" className="project-modal-btn project-modal-btn--secondary" onClick={closeAddModal}>
                Cancel
              </button>
              <button type="submit" className="project-modal-btn project-modal-btn--primary" disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showCalendar && (
        <div className="project-modal-overlay" onClick={() => setShowCalendar(false)}>
          <div className="project-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Time Travel</h3>

            <div className="project-modal-field">
              <label>Select date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={project?.createdAt ? new Date(project.createdAt).toISOString().slice(0, 10) : undefined}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>

            <div className="project-modal-actions">
              <button className="project-modal-btn project-modal-btn--secondary" onClick={() => { setShowCalendar(false); setSelectedDate(""); }}>
                Cancel
              </button>
              <button
                className="project-modal-btn project-modal-btn--primary"
                onClick={() => travelToDate(selectedDate ? new Date(selectedDate).toISOString() : undefined)}
                disabled={!selectedDate}
              >
                Travel
              </button>
              <button
                className="project-modal-btn"
                onClick={() => { setSelectedDate(""); travelToDate(); }}
              >
                Now
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditTaskModal && (
        <div className="project-modal-overlay" onClick={closeEditTaskModal}>
          <form className="project-modal" onSubmit={handleUpdateTask} onClick={(e) => e.stopPropagation()}>
            <h3>Edit Task</h3>

            <div className="project-modal-field">
              <label>Title</label>
              <input value={editTaskTitle} onChange={(e) => setEditTaskTitle(e.target.value)} required />
            </div>

            <div className="project-modal-field">
              <label>Description</label>
              <textarea value={editTaskDescription} onChange={(e) => setEditTaskDescription(e.target.value)} rows={4} />
            </div>

            <div className="project-modal-field">
              <label>Priority</label>
              <select value={editTaskPriority} onChange={(e) => setEditTaskPriority(e.target.value)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="project-modal-actions">
              <button type="button" className="project-modal-btn project-modal-btn--secondary" onClick={closeEditTaskModal}>Cancel</button>
              <button type="submit" className="project-modal-btn project-modal-btn--primary" disabled={updatingTask}>{updatingTask ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </div>
      )}

      {showDeleteTaskModal && deletingTask && (
        <div className="project-modal-overlay" onClick={closeDeleteTaskModal}>
          <div className="project-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Task</h3>
            <p className="project-modal-message">
              Are you sure you want to delete the task <strong>{deletingTask.title}</strong>?
            </p>
            <div className="project-modal-actions">
              <button type="button" className="project-modal-btn project-modal-btn--secondary" onClick={closeDeleteTaskModal}>Cancel</button>
              <button type="button" className="project-modal-btn project-modal-btn--danger" onClick={handleDeleteTask} disabled={deletingTaskInProgress}>{deletingTaskInProgress ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}

      {/* KPI */}

      {/* <div className="board-kpis">

        <div>

          <span>

            <FaTasks />

            Tasks

          </span>

          <strong>24</strong>

        </div>

        <div>

          <span>

            <FaCheckCircle />

            Completed

          </span>

          <strong>14</strong>

        </div>

        <div>

          <span>

            <FaBan />

            Blocked

          </span>

          <strong>3</strong>

        </div>

        <div>

          <span>

            <FaClock />

            Due Soon

          </span>

          <strong>5</strong>

        </div>

      </div> */}

      {/* BOARD */}

      <div className="kanban-board">

        {columns.map((column) => (

          <div
            className="kanban-column"
            key={column.title}
            onDragOver={(e) => handleDragOver(e, column.title)}
            onDragEnter={(e) => handleDragEnter(e, column.title)}
            onDragLeave={(e) => handleDragLeave(e, column.title)}
            onDrop={(e) => handleDrop(e, column.status)}
          >

            <div className="column-header">

              <div className="column-title">

                <div className={`column-dot ${column.color}`} />

                <h3>{column.title}</h3>

              </div>
{/* 
              <button>

                <FaPlus />

              </button> */}

            </div>

            {/* <span className="column-count">

              {column.tasks.length} Open

            </span> */}

            {column.tasks.map((task) => (

              <div
                className={`task-card ${
                  task.blocked ? "blocked-card" : ""
                } ${draggingTaskId === task._id ? "dragging" : ""}`}
                key={task._id}
                onClick={(e) => {
                  if (!isDragging) {
                    setSelectedTaskId(task._id);
                  }
                }}
                draggable="true"
                data-taskid={task._id}
                onDragStart={(e) => {
                  console.log("Drag start for task:", task._id);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", task._id);
                  setDraggingTaskId(task._id);
                  setIsDragging(true);
                }}
                onDragEnd={(e) => {
                  console.log("Drag end");
                  clearDragState();
                }}
                onDragOver={handleTaskDragOver}
                onDrop={(e) => handleDrop(e, column.status)}
              >

                {(canUpdateTasks || canDeleteTasks) && (
                  <div className="task-card-actions">
                    {canUpdateTasks && (
                      <button
                        type="button"
                        className="task-action-btn"
                        aria-label="Edit task"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditTaskModal(task);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <FaPencilAlt />
                      </button>
                    )}
                    {canDeleteTasks && (
                      <button
                        type="button"
                        className="task-action-btn"
                        aria-label="Delete task"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteTaskModal(task);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                )}

                <h4>{task.title}</h4>

                <div
                  className={`priority ${task.priority.toLowerCase()}`}
                >
                  {task.priority}
                </div>

                <div className="task-meta">

                  <div className="task-user">

                    <div className="avatar-circle">

                      {task.assignee?.charAt(0) || "?"}

                    </div>

                    {task.assignee}

                  </div>

                  <div className="due-pill">

                    {task.due}

                  </div>

                </div>

                {task.blocked && (

                  <>

                    <div className="blocked">

                      <FaExclamationCircle />

                      Blocked

                    </div>

                    <div className="ai-preview">

                      {task.ai}

                    </div>

                  </>

                )}

                {!task.blocked && task.due === "Done" && (

                  <div className="done">

                    <FaCheckCircle />

                    Completed

                  </div>

                )}

              </div>

            ))}

          </div>

        ))}

      </div>

      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

    </div>
  );
}