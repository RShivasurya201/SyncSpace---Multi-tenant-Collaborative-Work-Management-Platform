import "../styles/analytics.css";

import { useState, useEffect } from "react";

import CustomDropdown from "../components/CustomDropdown";
import PageLoader from "../components/PageLoader";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,

  PieChart,
  Pie,
  Cell,

  BarChart,
  Bar,

  Legend,
} from "recharts";

const defaultActivityData = [
  { day: "Apr 24", projects: 40, tasks: 30 },
  { day: "Apr 28", projects: 55, tasks: 38 },
  { day: "May 2", projects: 80, tasks: 42 },
  { day: "May 5", projects: 72, tasks: 55 },
  { day: "May 8", projects: 90, tasks: 57 },
  { day: "May 12", projects: 58, tasks: 41 },
  { day: "May 16", projects: 75, tasks: 60 },
  { day: "May 20", projects: 82, tasks: 52 },
  { day: "May 24", projects: 65, tasks: 42 },
];

const defaultProjectStatus = [
  { name: "Completed", value: 35, color: "#4CC76A" },
  { name: "In Progress", value: 60, color: "#4285F4" },
  { name: "Blocked", value: 5, color: "#EA4335" },
];

const defaultPriorityData = [
  { name: "High", value: 30, color: "#EA4335" },
  { name: "Medium", value: 50, color: "#F4C20D" },
  { name: "Low", value: 20, color: "#4CC76A" },
];

const defaultTopProjects = [
  {
    name: "Website Redesign",
    tasks: 120,
  },
  {
    name: "Mobile App",
    tasks: 98,
  },
  {
    name: "Dashboard",
    tasks: 75,
  },
  {
    name: "API Integration",
    tasks: 60,
  },
];

const defaultMemberStatus = [
  {
    name: "John",
    todo: 12,
    progress: 8,
    review: 5,
    done: 20,
  },
  {
    name: "Jane",
    todo: 8,
    progress: 12,
    review: 3,
    done: 17,
  },
  {
    name: "Mike",
    todo: 15,
    progress: 7,
    review: 8,
    done: 10,
  },
];

import { getDashboardAnalytics } from "../api/analytics";

