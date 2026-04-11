import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Mail,
  MapPin,
  MessageCircleMore,
  Sparkles,
  UserRound
} from "lucide-react";
import api from "../services/api";
import { useMessaging } from "../context/MessagingContext";
import PageTransition from "../components/PageTransition";
import Loader from "../components/Loader";
import ProfileIdentityLink from "../components/ProfileIdentityLink";
import { formatDate, formatJobType } from "../utils/format";

const statusOptions = ["all", "submitted", "reviewing", "shortlisted", "rejected", "hired"];

const statusButtonClass = (active) =>
  active
    ? "bg-accent text-white shadow-glow"
    : "bg-white text-slate-700 hover:bg-sky-50 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:bg-slate-800";

const CompanyApplicantsPage = () => {
  const { ensureConversation } = useMessaging();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [openingChatUserId, setOpeningChatUserId] = useState("");

  const loadApplications = async () => {
    try {
      const { data: response } = await api.get("/company/applications");
      setData(response);
      setMessage("");
    } catch (error) {
      if (error.response?.status === 404) {
        setMessage("Applicants endpoint not found. Restart the backend server.");
      } else {
        setMessage(error.response?.data?.message || "Unable to load applicants");
      }
      setData({
        applications: [],
        counters: {
          total: 0,
          submitted: 0,
          reviewing: 0,
          shortlisted: 0,
          rejected: 0,
          hired: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    const items = data?.applications || [];
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((application) => {
      if (activeStatus !== "all" && application.status !== activeStatus) return false;

      if (!normalizedSearch) return true;

      const haystack = [
        application.user?.name,
        application.user?.email,
        application.user?.location,
        application.job?.title,
        application.job?.location,
        ...(application.user?.skills || []),
        ...(application.user?.desiredRoles || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [activeStatus, data?.applications, searchTerm]);

  const statusCounts = useMemo(
    () => ({
      all: data?.counters?.total || 0,
      submitted: data?.counters?.submitted || 0,
      reviewing: data?.counters?.reviewing || 0,
      shortlisted: data?.counters?.shortlisted || 0,
      rejected: data?.counters?.rejected || 0,
      hired: data?.counters?.hired || 0
    }),
    [data?.counters]
  );

  const updateStatus = async (applicationId, status) => {
    setUpdatingId(`${applicationId}-${status}`);

    try {
      const { data: response } = await api.patch(`/company/applications/${applicationId}`, {
        status
      });

      setData((prev) => {
        if (!prev) return prev;

        const applications = prev.applications.map((application) =>
          application._id === applicationId ? response.application : application
        );

        const counters = applications.reduce(
          (acc, application) => {
            acc[application.status] = (acc[application.status] || 0) + 1;
            return acc;
          },
          {
            total: applications.length,
            submitted: 0,
            reviewing: 0,
            shortlisted: 0,
            rejected: 0,
            hired: 0
          }
        );

        return {
          applications,
          counters
        };
      });

      setMessage(response.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update application");
    } finally {
      setUpdatingId("");
    }
  };

  const handleStartConversation = async (userId) => {
    if (!userId) return;

    setOpeningChatUserId(userId);

    try {
      await ensureConversation({ targetUserId: userId });
      setMessage("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to open conversation");
    } finally {
      setOpeningChatUserId("");
    }
  };

  if (loading) return <Loader />;
  if (!data) return <div className="glass p-5">Unable to load applicants</div>;

  return (
    <PageTransition>
      <section className="space-y-6">
        <div className="rounded-[34px] border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-blue-100 p-6 shadow-card dark:border-slate-800 dark:bg-slate-950/70 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700/70 dark:text-sky-300/70">
            Hiring pipeline
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-4xl">
            Applicants
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
            Review every application in one place, move candidates through the pipeline, and focus on the people most worth following up with.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-[24px] border border-white/60 bg-white/85 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total</p>
              <p className="mt-2 font-display text-3xl font-bold text-slate-950 dark:text-white">
                {data.counters.total}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/60 bg-white/85 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Submitted</p>
              <p className="mt-2 font-display text-3xl font-bold text-slate-950 dark:text-white">
                {data.counters.submitted}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/60 bg-white/85 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Reviewing</p>
              <p className="mt-2 font-display text-3xl font-bold text-slate-950 dark:text-white">
                {data.counters.reviewing}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/60 bg-white/85 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Shortlisted</p>
              <p className="mt-2 font-display text-3xl font-bold text-slate-950 dark:text-white">
                {data.counters.shortlisted}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/60 bg-white/85 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Hired</p>
              <p className="mt-2 font-display text-3xl font-bold text-slate-950 dark:text-white">
                {data.counters.hired}
              </p>
            </div>
          </div>
        </div>

        <div className="glass p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="section-title">Review applications</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Filter by status and update candidates directly from this page.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
              <div className="input-shell w-full lg:w-80">
                <input
                  className="input-field"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by applicant, job, skill, or email"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${statusButtonClass(
                      activeStatus === status
                    )}`}
                    onClick={() => setActiveStatus(status)}
                  >
                    {status === "all" ? "All" : status} ({statusCounts[status]})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {message ? (
            <p className="mt-4 rounded-xl border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-700 dark:text-sky-300">
              {message}
            </p>
          ) : null}

          <div className="mt-5 space-y-4">
            {filteredApplications.length ? (
              filteredApplications.map((application) => (
                <article
                  key={application._id}
                  className="rounded-[28px] border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <ProfileIdentityLink
                          role="USER"
                          id={application.user?._id}
                          name={application.user?.name}
                          subtitle={application.user?.location || application.user?.email}
                          size="lg"
                        />
                        <span className="badge capitalize">{application.status}</span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Mail size={14} /> {application.user?.email}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={14} /> {application.user?.location || "Location not set"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <BriefcaseBusiness size={14} /> {application.job?.title || "Job removed"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Sparkles size={14} /> {formatDate(application.createdAt)}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/70">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            Candidate snapshot
                          </p>
                          <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                            <p>
                              <span className="font-semibold">Experience:</span>{" "}
                              {application.user?.experienceLevel || "-"}
                            </p>
                            <p>
                              <span className="font-semibold">Desired roles:</span>{" "}
                              {application.user?.desiredRoles?.length
                                ? application.user.desiredRoles.join(", ")
                                : "Not specified"}
                            </p>
                            <p>
                              <span className="font-semibold">Job type:</span>{" "}
                              {application.job?.type ? formatJobType(application.job.type) : "-"}
                            </p>
                            <p>
                              <span className="font-semibold">Job location:</span>{" "}
                              {application.job?.location || "-"}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/70">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            Skills
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {application.user?.skills?.length ? (
                              application.user.skills.map((skill) => (
                                <span key={`${application._id}-${skill}`} className="badge">
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                No skills added by candidate.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {application.coverLetter ? (
                        <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-950/50">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            Cover letter
                          </p>
                          <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-200">
                            {application.coverLetter}
                          </p>
                        </div>
                      ) : null}

                      {application.resumeUrl ? (
                        <div className="mt-4">
                          <a
                            className="inline-flex items-center gap-2 text-sm font-semibold text-accent"
                            href={application.resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <UserRound size={14} /> Open resume
                          </a>
                        </div>
                      ) : null}
                    </div>

                    <div className="w-full max-w-sm rounded-[24px] border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-950/70">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Review actions
                      </p>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        Move this applicant through the hiring pipeline.
                      </p>
                      <button
                        className="btn-primary mt-4 w-full"
                        onClick={() => handleStartConversation(application.user?._id)}
                        disabled={openingChatUserId === application.user?._id}
                      >
                        <span className="inline-flex items-center gap-2">
                          <MessageCircleMore size={15} />
                          {openingChatUserId === application.user?._id
                            ? "Opening chat..."
                            : "Message applicant"}
                        </span>
                      </button>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {["reviewing", "shortlisted", "rejected", "hired"].map((status) => (
                          <button
                            key={`${application._id}-${status}`}
                            className="btn-secondary capitalize"
                            onClick={() => updateStatus(application._id, status)}
                            disabled={Boolean(updatingId)}
                          >
                            {updatingId === `${application._id}-${status}` ? "Saving..." : status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                No applications found for this filter.
              </div>
            )}
          </div>
        </div>
      </section>
    </PageTransition>
  );
};

export default CompanyApplicantsPage;
