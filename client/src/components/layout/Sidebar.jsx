import { NavLink } from "react-router-dom";
import "../../styles/sidebar.css";
import { hasCurrentPermission } from "../../utils/authStorage";

const links = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Projects", path: "/projects" },
  { name: "Members", path: "/members" },
  { name: "Analytics", path: "/analytics", permission: "VIEW_ANALYTICS" },
  { name: "Profile", path: "/profile" }
];

function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <img
            className="sidebar-logo-image"
            src="/icons8-sphere-50%20(1).png"
            alt="FlowSphere logo"
          />
          <h2>SyncSpace</h2>
        </div>

        <nav className="sidebar-nav">
          {links.filter((link) => !link.permission || hasCurrentPermission(link.permission)).map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;