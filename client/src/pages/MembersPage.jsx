import "../styles/members.css";
import CustomDropdown from "../components/CustomDropdown";
import PageLoader from "../components/PageLoader";
import { FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import {
  createInvite,
  getMembers,
  getPendingInvites,
  updateMemberRole,
} from "../api/auth";
import { getCurrentMembership } from "../utils/authStorage";

const avatarColors = [
  "#242E42",
  "#F12E54",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
];

const normalizeRole = (role) => {
  if (!role) return "";
  const map = {
    OWNER: "Owner",
    ADMIN: "Admin",
    MANAGER: "Manager",
    DEVELOPER: "Developer",
    VIEWER: "Viewer",
  };
  return map[String(role).toUpperCase()] || role;
};

const inviteRoleOptions = [
  { label: "Owner", value: "OWNER" },
  { label: "Admin", value: "ADMIN" },
  { label: "Manager", value: "MANAGER" },
  { label: "Developer", value: "DEVELOPER" },
  { label: "Viewer", value: "VIEWER" },
];

const memberRoleOptions = [
  { label: "Owner", value: "OWNER" },
  { label: "Admin", value: "ADMIN" },
  { label: "Manager", value: "MANAGER" },
  { label: "Developer", value: "DEVELOPER" },
  { label: "Viewer", value: "VIEWER" },
];

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function MembersPage() {
  const [activeTab, setActiveTab] = useState("members");
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [role, setRole] = useState("All Roles");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "VIEWER" });
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState(null);
  const [updatingMemberId, setUpdatingMemberId] = useState(null);

  const currentMembership = useMemo(() => getCurrentMembership(), []);
  const canInviteMembers = ["OWNER", "ADMIN"].includes(String(currentMembership?.role || "").toUpperCase());
  const canManageMembers = canInviteMembers;
  const canAssignOwner = String(currentMembership?.role || "").toUpperCase() === "OWNER";

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    setLoading(true);
    setError("");

    try {
      const membersData = await getMembers();
      setMembers(membersData || []);

      try {
        const invitesData = await getPendingInvites();
        setInvites(invitesData || []);
      } catch (inviteErr) {
        setInvites([]);
        if (!canInviteMembers) {
          setError("");
        } else {
          setError(
            inviteErr?.response?.data?.message || inviteErr.message || "Failed to load invites."
          );
        }
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to load data."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (event) => {
    event.preventDefault();

    const email = inviteForm.email.trim();

    if (!email) {
      setInviteFeedback({ type: "error", message: "Please enter an email address." });
      return;
    }

    setInviteSubmitting(true);
    setInviteFeedback(null);

    try {
      await createInvite({ email, role: inviteForm.role });
      setInviteFeedback({
        type: "success",
        message: `Invitation sent to ${email}.`,
      });
      setShowInviteModal(false);
      setInviteForm({ email: "", role: "VIEWER" });
      await loadPageData();
    } catch (err) {
      setInviteFeedback({
        type: "error",
        message: err?.response?.data?.message || err.message || "Failed to send invite.",
      });
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleRoleChange = async (member, nextRole) => {
    if (!canManageMembers || member.role === "OWNER" || member.role === nextRole) return;

    setUpdatingMemberId(member._id);
    setError("");

    try {
      const response = await updateMemberRole(member._id, nextRole);
      setMembers((currentMembers) =>
        currentMembers.map((currentMember) =>
          currentMember._id === member._id
            ? {
                ...currentMember,
                role: response.membership?.role || nextRole,
                user: currentMember.user || member.user,
              }
            : currentMember
        )
      );
      setInviteFeedback({ type: "success", message: `${member.user?.name || "Member"} is now ${normalizeRole(nextRole)}.` });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to update member role.");
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const filteredMembers = members.filter((member) => {
    const query = searchQuery.trim().toLowerCase();
    const name = member.user?.name || "";
    const email = member.user?.email || "";
    const roleLabel = member.role || "";
    const matchesQuery =
      !query ||
      [name, email, roleLabel].some((value) =>
        value.toLowerCase().includes(query)
      );
    const matchesRole =
      role === "All Roles" || role.toLowerCase() === roleLabel.toLowerCase();
    return matchesQuery && matchesRole;
  });

  const now = Date.now();
  const activeInvites = invites.filter((invite) => {
    if (!invite.expiresAt) return true;
    return new Date(invite.expiresAt).getTime() > now;
  });

  const dedupedInvites = activeInvites.reduce((acc, invite) => {
    const normalizedEmail = (invite.email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      acc.push(invite);
      return acc;
    }

    const existingIndex = acc.findIndex(
      (item) => (item.email || "").trim().toLowerCase() === normalizedEmail
    );

    if (existingIndex === -1) {
      acc.push(invite);
      return acc;
    }

    const currentTimestamp = new Date(invite.createdAt || 0).getTime();
    const existingTimestamp = new Date(acc[existingIndex].createdAt || 0).getTime();

    if (currentTimestamp > existingTimestamp) {
      acc[existingIndex] = invite;
    }

    return acc;
  }, []);

  const filteredInvites = dedupedInvites.filter((invite) => {
    const query = searchQuery.trim().toLowerCase();
    const email = invite.email || "";
    const roleLabel = invite.role || "";
    const invitedBy = invite.invitedBy?.name || invite.invitedBy?.email || "";
    const matchesQuery =
      !query ||
      [email, roleLabel, invitedBy].some((value) =>
        value.toLowerCase().includes(query)
      );
    const matchesRole =
      role === "All Roles" || role.toLowerCase() === roleLabel.toLowerCase();
    return matchesQuery && matchesRole;
  });

  if (loading) {
    return <PageLoader message="Loading members..." />;
  }

  return (
    <div className="members-page">
      <div className="members-header">
        <h1>Members</h1>
        <p>Manage your workspace members.</p>
      </div>

      <div className="members-toolbar">
        <div className="members-search">
          <FaSearch />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search member..."
          />
        </div>

        <div className="members-tabs">
          <button
            type="button"
            className={`members-tab ${activeTab === "members" ? "active" : ""}`}
            onClick={() => setActiveTab("members")}
          >
            Member list
          </button>
          <button
            type="button"
            className={`members-tab ${activeTab === "invites" ? "active" : ""}`}
            onClick={() => setActiveTab("invites")}
          >
            Pending invites
          </button>
        </div>

        <div className="members-actions">
          <CustomDropdown
            options={["All Roles", "Owner", "Admin", "Manager", "Developer", "Viewer"]}
            value={role}
            onChange={setRole}
          />

          {canInviteMembers && (
            <button
              className="member-invite-btn"
              type="button"
              onClick={() => {
                setInviteFeedback(null);
                setInviteForm({ email: "", role: "VIEWER" });
                setShowInviteModal(true);
              }}
            >
              <FaPlus />
              Invite Member
            </button>
          )}
        </div>
      </div>

      {error && <div className="members-error">{error}</div>}

      {inviteFeedback && (
        <div className={`members-feedback ${inviteFeedback.type}`}>
          {inviteFeedback.message}
        </div>
      )}

      {showInviteModal && (
        <div
          className="members-modal-overlay"
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="members-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="members-modal-header">
              <div>
                <h3>Invite member</h3>
                <p>Send a workspace invite to a colleague.</p>
              </div>
              <button
                className="members-modal-close"
                type="button"
                onClick={() => setShowInviteModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <form className="members-invite-form-modal" onSubmit={handleInviteSubmit}>
              <label className="members-field">
                <span>Email address</span>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(event) =>
                    setInviteForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="name@company.com"
                  autoFocus
                />
              </label>

              <label className="members-field">
                <span>Role</span>
                <select
                  value={inviteForm.role}
                  onChange={(event) =>
                    setInviteForm((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                >
                  {inviteRoleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="members-modal-actions">
                <button
                  className="members-modal-cancel"
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </button>
                <button className="members-modal-submit" type="submit" disabled={inviteSubmitting}>
                  {inviteSubmitting ? "Sending..." : "Send invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="members-table">
        {loading ? (
          <div className="members-loading">Loading...</div>
        ) : activeTab === "members" ? (
          <>
            <div className="members-table-head">
              <div>Avatar</div>
              <div>Name</div>
              <div>Email</div>
              <div>Role</div>
              <div>Active</div>
              <div>Completed</div>
              <div>Blocked</div>
            </div>
            <div className="members-table-body">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member, index) => (
                <div
                  className="members-row"
                  key={member._id || member.user?.email || index}
                >
                  <div>
                    <div
                      className="member-avatar"
                      style={{
                        backgroundColor: avatarColors[index % avatarColors.length],
                      }}
                    >
                      {member.user?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                  </div>
                  <div className="member-name">{member.user?.name}</div>
                  <div className="member-email">{member.user?.email}</div>
                  <div>
                    {canManageMembers && member.role !== "OWNER" ? (
                      <select
                        className="member-role-select"
                        value={member.role}
                        onChange={(event) => handleRoleChange(member, event.target.value)}
                        disabled={updatingMemberId === member._id}
                        aria-label={`Change role for ${member.user?.name || "member"}`}
                      >
                        {memberRoleOptions
                          .filter((option) => canAssignOwner || option.value !== "OWNER")
                          .map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <span className="member-role">{normalizeRole(member.role)}</span>
                    )}
                  </div>
                  <div className="active-count">{member.activeTasks ?? 0}</div>
                  <div className="completed-count">{member.completedTasks ?? 0}</div>
                  <div className="blocked-count">{member.blockedTasks ?? 0}</div>
                </div>
              ))
            ) : (
              <div className="members-empty">No members found.</div>
            )}
            </div>
          </>
        ) : (
          <>
            <div className="members-table-head members-table-head-invites">
              <div>Email</div>
              <div>Role</div>
              <div>Invited by</div>
              <div>Sent</div>
              <div>Expires</div>
            </div>
            <div className="members-table-body">
            {filteredInvites.length > 0 ? (
              filteredInvites.map((invite, index) => (
                <div
                  className="members-row members-row-invites"
                  key={invite._id || invite.email || index}
                >
                  <div className="invite-email">
                    <div
                      className="member-avatar"
                      style={{
                        backgroundColor: avatarColors[index % avatarColors.length],
                      }}
                    >
                      {invite.email?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="member-name">{invite.email}</div>
                  </div>
                  <div>
                    <span className="member-role">{normalizeRole(invite.role)}</span>
                  </div>
                  <div>{invite.invitedBy?.name || invite.invitedBy?.email || "—"}</div>
                  <div>{formatDate(invite.createdAt)}</div>
                  <div>{formatDate(invite.expiresAt)}</div>
                </div>
              ))
            ) : (
              <div className="members-empty">No pending invites.</div>
            )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
