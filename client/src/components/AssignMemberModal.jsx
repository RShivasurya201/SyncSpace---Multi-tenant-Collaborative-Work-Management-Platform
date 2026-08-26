import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { getMembers } from "../api/auth";
import "../styles/assignMemberModal.css";

const avatarColors = [
  "#242E42", // Navy
  "#F12E54", // Primary red
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#14B8A6", // Teal
];

function AssignMemberModal({ onClose, onSelectMember, isLoading }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMembers() {
      try {
        setLoading(true);
        setError(null);
        const membersData = await getMembers();
        setMembers(membersData);
      } catch (err) {
        console.error("Failed to fetch members:", err);
        setError("Failed to load members");
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, []);

  const handleMemberClick = (memberId, memberName) => {
    onSelectMember(memberId, memberName);
  };

  return (
    <div className="assign-modal-overlay" onClick={onClose}>
      <div className="assign-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="assign-modal-header">
          <h3>Assign Member</h3>
          <button className="assign-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="assign-modal-content">
          {loading ? (
            <p className="loading-text">Loading members...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : members.length === 0 ? (
            <p className="empty-text">No members available</p>
          ) : (
            <div className="members-list">
              {members.map((membership, index) => (
                <button
                  key={membership.user._id}
                  className="member-item"
                  onClick={() =>
                    handleMemberClick(
                      membership.user._id,
                      membership.user.name
                    )
                  }
                  disabled={isLoading}
                >
                  <div
                    className="member-avatar"
                    style={{
                      backgroundColor:
                        avatarColors[index % avatarColors.length],
                    }}
                  >
                    {membership.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="member-info">
                    <div className="member-name">{membership.user.name}</div>
                    <div className="member-email">{membership.user.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssignMemberModal;
