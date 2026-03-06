import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { homeByUser } from "./utils/roleHome";
import ProtectedRoute from "./components/ProtectedRoute";
import UserOnboardingGuard from "./components/UserOnboardingGuard";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OnboardingPage from "./pages/OnboardingPage";
import JobFeedPage from "./pages/JobFeedPage";
import JobDetailsPage from "./pages/JobDetailsPage";
import ProfilePage from "./pages/ProfilePage";
import CompanyDashboardPage from "./pages/CompanyDashboardPage";
import CompanyProfilePage from "./pages/CompanyProfilePage";
import ManageJobsPage from "./pages/ManageJobsPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import NotFoundPage from "./pages/NotFoundPage";

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homeByUser(user)} replace />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomeRedirect />} />

          <Route element={<ProtectedRoute roles={["USER"]} />}>
            <Route path="/onboarding" element={<OnboardingPage />} />

            <Route element={<UserOnboardingGuard />}>
              <Route path="/jobs" element={<JobFeedPage />} />
              <Route path="/jobs/:jobId" element={<JobDetailsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["COMPANY"]} />}>
            <Route path="/company/dashboard" element={<CompanyDashboardPage />} />
            <Route path="/company/profile" element={<CompanyProfilePage />} />
            <Route path="/company/jobs" element={<ManageJobsPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route path="/admin" element={<AdminPanelPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
