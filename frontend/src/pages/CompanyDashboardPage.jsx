import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import PageTransition from "../components/PageTransition";
import Loader from "../components/Loader";
import StatCard from "../components/StatCard";
import { formatDate } from "../utils/format";

const CompanyDashboardPage = () => {
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
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [dashboard, jobs]);

  if (loading) return <Loader />;
  if (!dashboard) return <div className="glass p-5">Unable to load dashboard</div>;

  return (
    <PageTransition>
      <section>
        <h1 className="font-display text-3xl">Company Dashboard</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Track listings, applicants, and engagement in one place.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Jobs" value={dashboard.counters.totalJobs} accent="slate" />
          <StatCard label="Active Jobs" value={dashboard.counters.activeJobs} accent="green" />
          <StatCard label="Closed Jobs" value={dashboard.counters.closedJobs} accent="blue" />
          <StatCard
            label="Applications"
            value={dashboard.counters.totalApplications}
            accent="accent"
          />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="glass p-5">
            <h2 className="section-title">Most viewed jobs</h2>
            <div className="mt-4 space-y-3">
              {topViewedJobs.length ? (
                topViewedJobs.map((job) => (
                  <article
                    key={job._id}
                    className="rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60"
                  >
                    <p className="font-semibold">{job.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {job.type} | {job.location}
                    </p>
                    <span className="badge mt-2">{job.views} views</span>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300">No views yet.</p>
              )}
            </div>
          </div>

          <div className="glass p-5">
            <h2 className="section-title">Recent applications</h2>
            <div className="mt-4 space-y-3">
              {dashboard.recentApplications.length ? (
                dashboard.recentApplications.map((app) => (
                  <article
                    key={app._id}
                    className="rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60"
                  >
                    <p className="font-semibold">{app.user?.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {app.job?.title} | {formatDate(app.createdAt)}
                    </p>
                    <span className="badge mt-2 capitalize">{app.status}</span>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300">No applications yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
};

export default CompanyDashboardPage;
