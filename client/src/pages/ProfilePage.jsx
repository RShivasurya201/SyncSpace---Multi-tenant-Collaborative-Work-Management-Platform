import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";
import { FaSignOutAlt } from "react-icons/fa";
import PageLoader from "../components/PageLoader";
import { getProfile } from "../api/auth";
import { clearAuthSession, getCurrentMembership, getStoredUser } from "../utils/authStorage";
import { useAuth } from "../hooks/useAuthInit";

function formatJoinedDate(createdAt) {
  if (!createdAt) return "";
  try {
    return new Date(createdAt).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { signout } = useAuth();
  const storedUser = getStoredUser();
  const storedMembership = getCurrentMembership();

  const [user, setUser] = useState(storedUser);
  const [membership, setMembership] = useState(storedMembership);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const data = await getProfile();
        if (!mounted) return;
        setUser(data.user);
        setMembership(data.membership);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || "Unable to load profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    if (typeof signout === "function") {
      signout();
    }
    navigate("/", { replace: true });
  };

  const displayedUser = user || {
    name: "Unknown User",
    email: "-",
    createdAt: null,
  };

  const displayedMembership = membership || {
    role: "Member",
    organization: { name: "-" },
  };

  if (loading) {
    return <PageLoader message="Loading profile..." />;
  }

  return (
    <div className="profile-page">

      <div className="profile-header">

        <h1>Profile</h1>

        <p>
          Manage your account information.
        </p>

      </div>

      <div className="profile-content">
          <div className="profile-card">
            <div className="profile-avatar">
              {displayedUser.name?.charAt(0) || "U"}
            </div>
            <h2>{displayedUser.name}</h2>
            <span>{displayedMembership.role || "Member"}</span>
          </div>

          <div className="details-card">
            <h3>Account Details</h3>

            <div className="detail-row">
              <label>Full Name</label>
              <span>{displayedUser.name}</span>
            </div>

            <div className="detail-row">
              <label>Email</label>
              <span>{displayedUser.email}</span>
            </div>

            <div className="detail-row">
              <label>Role</label>
              <span>{displayedMembership.role || "Member"}</span>
            </div>

            <div className="detail-row">
              <label>Organization</label>
              <span>{displayedMembership.organization?.name || "-"}</span>
            </div>

            <div className="detail-row">
              <label>Member Since</label>
              <span>{formatJoinedDate(displayedUser.createdAt)}</span>
            </div>
          </div>
        </div>

      {error && <div className="profile-error">{error}</div>}

      <button className="logout-btn" type="button" onClick={handleLogout}>
        <FaSignOutAlt /> Log Out
      </button>

    </div>

  );

}