import { useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  Building2,
  Compass,
  FileUser,
  Moon,
  Search,
  Settings2,
  Shield,
  Sparkles,
  Sun,
  UserCircle2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const linkStyle = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-accent text-white shadow-glow"
      : "text-slate-700 hover:bg-sky-50 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
  }`;

const plainLinkStyle =
  "rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const setupPending = user?.role === "USER" && !user.onboardingCompleted;
  const showSearchBar = useMemo(() => !user || user.role === "USER", [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const value = searchTerm.trim();
    navigate(value ? `/jobs?search=${encodeURIComponent(value)}` : "/jobs");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-sky-100/80 bg-white/80 backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-[88rem] items-center gap-4 px-4 py-3 md:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-accent to-accent2 p-2.5 text-white shadow-glow">
            <BriefcaseBusiness size={20} />
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight">JobPulse</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Modern job discovery</p>
          </div>
        </Link>

        {showSearchBar ? (
          <form
            onSubmit={handleSearchSubmit}
            className="hidden flex-1 lg:flex lg:max-w-md lg:items-center"
          >
            <div className="input-shell w-full">
              <Search className="input-icon" size={16} />
              <input
                className="input-field"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search jobs, skills, or companies"
              />
            </div>
          </form>
        ) : (
          <div className="hidden flex-1 lg:block" />
        )}

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
                <NavLink to="/dashboard" className={linkStyle}>
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles size={15} /> Dashboard
                  </span>
                </NavLink>
                <NavLink to="/jobs" className={linkStyle}>
                  <span className="inline-flex items-center gap-1.5">
                    <Search size={15} /> Search jobs
                  </span>
                </NavLink>
                <Link to="/dashboard#top-matches" className={plainLinkStyle}>
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles size={15} /> Top matches
                  </span>
                </Link>
                <Link to="/dashboard#job-results" className={plainLinkStyle}>
                  <span className="inline-flex items-center gap-1.5">
                    <Compass size={15} /> Explore
                  </span>
                </Link>
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
                <NavLink to="/company/applicants" className={linkStyle}>
                  <span className="inline-flex items-center gap-1">
                    <FileUser size={15} /> Applicants
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
              <NavLink to="/admin/verification" className={linkStyle}>
                <span className="inline-flex items-center gap-1">
                  <Shield size={15} /> Admin
                </span>
              </NavLink>
            )}
          </nav>
        ) : (
          <nav className="hidden items-center gap-2 md:flex">
            <NavLink to="/" className={linkStyle}>
              Home
            </NavLink>
            <NavLink to="/jobs" className={linkStyle}>
              <span className="inline-flex items-center gap-1.5">
                <Search size={15} /> Search jobs
              </span>
            </NavLink>
            <Link to="/signup?role=COMPANY" className={plainLinkStyle}>
              For employers
            </Link>
          </nav>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:bg-slate-800"
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
            <>
              <Link
                className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 md:inline-flex"
                to="/signup?role=COMPANY"
              >
                Employer signup
              </Link>
              <Link className="btn-secondary" to="/login">
                Login
              </Link>
              <Link className="btn-primary" to="/signup?role=USER">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
