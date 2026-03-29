import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BriefcaseBusiness, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { homeByUser } from "../utils/roleHome";
import api from "../services/api";

const LoginPage = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (isAuthenticated && user) {
      const fallback = homeByUser(user);
      const fromPath = location.state?.from?.pathname;
      const target = fallback === "/onboarding" ? fallback : fromPath || fallback;
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form);
    } catch (err) {
      const msg = err.response?.data?.message || "Unable to login";
      const code = err.response?.data?.code;
      setError(msg);
      if (code === "EMAIL_UNVERIFIED") {
        setUnverifiedEmail(form.email);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage("");
    try {
      const { data } = await api.post("/auth/resend-verification", { email: unverifiedEmail });
      setResendMessage(data.message);
    } catch {
      setResendMessage("Failed to resend. Try again later.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="app-bg grid min-h-screen place-content-center px-4 py-10">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="rounded-2xl bg-accent/15 p-3 text-accent">
          <BriefcaseBusiness size={28} />
        </div>
        <p className="font-display text-xl font-semibold">JobPulse</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Smart job recommendations</p>
      </div>
      <form
        onSubmit={onSubmit}
        className="glass w-full max-w-md p-7"
      >
        <h1 className="font-display text-2xl">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Login to continue personalized job discovery.
        </p>

        <div className="mt-5 space-y-3">
          <input
            className="input"
            type="email"
            placeholder="Email"
            required
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            required
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          />
        </div>

        {error ? (
          <div className="mt-3">
            <p className="text-sm text-rose-500">{error}</p>
            {unverifiedEmail ? (
              <div className="mt-3 rounded-xl border border-sky-400/30 bg-sky-50/60 p-3 dark:bg-sky-900/20">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-sky-300">
                  <Mail size={14} /> Gmail not verified yet
                </p>
                {resendMessage ? (
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{resendMessage}</p>
                ) : null}
                <button
                  type="button"
                  className="btn-secondary mt-2 w-full text-xs"
                  onClick={handleResend}
                  disabled={resendLoading}
                >
                  {resendLoading ? "Sending..." : "Resend verification email"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        <button className="btn-primary mt-5 w-full" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-300">
          New here?{" "}
          <Link className="font-semibold text-accent" to="/signup">
            Create account
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
