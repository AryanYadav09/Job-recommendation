import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { homeByUser } from "../utils/roleHome";

const LoginPage = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      setError(err.response?.data?.message || "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-bg grid min-h-screen place-content-center px-4">
      <motion.form
        onSubmit={onSubmit}
        className="glass w-full max-w-md p-7"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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

        {error ? <p className="mt-3 text-sm text-rose-500">{error}</p> : null}

        <button className="btn-primary mt-5 w-full" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-300">
          New here?{" "}
          <Link className="font-semibold text-accent" to="/signup">
            Create account
          </Link>
        </p>
      </motion.form>
    </div>
  );
};

export default LoginPage;
