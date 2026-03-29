import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BriefcaseBusiness, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { homeByUser } from "../utils/roleHome";
import api from "../services/api";

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
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

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
      setRegisteredEmail(form.email);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const { data } = await api.post("/auth/resend-verification", { email: registeredEmail });
      setResendMessage(data.message);
    } catch {
      setResendMessage("Failed to resend. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  // Show success / check-your-email state
  if (registeredEmail) {
    return (
      <div className="app-bg grid min-h-screen place-content-center px-4 py-10">
        <div className="glass w-full max-w-md p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-2xl bg-sky-100 p-4 dark:bg-sky-900/30">
              <Mail size={36} className="text-accent" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-semibold">Check your Gmail!</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            We sent a verification link to{" "}
            <span className="font-semibold text-accent">{registeredEmail}</span>.
            Click the link to activate your account.
          </p>
          <p className="mt-4 text-xs text-slate-400">The link expires in 24 hours.</p>

          {resendMessage ? (
            <p className="mt-4 rounded-xl border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-700 dark:text-sky-300">
              {resendMessage}
            </p>
          ) : null}

          <button
            className="btn-secondary mt-5 w-full"
            onClick={handleResend}
            disabled={resendLoading}
          >
            {resendLoading ? "Sending..." : "Resend verification email"}
          </button>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            Already verified?{" "}
            <Link className="font-semibold text-accent" to="/login">Login</Link>
          </p>
        </div>
      </div>
    );
  }

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
        className="glass w-full max-w-lg p-7"
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
      </form>
    </div>
  );
};

export default SignupPage;
