import FeaturePanel from "../components/FeaturePanel";
import AuthForm from "../components/AuthForm";

import "../styles/auth.css";

function AuthPage() {
  return (
    <div className="auth-page">
      <FeaturePanel />
      <AuthForm />
    </div>
  );
}

export default AuthPage;