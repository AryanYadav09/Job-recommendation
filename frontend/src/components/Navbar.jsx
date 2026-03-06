import { NavLink, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  Building2,
  Moon,
  Settings2,
  Shield,
  Sun,
  UserCircle2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const linkStyle = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-accent text-white"
      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
  }`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const setupPending = user?.role === "USER" && !user.onboardingCompleted;

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/75 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/75">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-accent/15 p-2 text-accent">
            <BriefcaseBusiness size={20} />
          </div>
          <div>
            <p className="font-display text-lg">JobPulse</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Smart recommendations</p>
          </div>
        </div>

        {user ? (
          <nav className="hidden items-center gap-2 md:flex">
            {setupPending ? (
              <NavLink to="/onboarding" className={linkStyle}>
                <span className="inline-flex items-center gap-1">
                  <Settings2 size={15} /> Setup profile
                </span>
              </NavLink>
            ) : null}

            {user.role === "USER" && !setupPending && (
              <>
                <NavLink to="/jobs" className={linkStyle}>
                  Jobs
                </NavLink>
                <NavLink to="/profile" className={linkStyle}>
                  Profile
                </NavLink>
              </>
            )}
            {user.role === "COMPANY" && (
              <>
                <NavLink to="/company/dashboard" className={linkStyle}>
                  <span className="inline-flex items-center gap-1">
                    <Building2 size={15} /> Dashboard
                  </span>
                </NavLink>
                <NavLink to="/company/jobs" className={linkStyle}>
                  Listings
                </NavLink>
                <NavLink to="/company/profile" className={linkStyle}>
                  Company
                </NavLink>
              </>
            )}
            {user.role === "ADMIN" && (
              <NavLink to="/admin" className={linkStyle}>
                <span className="inline-flex items-center gap-1">
                  <Shield size={15} /> Admin
                </span>
              </NavLink>
            )}
          </nav>
        ) : null}

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-lg border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user ? (
            <>
              <span className="hidden text-sm font-semibold text-slate-600 dark:text-slate-300 md:inline-flex md:items-center md:gap-1">
                <UserCircle2 size={16} /> {user.name}
              </span>
              <button className="btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={() => navigate("/login")}>
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
