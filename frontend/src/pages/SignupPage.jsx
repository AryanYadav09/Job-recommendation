import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { homeByUser } from "../utils/roleHome";

const SignupPage = () => {
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
    companyName: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(homeByUser(user), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role
      };
      if (form.role === "COMPANY") payload.companyName = form.companyName;
      await register(payload);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-bg grid min-h-screen place-content-center px-4">
      <motion.form
        onSubmit={onSubmit}
        className="glass w-full max-w-lg p-7"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-2xl">Create account</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Join as a candidate or company recruiter.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input
            className="input md:col-span-2"
            type="text"
            placeholder="Full name"
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
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

          <select
            className="input md:col-span-2"
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
          >
            <option value="USER">User</option>
            <option value="COMPANY">Company</option>
          </select>

          {form.role === "COMPANY" ? (
            <input
              className="input md:col-span-2"
              placeholder="Company name"
              required
              value={form.companyName}
              onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
            />
          ) : null}
        </div>

        {error ? <p className="mt-3 text-sm text-rose-500">{error}</p> : null}

        <button className="btn-primary mt-5 w-full" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>

        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-300">
          Already have account?{" "}
          <Link className="font-semibold text-accent" to="/login">
            Login
          </Link>
        </p>
      </motion.form>
    </div>
  );
};

export default SignupPage;
