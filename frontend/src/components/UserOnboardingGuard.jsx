import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const UserOnboardingGuard = () => {
  const { user } = useAuth();

  if (user?.role === "USER" && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

export default UserOnboardingGuard;
