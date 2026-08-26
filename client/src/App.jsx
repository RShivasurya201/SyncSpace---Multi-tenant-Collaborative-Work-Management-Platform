import { Navigate, Route, Routes } from "react-router-dom";

import GuestRoute from "./components/GuestRoute";
import ProtectedRoute from "./components/ProtectedRoute";

import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import MembersPage from "./pages/MembersPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import MainLayout from "./components/layout/MainLayout";
import ProjectBoardPage from "./pages/ProjectBoardPage";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <GuestRoute>
            <AuthPage />
          </GuestRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
            <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <MainLayout>
            <ProjectsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/projectboard/:projectId?"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ProjectBoardPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

        
      <Route
        path="/members"
        element={
          <ProtectedRoute>
            <MainLayout>
            <MembersPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <MainLayout>
            <AnalyticsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

   

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MainLayout>
            <ProfilePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App; 