export default function AnalyticsPage() {

  const periods = [
    "Last 7 Days",
    "Last 30 Days",
    "This Month",
  ];

  const [period, setPeriod] = useState(
    periods[0]
  );

  const [activityData, setActivityData] = useState(defaultActivityData);
  const [projectStatus, setProjectStatus] = useState(defaultProjectStatus);
  const [priorityData, setPriorityData] = useState(defaultPriorityData);
  const [topProjects, setTopProjects] = useState(defaultTopProjects);
  const [memberStatus, setMemberStatus] = useState(defaultMemberStatus);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let days = 30;
    if (period === "Last 7 Days") days = 7;
    else if (period === "Last 30 Days") days = 30;
    else if (period === "This Month") days = new Date().getDate();

    async function load() {
      setLoading(true);
      try {
        const resp = await getDashboardAnalytics(days);

        // Map activity data (expect cumulative totals from backend)
        if (resp.projectActivity && Array.isArray(resp.projectActivity)) {
          const mapped = resp.projectActivity.map(item => {
            const d = new Date(item.date);
            const day = d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
            return {
              day,
              projects: item.totalProjects || 0,
              tasks: item.totalTasks || 0,
            };
          });
          setActivityData(mapped);
        }

        // Map projects by status to percentages
        if (resp.projectsByStatus) {
          const p = resp.projectsByStatus;
          const total = Object.values(p).reduce((a, b) => a + b, 0) || 1;
          setProjectStatus([
            { name: 'Completed', value: Math.round((p.completed / total) * 100), color: '#4CC76A' },
            { name: 'In Progress', value: Math.round((p.inProgress / total) * 100), color: '#4285F4' },
            { name: 'Blocked', value: Math.round((p.blocked / total) * 100), color: '#EA4335' },
          ]);
        }

        // Map tasks by priority
        if (resp.tasksByPriority) {
          const t = resp.tasksByPriority;
          const total = (t.high || 0) + (t.medium || 0) + (t.low || 0) || 1;
          setPriorityData([
            { name: 'High', value: Math.round(((t.high || 0) / total) * 100), color: '#EA4335' },
            { name: 'Medium', value: Math.round(((t.medium || 0) / total) * 100), color: '#F4C20D' },
            { name: 'Low', value: Math.round(((t.low || 0) / total) * 100), color: '#4CC76A' },
          ]);
        }

        // Map top projects
        if (resp.topProjects && Array.isArray(resp.topProjects)) {
          setTopProjects(resp.topProjects.map(p => ({ name: p.name, tasks: p.taskCount || 0 })));
        }

        // Map tasks by member
        if (resp.tasksByMember && Array.isArray(resp.tasksByMember)) {
          setMemberStatus(resp.tasksByMember.map(m => ({
            name: m.name,
            todo: m.toDo || 0,
            progress: m.inProgress || 0,
            review: m.review || 0,
            done: m.done || 0,
          })));
        }

      } catch (error) {
        console.error('Failed to load analytics', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [period]);

  if (loading) {
    return <PageLoader message="Loading analytics..." />;
  }

  return (

    <div className="analytics-page">

      <div className="analytics-header">

        <div>

          <h1>

            Analytics

          </h1>

          <p>

            Monitor workspace performance.

          </p>

        </div>

        <CustomDropdown
          value={period}
          onChange={setPeriod}
          options={periods}
          width="180px"
        />

      </div>

      <div className="analytics-grid">

        {/* BIG */}

        <div className="analytics-card activity-card">

          <div className="card-head">

            <h3>

              Project Activity

            </h3>

          </div>

          <ResponsiveContainer
            width="100%"
            height={500}
          >

            <LineChart
              data={activityData}
            >

              <CartesianGrid
                stroke="#ECEFF5"
                strokeDasharray="3 3"
              />

              <XAxis dataKey="day"/>

              <YAxis/>

              <Tooltip/>

              <Legend  />

              <Line
                type="monotone"
                dataKey="projects"
                stroke="#4285F4"
                strokeWidth={3}
              />

              <Line
                type="monotone"
                dataKey="tasks"
                stroke="#4CC76A"
                strokeWidth={3}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

        {/* PIE 1 */}

        <div className="analytics-card">

          <h3>

            Projects by Status

          </h3>

          <div className="pie-layout">

            <ResponsiveContainer
              width={180}
              height={180}
            >

              <PieChart>

                <Pie
                  data={projectStatus}
                  dataKey="value"
                >

                  {projectStatus.map(
                    item=>(
                      <Cell
                        fill={item.color}
                        key={item.name}
                      />
                    )
                  )}

                </Pie>

              </PieChart>

            </ResponsiveContainer>

            <div className="legend-list">

              {projectStatus.map(
                item=>(
                  <div key={item.name}>

                    <span
                      style={{
                        background:item.color
                      }}
                    />

                    {item.name}

                    <strong>

                      {item.value}%

                    </strong>

                  </div>
                )
              )}

            </div>

          </div>

        </div>

        {/* PIE 2 */}

        <div className="analytics-card">

          <h3>

            Tasks by Priority

          </h3>

          <div className="pie-layout">

            <ResponsiveContainer
              width={180}
              height={180}
            >

              <PieChart>

                <Pie
                  data={priorityData}
                  dataKey="value"
                >

                  {priorityData.map(
                    item=>(
                      <Cell
                        fill={item.color}
                        key={item.name}
                      />
                    )
                  )}

                </Pie>

              </PieChart>

            </ResponsiveContainer>

            <div className="legend-list">

              {priorityData.map(
                item=>(
                  <div key={item.name}>

                    <span
                      style={{
                        background:item.color
                      }}
                    />

                    {item.name}

                    <strong>

                      {item.value}%

                    </strong>

                  </div>
                )
              )}

            </div>

          </div>

        </div>

        {/* TOP PROJECTS */}

        <div className="analytics-card">

          <h3>

            Top Projects

          </h3>

          <ResponsiveContainer
            width="100%"
            height={250}
          >

            <BarChart
              layout="vertical"
              data={topProjects}
            >

              <XAxis type="number"/>

              <YAxis
                type="category"
                dataKey="name"
              />

              <Tooltip/>

              <Bar
                dataKey="tasks"
                fill="#4285F4"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

        {/* MEMBER */}

        <div className="analytics-card">

          <h3>

            Tasks by Status

          </h3>

          <ResponsiveContainer
            width="100%"
            height={250}
          >

            <BarChart
              layout="vertical"
              data={memberStatus}
            >

              <XAxis
                type="number"
              />

              <YAxis
                type="category"
                dataKey="name"
              />

              <Tooltip/>

              <Legend/>

              <Bar
                stackId="a"
                dataKey="todo"
                fill="#D6DAE1"
              />

              <Bar
                stackId="a"
                dataKey="progress"
                fill="#4285F4"
              />

              <Bar
                stackId="a"
                dataKey="review"
                fill="#F4C20D"
              />

              <Bar
                stackId="a"
                dataKey="done"
                fill="#4CC76A"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>

    </div>

  );

}