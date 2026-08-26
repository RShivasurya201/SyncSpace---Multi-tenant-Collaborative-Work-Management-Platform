import "../styles/projects.css";
import { FaSearch, FaPlus, FaRegFileAlt, FaPencilAlt, FaTrash } from "react-icons/fa";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import CustomDropdown from "../components/CustomDropdown"
import PageLoader from "../components/PageLoader";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProjects, updateProject, deleteProject } from "../api/projects";
import { getTasks } from "../api/tasks";
import { hasCurrentPermission } from "../utils/authStorage";


// Helper: simple relative time like '2h ago', '3d ago'
function formatRelativeTime(date) {
  if (!date) return "";
  const ms = Date.now() - new Date(date).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w}w ago`;
  return new Date(date).toLocaleDateString();
}


function ProjectsPage() {
  const navigate = useNavigate();

  const [sortBy, setSortBy] = useState("Recently Updated");
  const [filterBy, setFilterBy] = useState("All");
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [updating, setUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProject, setDeletingProject] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const canManageProjects = hasCurrentPermission("MANAGE_PROJECT");

  // loadProjects is used on mount and after creating a project
  async function loadProjects() {
    setLoading(true);
    try {
      const data = await getProjects();

      const enriched = await Promise.all(
        data.map(async (p) => {
          const projectId = p._id || p.id;
          let tasks = [];
          try {
            tasks = await getTasks(projectId);
          } catch (err) {
            // ignore task fetch errors per-project
            console.error("Failed to fetch tasks for project", projectId, err);
          }

          const total = Array.isArray(tasks) ? tasks.length : 0;
          const completed = Array.isArray(tasks) ? tasks.filter(t => t.status === 'DONE').length : 0;
          const isBlocked = Array.isArray(tasks) ? tasks.some(t => t.isBlocked) : false;

          let status = "In Progress";
          if (isBlocked) status = "Blocked";
          else if (total > 0 && completed === total) status = "Completed";

          const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

          return {
            ...p,
            name: p.name,
            description: p.description || "",
            status,
            progress,
            tasks: total,
            members: Array.isArray(p.members) ? p.members.length : (p.members || 0),
            updatedAt: p.updatedAt || p.updated || p.updated_at || p.createdAt,
            createdAt: p.createdAt || p.created_at,
            updated: formatRelativeTime(p.updatedAt || p.updated || p.updated_at || p.createdAt),
          };
        })
      );

      setProjects(enriched);
    } catch (error) {
      console.error("Failed to load projects", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProjects(); }, []);

  // generate a consistent accent color from project name
  function generateColorFromString(str) {
    if (!str) return "#6c6cff";
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h} 70% 50%)`;
  }

  async function handleCreateProject(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { createProject } = await import('../api/projects');
      await createProject({ name: newName.trim(), description: newDescription });
      setShowAddModal(false);
      setNewName("");
      setNewDescription("");
      await loadProjects();
    } catch (err) {
      console.error('Create project failed', err);
      // optionally show error to user
    } finally {
      setCreating(false);
    }
  }

  function openEditModal(project) {
    setEditingProject(project);
    setEditName(project.name || "");
    setEditDescription(project.description || "");
    setShowEditModal(true);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingProject(null);
    setEditName("");
    setEditDescription("");
  }

  async function handleUpdateProject(e) {
    e.preventDefault();
    if (!editingProject || !editName.trim()) return;
    const projectId = editingProject._id || editingProject.id;
    setUpdating(true);
    try {
      await updateProject(projectId, {
        name: editName.trim(),
        description: editDescription,
      });
      closeEditModal();
      await loadProjects();
    } catch (err) {
      console.error("Update project failed", err);
    } finally {
      setUpdating(false);
    }
  }

  function openDeleteModal(project) {
    setDeletingProject(project);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    setShowDeleteModal(false);
    setDeletingProject(null);
  }

  async function handleDeleteProject() {
    if (!deletingProject) return;
    const projectId = deletingProject._id || deletingProject.id;
    setDeleting(true);
    try {
      await deleteProject(projectId);
      closeDeleteModal();
      await loadProjects();
    } catch (err) {
      console.error("Delete project failed", err);
    } finally {
      setDeleting(false);
    }
  }

  // derive displayed projects according to search, filter and sort
  const displayedProjects = projects
    .filter((p) => {
      // filter by search query
      if (query && query.trim() !== "") {
        const q = query.trim().toLowerCase();
        const name = (p.name || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        if (!name.includes(q) && !desc.includes(q)) return false;
      }

      // filter by status
      if (filterBy && filterBy !== "All") {
        return p.status === filterBy;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "Recently Updated") {
        const da = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const db = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return db - da;
      }

      if (sortBy === "Newest") {
        const ca = new Date(a.createdAt || 0).getTime();
        const cb = new Date(b.createdAt || 0).getTime();
        return cb - ca;
      }

      if (sortBy === "Oldest") {
        const ca = new Date(a.createdAt || 0).getTime();
        const cb = new Date(b.createdAt || 0).getTime();
        return ca - cb;
      }

      if (sortBy === "A-Z") {
        return (a.name || "").localeCompare(b.name || "");
      }

      return 0;
    });

  if (loading) {
    return <PageLoader message="Loading projects..." />;
  }

  return (
    <div className="projects-page">
      <div className="projects-header">
        <h1>Projects</h1>
      </div>

      <div className="projects-toolbar">

        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {canManageProjects && (
          <button className="new-project-btn" onClick={() => setShowAddModal(true)}>
            <FaPlus />
            New Project
          </button>
        )}

        <CustomDropdown
  value={sortBy}
  onChange={setSortBy}
  options={[
    "Recently Updated",
    "Newest",
    "Oldest",
    "A-Z"
  ]}
  width="190px"
/>

<CustomDropdown
  value={filterBy}
  onChange={setFilterBy}
  options={[
    "All",
    "In Progress",
    "Blocked",
    "Completed"
  ]}
  width="140px"
/>

      </div>

      {displayedProjects.length === 0 ? (
        <div className="projects-empty-container">
          <div className="projects-empty-state">
            <FaRegFileAlt size={56} />
            <div className="projects-empty-state__text">no projects found</div>
          </div>
        </div>
      ) : (
        <div className="projects-grid">
          {displayedProjects.map((project) => (
          <div
            className="project-card"
            key={project._id || project.id}
            onClick={() => {
              const projectId = project._id || project.id;
              if (projectId) {
                navigate(`/projectboard/${projectId}`);
              }
            }}
          >
            <div className="project-accent" style={{ backgroundColor: generateColorFromString(project.name) }}></div>

            <div className="project-card-actions">
              {canManageProjects && (
                <>
                  <button
                    type="button"
                    className="project-action-btn"
                    aria-label="Edit project"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(project);
                    }}
                  >
                    <FaPencilAlt />
                  </button>
                  <button
                    type="button"
                    className="project-action-btn"
                    aria-label="Delete project"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(project);
                    }}
                  >
                    <FaTrash />
                  </button>
                </>
              )}
              {/* <div className="project-arrow">
                <FaArrowUpRightFromSquare />
              </div> */}
            </div>

            <div className="project-title-row">
              {/* <div className="project-dot"></div> */}

              <h3>{project.name}</h3>
            </div>

            <p>{project.description}</p>

            <div className={`project-status ${project.status.toLowerCase().replace(" ", "-")}`}>
              {project.status}
            </div>

            <div className="project-progress">
              <div className="project-progress-bar">
                <div
                  className="project-progress-fill"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
              <span>{project.progress}%</span>
            </div>

            <div className="project-meta">

              <div>
                <strong>{project.tasks}</strong>
                <span>Tasks</span>
              </div>

              <div>
                <strong>{project.members}</strong>
                <span>Members</span>
              </div>

              <div>
                <strong>{project.updated}</strong>
                <span>Updated</span>
              </div>

            </div>

          </div>
        ))}

      </div>
      )}
      {showAddModal && (
        <div className="project-modal-overlay" onClick={() => setShowAddModal(false)}>
          <form className="project-modal" onSubmit={handleCreateProject} onClick={(e)=>e.stopPropagation()}>
            <h3>Create Project</h3>

            <div className="project-modal-field">
              <label>Name</label>
              <input value={newName} onChange={(e)=>setNewName(e.target.value)} required />
            </div>

            <div className="project-modal-field">
              <label>Description</label>
              <textarea value={newDescription} onChange={(e)=>setNewDescription(e.target.value)} rows={4} />
            </div>

            <div className="project-modal-actions">
              <button type="button" className="project-modal-btn project-modal-btn--secondary" onClick={()=>setShowAddModal(false)}>Cancel</button>
              <button type="submit" className="project-modal-btn project-modal-btn--primary" disabled={creating}>{creating ? 'Creating...' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      {showEditModal && (
        <div className="project-modal-overlay" onClick={closeEditModal}>
          <form className="project-modal" onSubmit={handleUpdateProject} onClick={(e)=>e.stopPropagation()}>
            <h3>Edit Project</h3>

            <div className="project-modal-field">
              <label>Name</label>
              <input value={editName} onChange={(e)=>setEditName(e.target.value)} required />
            </div>

            <div className="project-modal-field">
              <label>Description</label>
              <textarea value={editDescription} onChange={(e)=>setEditDescription(e.target.value)} rows={4} />
            </div>

            <div className="project-modal-actions">
              <button type="button" className="project-modal-btn project-modal-btn--secondary" onClick={closeEditModal}>Cancel</button>
              <button type="submit" className="project-modal-btn project-modal-btn--primary" disabled={updating}>{updating ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      {showDeleteModal && deletingProject && (
        <div className="project-modal-overlay" onClick={closeDeleteModal}>
          <div className="project-modal" onClick={(e)=>e.stopPropagation()}>
            <h3>Delete Project</h3>
            <p className="project-modal-message">
              Are you sure you want to delete the project <strong>{deletingProject.name}</strong>?
            </p>

            <div className="project-modal-actions">
              <button type="button" className="project-modal-btn project-modal-btn--secondary" onClick={closeDeleteModal}>Cancel</button>
              <button type="button" className="project-modal-btn project-modal-btn--danger" onClick={handleDeleteProject} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;