// import Sidebar from "../components/layout/Sidebar";
// import Topbar from "../components/layout/Topbar";
import { FaFolder, FaTasks, FaBan, FaCheckCircle } from "react-icons/fa";
import "../styles/dashboard.css";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProjects } from "../api/projects";
import { getTasks } from "../api/tasks";
import { getProjectActivity, getActivitySummary } from "../api/activity";
import PageLoader from "../components/PageLoader";


function DashboardPage() {
  const navigate = useNavigate();
  const [projectsCount, setProjectsCount] = useState(0);
  const [tasksCount, setTasksCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [completionPercent, setCompletionPercent] = useState("0%");
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [aiBlockers, setAiBlockers] = useState({});
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activitySummary, setActivitySummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const isLoading = loading || summaryLoading;

  useEffect(() => {
    let mounted = true;

    async function fetchKpis() {
      setLoading(true);
      try {
        const projects = await getProjects();
        const projectIds = (projects || []).map((p) => p._id || p.id);

        let totalTasks = 0;
        let blocked = 0;
        let completed = 0;
        const activities = [];
        const upcoming = [];
        const blockersMap = {};
        const projectMap = {};
        (projects || []).forEach((p) => {
          const id = p._id || p.id;
          projectMap[id] = p;
        });

        for (const id of projectIds) {
          try {
            const tasks = await getTasks(id);
            totalTasks += tasks.length;
            blocked += tasks.filter((t) => t.isBlocked).length;
            completed += tasks.filter((t) => t.status === "DONE").length;

            const now = new Date();
            for (const t of tasks) {
              // upcoming deadlines within next 14 days
              if (t.dueDate) {
                const due = new Date(t.dueDate);
                const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays <= 14) {
                  upcoming.push({
                    title: t.title,
                    dueDate: t.dueDate,
                    days: diffDays,
                    projectName: projectMap[id]?.name || "",
                  });
                }
              }

              if (t.isBlocked) {
                const type = t.blockerType || "OTHER";
                blockersMap[type] = (blockersMap[type] || 0) + 1;
              }
            }

            // fetch recent activity for this project
            try {
              const acts = await getProjectActivity(id);
              if (Array.isArray(acts) && acts.length) {
                activities.push(...acts.map((a) => ({ ...a, projectId: id })));
              }
            } catch (err) {
              console.error("Failed to fetch activity for project", id, err);
            }

          } catch (err) {
            // ignore per-project errors but continue
            console.error("Failed to fetch tasks for project", id, err);
          }
        }

        if (!mounted) return;

        setProjectsCount((projects || []).length);
        setTasksCount(totalTasks);
        setBlockedCount(blocked);
        const pct = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;
        setCompletionPercent(`${pct}%`);

        // compute upcoming deadlines: sort by soonest and keep top 5
        upcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        setUpcomingDeadlines(upcoming.slice(0, 5));

        // map blocker types to user labels
        setAiBlockers({
          DEPENDENCY: blockersMap.DEPENDENCY || 0,
          CLIENT: blockersMap.CLIENT || 0,
          RESOURCE: blockersMap.RESOURCE || 0,
          UNCLEAR: blockersMap.UNCLEAR || 0,
          OTHER: blockersMap.OTHER || 0,
        });

        // recent projects sorted by most recently created
        const recent = (projects || [])
          .slice()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        setRecentProjects(recent);

        // recent activity aggregated across projects
        activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentActivity(activities.slice(0, 5));
      } catch (err) {
        console.error("KPI fetch failed", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchKpis();
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchActivitySummary() {
      setSummaryLoading(true);
      try {
        const summary = await getActivitySummary();
        if (mounted) {
          setActivitySummary(summary || []);
        }
      } catch (err) {
        console.error("Failed to fetch activity summary", err);
      } finally {
        if (mounted) setSummaryLoading(false);
      }
    }

    fetchActivitySummary();
    return () => (mounted = false);
  }, []);

  if (isLoading) {
    return <PageLoader message="Loading dashboard..." />;
  }

  return (
    <div className="dashboard-layout">
      <main className="dashboard-main">
        <section className="dashboard-content">

          <div className="kpi-grid">

  <div className="kpi-card">
    <div className="kpi-header">
      <FaFolder className="kpi-icon" />
      <span>Projects</span>
    </div>
    <h2>{projectsCount}</h2>
  </div>

  <div className="kpi-card">
    <div className="kpi-header">
      <FaTasks className="kpi-icon" />
      <span>Tasks</span>
    </div>
    <h2>{tasksCount}</h2>
  </div>

  <div className="kpi-card">
    <div className="kpi-header">
      <FaBan className="kpi-icon" />
      <span>Blocked</span>
    </div>
    <h2>{blockedCount}</h2>
  </div>

  <div className="kpi-card">
    <div className="kpi-header">
      <FaCheckCircle className="kpi-icon" />
      <span>Completion</span>
    </div>
    <h2>{completionPercent}</h2>
  </div>

</div>

          <div className="row-two">

            <div className="activity-card-work">

              <div className="card-header">
                <h3>Workspace Activity</h3>
              </div>

              <div className="activity-chart">
                {activitySummary.length === 0 ? (
                  <div className="chart-empty">No activity this week</div>
                ) : (
                  <svg viewBox="0 0 700 260" preserveAspectRatio="none" className="activity-svg">
                    <g className="activity-grid">
                      {[0, 1, 2, 3, 4].map((index) => (
                        <line
                          key={index}
                          x1="0"
                          x2="700"
                          y1={40 + index * 36}
                          y2={40 + index * 36}
                          stroke="rgba(139,92,246,0.12)"
                          strokeWidth="1"
                        />
                      ))}
                    </g>
                    {(() => {
                      const values = activitySummary.map((d) => d.count);
                      const maxValue = Math.max(...values, 1);
                      const points = activitySummary.map((item, index) => {
                        const x = 70 + (index * 90);
                        const y = 220 - (item.count / maxValue) * 160;
                        return { x, y, count: item.count, day: item.day };
                      });
                      const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
                      return (
                        <g>
                          <path d={linePath} fill="none" stroke="#F12E54" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                          {points.map((point) => (
                            <g key={point.day}>
                              <circle cx={point.x} cy={point.y} r="6" fill="#F12E54" />
                              <circle cx={point.x} cy={point.y} r="3" fill="#fff" />
                            </g>
                          ))}
                        </g>
                      );
                    })()}
                    <g className="activity-axis-labels">
                      {activitySummary.map((item, index) => {
                        const x = 70 + index * 90;
                        return (
                          <text key={item.day} x={x} y="247" textAnchor="middle" className="axis-label">
                            {item.day}
                          </text>
                        );
                      })}
                    </g>
                  </svg>
                )}
              </div>

            </div>

            <div className="right-column">

              <div className="deadline-card">

                <h3>Upcoming Deadlines</h3>

                  {upcomingDeadlines.length === 0 && (
                    <div className="deadline-item">
                      <span>No upcoming deadlines</span>
                    </div>
                  )}

                  {upcomingDeadlines.map((d, idx) => (
                    <div className="deadline-item" key={idx}>
                      <span>{d.title} {d.projectName ? `— ${d.projectName}` : ""}</span>
                      <small>
                        {d.days === 0 ? "Today" : d.days === 1 ? "Tomorrow" : `${d.days} Days`}
                      </small>
                    </div>
                  ))}

              </div>

              <div className="blocker-card">

                <h3>AI Blockers</h3>

                {Object.keys(aiBlockers).length === 0 && (
                  <div className="blocker-item">
                    <span>No blockers</span>
                  </div>
                )}

                {aiBlockers.DEPENDENCY > 0 && (
                  <div className="blocker-item">
                    <span>Dependency</span>
                    <strong>{aiBlockers.DEPENDENCY}</strong>
                  </div>
                )}

                {aiBlockers.CLIENT > 0 && (
                  <div className="blocker-item">
                    <span>Approval</span>
                    <strong>{aiBlockers.CLIENT}</strong>
                  </div>
                )}

                {aiBlockers.RESOURCE > 0 && (
                  <div className="blocker-item">
                    <span>Resource</span>
                    <strong>{aiBlockers.RESOURCE}</strong>
                  </div>
                )}

                {aiBlockers.UNCLEAR > 0 && (
                  <div className="blocker-item">
                    <span>Unclear</span>
                    <strong>{aiBlockers.UNCLEAR}</strong>
                  </div>
                )}

                {aiBlockers.OTHER > 0 && (
                  <div className="blocker-item">
                    <span>Other</span>
                    <strong>{aiBlockers.OTHER}</strong>
                  </div>
                )}

              </div>

            </div>

          </div>

          <div className="row-three">

            <div className="activity-feed">

              <h3>Recent Activity</h3>

              {recentActivity.length === 0 && (
                <div className="feed-item">No recent activity</div>
              )}

              {recentActivity.map((a) => (
                <div className="feed-item" key={a._id}>
                  {a.user?.name || "Someone"} — {a.action.replace(/_/g, " ").toLowerCase()}
                </div>
              ))}

            </div>

            <div className="projects-card">

  <h3>Recent Projects</h3>

            {recentProjects.length === 0 && (
              <div className="project-row">
                <span>No recent projects</span>
              </div>
            )}

            {recentProjects.map((p) => (
              <div
                className="project-row"
                key={p._id || p.id}
                onClick={() => {
                  const projectId = p._id || p.id;
                  if (projectId) {
                    navigate(`/projectboard/${projectId}`);
                  }
                }}
              >

                <span>{p.name}</span>

                <div className="project-arrow">
                  <FaArrowUpRightFromSquare />
                </div>

              </div>
            ))}

</div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default DashboardPage;