import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import UserOnboardingGuard from "./components/UserOnboardingGuard";
import AppShell from "./components/AppShell";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import OnboardingPage from "./pages/OnboardingPage";
import PublicJobsPage from "./pages/PublicJobsPage";
import JobFeedPage from "./pages/JobFeedPage";
import JobDetailsPage from "./pages/JobDetailsPage";
import ProfilePage from "./pages/ProfilePage";
import CompanyDashboardPage from "./pages/CompanyDashboardPage";
import CompanyApplicantsPage from "./pages/CompanyApplicantsPage";
import CompanyProfilePage from "./pages/CompanyProfilePage";
import ManageJobsPage from "./pages/ManageJobsPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import PublicProfilePage from "./pages/PublicProfilePage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import NotFoundPage from "./pages/NotFoundPage";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/jobs" element={<PublicJobsPage />} />
        <Route path="/jobs/:jobId" element={<JobDetailsPage />} />
        <Route
          path="/profiles/company/:profileId"
          element={<PublicProfilePage profileType="company" />}
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/profiles/user/:profileId"
            element={<PublicProfilePage profileType="user" />}
          />

          <Route element={<ProtectedRoute roles={["USER"]} />}>
            <Route path="/onboarding" element={<OnboardingPage />} />

            <Route element={<UserOnboardingGuard />}>
              <Route path="/dashboard" element={<JobFeedPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["COMPANY"]} />}>
            <Route path="/company/dashboard" element={<CompanyDashboardPage />} />
            <Route path="/company/applicants" element={<CompanyApplicantsPage />} />
            <Route path="/company/profile" element={<CompanyProfilePage />} />
            <Route path="/company/jobs" element={<ManageJobsPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route path="/admin" element={<Navigate to="/admin/verification" replace />} />
            <Route path="/admin/:section" element={<AdminPanelPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
