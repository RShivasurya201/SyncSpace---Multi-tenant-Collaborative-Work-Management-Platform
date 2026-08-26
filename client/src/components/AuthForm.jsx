import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, signup } from "../api/auth";
import { setAuthSession } from "../utils/authStorage";
import { useAuth } from "../hooks/useAuthInit";

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.73 5.08C11.06 5.03 11.53 5 12 5C18.5 5 22 12 22 12C21.28 13.57 20.13 15.02 18.73 16.18M6.61 6.61C4.62 8.07 3.17 9.95 2 12C2 12 5.5 19 12 19C13.39 19 14.68 18.72 15.85 18.27M1 1L23 23"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 9.9C9.33 10.46 9 11.2 9 12C9 13.66 10.34 15 12 15C12.8 15 13.54 14.67 14.1 14.1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getErrorMessage(error) {
  const message = error?.response?.data?.message;
  if (message) return message;
  if (error?.message === "Network Error") {
    return "Unable to reach the server. Make sure the backend is running.";
  }
  return "Something went wrong. Please try again.";
}

function AuthForm() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { authenticate } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    organization: "",
  });

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError("");
  };

  const toggleMode = () => {
    setIsSignup((prev) => !prev);
    setShowPassword(false);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let data;

      if (isSignup) {
        if (!form.name.trim() || !form.email.trim() || !form.password) {
          setError("Name, email, and password are required.");
          setLoading(false);
          return;
        }

        data = await signup({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          organizationName: form.organization.trim() || undefined,
        });
      } else {
        if (!form.email.trim() || !form.password) {
          setError("Email and password are required.");
          setLoading(false);
          return;
        }

        data = await login({
          email: form.email.trim(),
          password: form.password,
        });
      }

      setAuthSession({
        token: data.token,
        user: data.user,
        organizations: data.organizations,
        organization: data.organization,
      });
      // inform auth context about successful authentication
      if (typeof authenticate === "function") authenticate();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section">
      <div className="auth-card">
        <header className="auth-card__header">
          <h2>{isSignup ? "Create your workspace" : "Welcome back"}</h2>
          <p>
            {isSignup
              ? "Start collaborating with your team in minutes."
              : "Sign in to continue to your workspace."}
          </p>
        </header>

        {error && (
          <div className="auth-form__error" role="alert">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {isSignup && (
            <div className="auth-field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                placeholder="Alex Morgan"
                autoComplete="name"
                value={form.name}
                onChange={updateField("name")}
                disabled={loading}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email">Work email</label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              value={form.email}
              onChange={updateField("email")}
              disabled={loading}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="auth-field__password">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={form.password}
                onChange={updateField("password")}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="auth-field__toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {isSignup && (
            <div className="auth-field">
              <label htmlFor="organization">Organization</label>
              <input
                id="organization"
                type="text"
                placeholder="Acme Inc. (optional)"
                autoComplete="organization"
                value={form.organization}
                onChange={updateField("organization")}
                disabled={loading}
              />
            </div>
          )}

          <button type="submit" className="auth-form__submit" disabled={loading}> 
            <span>
            {loading
              ? isSignup
                ? "Creating workspace..."
                : "Signing in..."
              : isSignup
                ? "Create workspace"
                : "Sign in"}
              </span>
          </button>
        </form>

        <p className="auth-card__footer">
          {isSignup ? "Already have an account?" : "New to SyncSpace?"}
          <button
            type="button"
            className="auth-card__link"
            onClick={toggleMode}
            disabled={loading}
          >
            {isSignup ? "Sign in" : "Create account"}
          </button>
        </p>
      </div>
    </section>
  );
}

export default AuthForm;
