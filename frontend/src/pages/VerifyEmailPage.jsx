import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BriefcaseBusiness, Loader2, XCircle } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { homeByUser } from "../utils/roleHome";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithData, loading, user } = useAuth();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let redirectTimer = null;
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the link.");
      return undefined;
    }

    api
      .get(`/auth/verify-email/${token}`)
      .then(({ data }) => {
        loginWithData(data.token, data.user);
        setStatus("redirecting");
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.message || "Verification failed. The link may have expired."
        );
      });

    return () => {
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [loginWithData, navigate, searchParams]);

  useEffect(() => {
    if (status !== "redirecting" || loading || !user) return;

    navigate(homeByUser(user), { replace: true });
  }, [loading, navigate, status, user]);

  return (
    <div className="app-bg grid min-h-screen place-content-center px-4 py-10">
      <div className="glass w-full max-w-md p-8 text-center">
        <div className="mb-5 flex justify-center">
          <div className="rounded-2xl bg-accent/15 p-3 text-accent">
            <BriefcaseBusiness size={28} />
          </div>
        </div>

        {status === "verifying" ? (
          <>
            <Loader2 size={40} className="mx-auto animate-spin text-accent" />
            <h1 className="mt-4 font-display text-xl font-semibold">Verifying your email...</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Please wait a moment.
            </p>
          </>
        ) : null}

        {status === "redirecting" ? (
          <>
            <Loader2 size={40} className="mx-auto animate-spin text-accent" />
            <h1 className="mt-4 font-display text-2xl font-semibold">Signing you in</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message}</p>
            <p className="mt-3 text-xs text-slate-400">Preparing your dashboard...</p>
          </>
        ) : null}

        {status === "error" ? (
          <>
            <XCircle size={48} className="mx-auto text-rose-500" />
            <h1 className="mt-4 font-display text-2xl font-semibold">Verification failed</h1>
            <p className="mt-2 text-sm text-rose-500">{message}</p>
            <div className="mt-5 flex flex-col gap-2">
              <button className="btn-primary w-full" onClick={() => navigate("/signup")}>
                Sign up again
              </button>
              <button className="btn-secondary w-full" onClick={() => navigate("/login")}>
                Back to login
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
