import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, MessageCircleMore, Sparkles, Wallet } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useMessaging } from "../context/MessagingContext";
import Loader from "../components/Loader";
import PageTransition from "../components/PageTransition";
import CompanyVerificationBadge from "../components/CompanyVerificationBadge";
import ProfileIdentityLink from "../components/ProfileIdentityLink";
import { formatJobType, formatRelativeTime } from "../utils/format";

const JobDetailsPage = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const { ensureConversation } = useMessaging();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [openingChat, setOpeningChat] = useState(false);

  const isUser = useMemo(() => user?.role === "USER", [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/jobs/${jobId}`);
        setJob(data);

        if (isUser) {
          await api.post(`/jobs/${jobId}/view`);
          const [profile, activity] = await Promise.all([
            api.get("/users/profile"),
            api.get("/users/activity")
          ]);
          const savedIds = (profile.data.savedJobs || []).map((item) => String(item._id));
          setSaved(savedIds.includes(jobId));
          const appliedIds = (activity.data.applications || []).map((item) => String(item.job?._id));
          setApplied(appliedIds.includes(jobId));
        }
      } finally {
        setLoading(false);
      }
    };

    load().catch(() => setLoading(false));
  }, [jobId, isUser]);

  const onSave = async () => {
    try {
      const { data } = await api.post(`/jobs/${jobId}/save`);
      setSaved(data.saved);
      setMessage(data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save job");
    }
  };

  const onApply = async () => {
    try {
      await api.post(`/jobs/${jobId}/apply`, {});
      setApplied(true);
      setMessage("Application submitted");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not apply to job");
    }
  };

  const onOpenConversation = async () => {
    if (!job?.company?._id) return;

    setOpeningChat(true);

    try {
      await ensureConversation({ targetCompanyId: job.company._id });
      setMessage("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not open conversation");
    } finally {
      setOpeningChat(false);
    }
  };

  if (loading) return <Loader />;
  if (!job)
    return (
      <div className="glass p-5 text-sm text-rose-500">
        Job not found.
      </div>
    );

  return (
    <PageTransition>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[34px] bg-slate-950 p-6 text-white shadow-lifted md:p-8">
          <div className="absolute -left-12 top-8 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute right-0 top-0 h-60 w-60 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative">
            <button
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} /> Back to jobs
            </button>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                {formatJobType(job.type)}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                {job.category}
              </span>
            </div>

            <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              {job.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-base text-slate-300">
              <ProfileIdentityLink
                role="COMPANY"
                id={job.company?._id}
                name={job.company?.name}
                subtitle={job.company?.industry || job.location}
                avatarUrl={job.company?.logoUrl}
                size="sm"
                nameClassName="text-white"
                subtitleClassName="text-slate-300"
              />
              <CompanyVerificationBadge status={job.company?.verificationStatus} />
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} /> {job.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wallet size={15} /> {job.salaryRange || "Compensation shared during hiring"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles size={15} /> Posted {formatRelativeTime(job.createdAt)}
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.5fr_0.95fr]">
          <div className="glass p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700/70 dark:text-sky-300/70">
              Role overview
            </p>
            <p className="mt-4 text-base leading-8 text-slate-700 dark:text-slate-200">
              {job.description}
            </p>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700/70 dark:text-sky-300/70">
                Key skills
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(job.requiredSkills || []).map((skill) => (
                  <span className="badge" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="glass p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700/70 dark:text-sky-300/70">
                Role snapshot
              </p>
              <div className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Company</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <ProfileIdentityLink
                      role="COMPANY"
                      id={job.company?._id}
                      name={job.company?.name}
                      subtitle={job.company?.industry || job.location}
                      avatarUrl={job.company?.logoUrl}
                      size="sm"
                    />
                    <CompanyVerificationBadge status={job.company?.verificationStatus} />
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Location</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">{job.location}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Job type</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {formatJobType(job.type)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Compensation</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {job.salaryRange || "Compensation shared during hiring"}
                  </p>
                </div>
              </div>
            </div>

            {message ? (
              <p className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-300">
                {message}
              </p>
            ) : null}

            {isUser ? (
              <div className="glass p-5">
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={onSave}>
                    {saved ? "Saved" : "Save job"}
                  </button>
                  <button
                    className={applied ? "btn-secondary" : "btn-primary"}
                    onClick={onApply}
                    disabled={applied}
                  >
                    {applied ? "Applied" : "Apply now"}
                  </button>
                  {applied ? (
                    <button
                      className="btn-secondary"
                      onClick={onOpenConversation}
                      disabled={openingChat}
                    >
                      <span className="inline-flex items-center gap-2">
                        <MessageCircleMore size={15} />
                        {openingChat ? "Opening..." : "Message company"}
                      </span>
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </aside>
        </section>
      </div>
    </PageTransition>
  );
};

export default JobDetailsPage;
