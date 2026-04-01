import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, Eye, FileText, Users } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PageTransition from "../components/PageTransition";
import Loader from "../components/Loader";
import CompanyVerificationBadge from "../components/CompanyVerificationBadge";
import { formatDate, formatJobType } from "../utils/format";

const CompanyDashboardPage = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [dashboardRes, jobsRes] = await Promise.all([
      api.get("/company/dashboard"),
      api.get("/company/jobs")
    ]);

    setDashboard(dashboardRes.data);
    setJobs(jobsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData().catch(() => setLoading(false));
  }, []);

  const topViewedJobs = useMemo(() => {
    if (!dashboard) return [];

    return [...jobs]
      .map((job) => ({
        ...job,
        views: dashboard.viewsByJob?.[job._id] || 0
      }))
      .filter((job) => job.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 4);
  }, [dashboard, jobs]);

  const overview = useMemo(() => {
    const totalViews = Object.values(dashboard?.viewsByJob || {}).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    );
    const totalJobs = dashboard?.counters?.totalJobs || 0;
    const totalApplications = dashboard?.counters?.totalApplications || 0;

    return {
      totalViews,
      avgApplicationsPerJob:
        totalJobs > 0 ? (totalApplications / totalJobs).toFixed(1) : "0.0",
      latestJob: jobs[0] || null
    };
  }, [dashboard, jobs]);

  if (loading) return <Loader />;
  if (!dashboard) return <div className="glass p-5">Unable to load dashboard</div>;

  return (
    <PageTransition>
      <section className="space-y-6">
        <div className="rounded-[34px] border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-blue-100 p-6 shadow-card dark:border-slate-800 dark:bg-slate-950/70 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700/70 dark:text-sky-300/70">
                  Employer overview
                </p>
                <CompanyVerificationBadge
                  status={user?.company?.verificationStatus || dashboard.verificationStatus}
                  showAll
                />
              </div>

              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-4xl">
                {user?.company?.name || "Company"} dashboard
              </h1>
              <p className="mt-3 text-base leading-8 text-slate-600 dark:text-slate-300">
                Focus on the signals that matter most: live openings, applicant flow, and which roles are actually attracting attention.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link className="btn-primary" to="/company/jobs">
                Manage listings
              </Link>
              <Link className="btn-secondary" to="/company/applicants">
                Review applicants
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[26px] border border-white/60 bg-white/85 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                <BriefcaseBusiness size={16} /> Live hiring
              </p>
              <p className="mt-3 font-display text-4xl font-bold text-slate-950 dark:text-white">
                {dashboard.counters.activeJobs}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {dashboard.counters.totalJobs
                  ? `${dashboard.counters.totalJobs} total listings in your account`
                  : "No listings published yet"}
              </p>
            </div>

            <div className="rounded-[26px] border border-white/60 bg-white/85 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                <Users size={16} /> Applicant flow
              </p>
              <p className="mt-3 font-display text-4xl font-bold text-slate-950 dark:text-white">
                {dashboard.counters.totalApplications}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {overview.avgApplicationsPerJob} applications per job on average
              </p>
            </div>

            <div className="rounded-[26px] border border-white/60 bg-white/85 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                <Eye size={16} /> Listing attention
              </p>
              <p className="mt-3 font-display text-4xl font-bold text-slate-950 dark:text-white">
                {overview.totalViews}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Total views across your published jobs
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="glass p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="section-title">What needs attention</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  The smallest set of actions that moves the dashboard forward.
                </p>
              </div>
              <FileText className="text-sky-500" size={20} />
            </div>

            <div className="mt-4 space-y-3">
              {!dashboard.counters.totalJobs ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                  You do not have any job listings yet. Create your first listing to start receiving views and applications.
                </div>
              ) : null}

              {dashboard.counters.totalJobs > 0 && !dashboard.counters.totalApplications ? (
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                  Your jobs are live, but there are no applications yet. Review titles, salary ranges, and required skills to improve conversion.
                </div>
              ) : null}

              {dashboard.counters.totalApplications > 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                  You have active applicant flow. Review candidates from the Applicants page and keep your best-performing listings updated.
                </div>
              ) : null}

              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300">
                Latest listing:{" "}
                {overview.latestJob
                  ? `${overview.latestJob.title} posted on ${formatDate(overview.latestJob.createdAt)}`
                  : "No listing created yet"}
              </div>
            </div>
          </div>

          <div className="glass p-5">
            <h2 className="section-title">Quick snapshot</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Closed jobs</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {dashboard.counters.closedJobs}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Top viewed listing
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {topViewedJobs[0]?.title || "No views yet"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Recent application
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {dashboard.recentApplications[0]?.user?.name || "No applications yet"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="glass p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="section-title">Most viewed jobs</h2>
              <Link className="inline-flex items-center gap-2 text-sm font-semibold text-accent" to="/company/jobs">
                View listings <ArrowRight size={14} />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {topViewedJobs.length ? (
                topViewedJobs.map((job) => (
                  <article
                    key={job._id}
                    className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{job.title}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {formatJobType(job.type)} | {job.location}
                        </p>
                      </div>
                      <span className="badge">{job.views} views</span>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  No view data yet. Once candidates browse your listings, the top performers will appear here.
                </p>
              )}
            </div>
          </div>

          <div className="glass p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="section-title">Recent applications</h2>
              <Link
                className="inline-flex items-center gap-2 text-sm font-semibold text-accent"
                to="/company/applicants"
              >
                Open applicants <ArrowRight size={14} />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {dashboard.recentApplications.length ? (
                dashboard.recentApplications.map((app) => (
                  <article
                    key={app._id}
                    className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{app.user?.name}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {app.job?.title} | {formatDate(app.createdAt)}
                        </p>
                      </div>
                      <span className="badge capitalize">{app.status}</span>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  No applications yet. Once candidates apply, the latest entries will appear here.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
};

export default CompanyDashboardPage;
