import "../../styles/topbar.css";

function Topbar() {
  return (
    <header className="topbar">
      <div>
        <h1>Dashboard</h1>
        <p>Workspace overview</p>
      </div>

      <div className="topbar-right">
        <button className="org-pill">User 9 Org</button>

        <div className="topbar-user">
          <div className="avatar">U</div>
          <span>User 9</span>
        </div>
      </div>
    </header>
  );
}

export default Topbar;