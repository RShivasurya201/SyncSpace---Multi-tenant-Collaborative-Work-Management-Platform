import { useState, useEffect } from "react";

import {
  FaTimes,
  FaInfoCircle,
  FaCommentDots,
  FaHistory,
  FaPaperPlane,
  FaUserCircle,
  FaClock,
  FaFlag,
  FaTasks,
  FaPaperclip,
  FaLock,
  FaLockOpen,
} from "react-icons/fa";
import { getTask, addComment, assignTask, toggleTaskBlocked } from "../api/tasks";
import { getActivity } from "../api/activity";
import AssignMemberModal from "./AssignMemberModal";

function TaskModal({ taskId, onClose }) {
  const [activeTab, setActiveTab] = useState("info");
  const [task, setTask] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningTask, setAssigningTask] = useState(false);
  const [blockingTask, setBlockingTask] = useState(false);

  useEffect(() => {
    if (!taskId) return;

    async function fetchTaskData() {
      try {
        setLoading(true);
        setError(null);
        const taskData = await getTask(taskId);
        setTask(taskData);
      } catch (err) {
        console.error("Failed to fetch task:", err);
        setError("Failed to load task details");
      } finally {
        setLoading(false);
      }
    }

    fetchTaskData();
  }, [taskId]);

  useEffect(() => {
    if (!task?.project) return;

    async function fetchActivities() {
      try {
        const activities = await getActivity(task.project);
        const taskActivities = activities.filter((a) => a.entityId === taskId);
        setActivities(taskActivities);
      } catch (err) {
        console.error("Failed to fetch activities:", err);
      }
    }

    fetchActivities();
  }, [task, taskId]);

  async function handleAddComment() {
    if (!commentText.trim() || !taskId) return;

    try {
      setPostingComment(true);
      const updatedTask = await addComment(taskId, commentText.trim());
      setTask(updatedTask);
      setCommentText("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setPostingComment(false);
    }
  }

  const handleCommentKeyPress = (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleAddComment();
    }
  };

  async function handleAssignMember(userId, memberName) {
    if (!taskId) return;

    try {
      setAssigningTask(true);
      const updatedTask = await assignTask(taskId, userId);
      setTask(updatedTask);
      setShowAssignModal(false);
    } catch (err) {
      console.error("Failed to assign task:", err);
    } finally {
      setAssigningTask(false);
    }
  }

  async function handleToggleBlocked() {
    if (!taskId) return;

    try {
      setBlockingTask(true);
      const updatedTask = await toggleTaskBlocked(taskId);
      setTask(updatedTask);
    } catch (err) {
      console.error("Failed to toggle blocked status:", err);
    } finally {
      setBlockingTask(false);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getTimeAgo(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  if (loading) {
    return (
      <div className="task-modal-overlay">
        <div className="task-modal-panel">
          <div className="task-modal-header">
            <h2>Loading...</h2>
            <button className="task-close" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="task-modal-overlay">
        <div className="task-modal-panel">
          <div className="task-modal-header">
            <h2>Error</h2>
            <button className="task-close" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
          <div className="task-content">
            <p>{error || "Task not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="task-modal-header">
          <div>
            <h2>{task.title}</h2>
            <div className="task-modal-status">
              <span className="task-priority">
                {task.priority || "MEDIUM"}
              </span>
              <span className="task-state">
                {task.status || "BACKLOG"}
              </span>
            </div>
          </div>
          <button
            className="task-close"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>

        {/* TABS */}
        <div className="task-tabs">
          <button
            className={
              activeTab === "info"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("info")
            }
          >
            <FaInfoCircle />
          </button>
          <button
            className={
              activeTab === "comments"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("comments")
            }
          >
            <FaCommentDots />
          </button>
          <button
            className={
              activeTab === "activity"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("activity")
            }
          >
            <FaHistory />
          </button>
        </div>

        {/* INFO */}
        {activeTab === "info" && (
          <div className="task-content">
            <div className="task-section">
              <h4>Description</h4>
              <p>
                {task.description || "No description provided"}
              </p>
            </div>

            <div className="task-detail">
              <FaUserCircle />
              <div>
                <span>Assigned To</span>
                <div className="task-assigned-section">
                  <strong>
                    {task.assignedTo?.name || "Unassigned"}
                  </strong>
                  <button
                    className="assign-btn"
                    onClick={() => setShowAssignModal(true)}
                    disabled={assigningTask}
                  >
                    {task.assignedTo ? "Change" : "Assign"}
                  </button>
                </div>
              </div>
            </div>

            <div className="task-detail">
              <FaClock />
              <div>
                <span>Due Date</span>
                <strong>
                  {formatDate(task.dueDate)}
                </strong>
              </div>
            </div>

            <div className="task-detail">
              <FaFlag />
              <div>
                <span>Priority</span>
                <strong>
                  {task.priority || "MEDIUM"}
                </strong>
              </div>
            </div>

            <div className="task-action-buttons">
              <button
                className={`task-action-btn ${
                  task.isBlocked ? "unblock-btn" : "block-btn"
                }`}
                onClick={handleToggleBlocked}
                disabled={blockingTask}
              >
                {task.isBlocked ? (
                  <>
                    <FaLockOpen /> Unblock Task
                  </>
                ) : (
                  <>
                    <FaLock /> Block Task
                  </>
                )}
              </button>
            </div>

            {task.isBlocked && (
              <div className="task-detail">
                <span style={{ color: "#ff4444" }}>⚠️ Blocked</span>
                <div>
                  <p>{task.blockerSummary || "Task is blocked"}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMMENTS */}
        {activeTab === "comments" && (
          <div className="task-content">
            {task.comments && task.comments.length > 0 ? (
              task.comments.map((comment, index) => (
                <div key={index} className="comment">
                  <div className="comment-avatar">
                    {comment.user?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <strong>
                      {comment.user?.name || "Unknown"}
                    </strong>
                    <p>{comment.text}</p>
                    <span>
                      {getTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p>No comments yet</p>
            )}

            <div className="comment-input">
              <input
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={handleCommentKeyPress}
              />
              <button
                onClick={handleAddComment}
                disabled={postingComment || !commentText.trim()}
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        )}

        {/* ACTIVITY */}
        {activeTab === "activity" && (
          <div className="task-content">
            {activities && activities.length > 0 ? (
              activities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <strong>
                    {activity.action?.replace(/_/g, " ") || "Activity"}
                  </strong>
                  <span>
                    {formatDate(activity.createdAt)}
                  </span>
                </div>
              ))
            ) : (
              <p>No activity recorded</p>
            )}
          </div>
        )}
      </div>

      {showAssignModal && (
        <AssignMemberModal
          onClose={() => setShowAssignModal(false)}
          onSelectMember={handleAssignMember}
          isLoading={assigningTask}
        />
      )}
    </div>
  );
}

export default TaskModal;