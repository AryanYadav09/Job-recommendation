import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import PageTransition from "../components/PageTransition";
import Loader from "../components/Loader";
import CompanyVerificationBadge from "../components/CompanyVerificationBadge";
import CompanyVerificationInsights from "../components/CompanyVerificationInsights";
import { formatDate, toAbsoluteAssetUrl } from "../utils/format";

const AdminPanelPage = () => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [reviewNotes, setReviewNotes] = useState({});
  const [reviewingId, setReviewingId] = useState("");

  const fetchData = async () => {
    const [usersRes, companiesRes, jobsRes] = await Promise.all([
      api.get("/admin/users"),
      api.get("/admin/companies"),
      api.get("/admin/jobs")
    ]);

    setUsers(usersRes.data);
    setCompanies(companiesRes.data);
    setJobs(jobsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData().catch(() => setLoading(false));
  }, []);

  const pendingCompanies = useMemo(
    () => companies.filter((company) => company.verificationStatus === "PENDING"),
    [companies]
  );

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      setMessage("User removed");
      fetchData().catch(() => null);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to remove user");
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Delete this job?")) return;

    try {
      await api.delete(`/admin/jobs/${jobId}`);
      setMessage("Job removed");
      fetchData().catch(() => null);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to remove job");
    }
  };

  const handleReview = async (companyId, status) => {
    setReviewingId(`${companyId}-${status}`);

    try {
      const { data } = await api.patch(`/admin/companies/${companyId}/verification`, {
        status,
        notes: reviewNotes[companyId] || ""
      });
      setMessage(data.message);
      setReviewNotes((prev) => ({ ...prev, [companyId]: "" }));
      await fetchData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update verification");
    } finally {
      setReviewingId("");
    }
  };

  if (loading) return <Loader />;

  return (
    <PageTransition>
      <section>
        <h1 className="font-display text-3xl">Admin Panel</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Monitor users, jobs, and employer verification reviews.
        </p>

        {message ? (
          <p className="mt-4 rounded-xl border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-700 dark:text-sky-300">
            {message}
          </p>
        ) : null}

        <div className="mt-6 grid gap-6">
          <div className="glass p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="section-title">Verification Queue</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Review OCR results, score signals, and registry checks before approval.
                </p>
              </div>
              <CompanyVerificationBadge
                status={pendingCompanies.length ? "PENDING" : "VERIFIED"}
                showAll
              />
            </div>

            <div className="mt-4 space-y-4">
              {pendingCompanies.length ? (
                pendingCompanies.map((company) => {
                  const certificateUrl = toAbsoluteAssetUrl(company.certificate?.path || "");

                  return (
                    <article
                      key={company._id}
                      className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/60"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-lg font-semibold">{company.name}</p>
                              <CompanyVerificationBadge status={company.verificationStatus} showAll />
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              Owner: {company.owner?.name || "-"} ({company.owner?.email || "-"})
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              Business email: {company.businessEmail || "-"}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              Registration number: {company.registrationNumber || "-"}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              Jurisdiction: {company.registrationJurisdiction || "-"}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              Submitted:{" "}
                              {company.verificationSubmittedAt
                                ? formatDate(company.verificationSubmittedAt)
                                : "-"}
                            </p>
                            {company.certificate?.path ? (
                              <a
                                className="inline-flex text-sm font-semibold text-accent"
                                href={certificateUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open certificate
                              </a>
                            ) : null}
                          </div>

                          <div className="w-full max-w-md space-y-3">
                            <textarea
                              className="input min-h-24"
                              placeholder="Admin note (optional)"
                              value={reviewNotes[company._id] || ""}
                              onChange={(e) =>
                                setReviewNotes((prev) => ({
                                  ...prev,
                                  [company._id]: e.target.value
                                }))
                              }
                            />
                            <div className="flex flex-wrap gap-2">
                              <button
                                className="btn-primary"
                                onClick={() => handleReview(company._id, "VERIFIED")}
                                disabled={Boolean(reviewingId)}
                              >
                                {reviewingId === `${company._id}-VERIFIED`
                                  ? "Approving..."
                                  : "Approve"}
                              </button>
                              <button
                                className="btn-secondary"
                                onClick={() => handleReview(company._id, "REJECTED")}
                                disabled={Boolean(reviewingId)}
                              >
                                {reviewingId === `${company._id}-REJECTED`
                                  ? "Rejecting..."
                                  : "Reject"}
                              </button>
                            </div>
                          </div>
                        </div>

                        <CompanyVerificationInsights company={company} showPreview />
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  No companies are waiting for review.
                </p>
              )}
            </div>
          </div>

          <div className="glass overflow-x-auto p-5">
            <h2 className="section-title">Users</h2>
            <table className="mt-3 min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Joined</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-t border-slate-200/60 dark:border-slate-700/60">
                    <td className="py-2">{user.name}</td>
                    <td className="py-2">{user.email}</td>
                    <td className="py-2">{user.role}</td>
                    <td className="py-2">{formatDate(user.createdAt)}</td>
                    <td className="py-2">
                      {user.role !== "ADMIN" ? (
                        <button className="btn-secondary" onClick={() => handleDeleteUser(user._id)}>
                          Remove
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="glass overflow-x-auto p-5">
            <h2 className="section-title">Companies</h2>
            <table className="mt-3 min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="py-2">Name</th>
                  <th className="py-2">Owner</th>
                  <th className="py-2">Industry</th>
                  <th className="py-2">Jobs</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company._id} className="border-t border-slate-200/60 dark:border-slate-700/60">
                    <td className="py-2">{company.name}</td>
                    <td className="py-2">{company.owner?.name || "-"}</td>
                    <td className="py-2">{company.industry || "-"}</td>
                    <td className="py-2">{company.totalJobs}</td>
                    <td className="py-2">
                      <CompanyVerificationBadge status={company.verificationStatus} showAll />
                    </td>
                    <td className="py-2">{company.verificationAnalysis?.authenticityScore || 0}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="glass overflow-x-auto p-5">
            <h2 className="section-title">Jobs</h2>
            <table className="mt-3 min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="py-2">Title</th>
                  <th className="py-2">Company</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id} className="border-t border-slate-200/60 dark:border-slate-700/60">
                    <td className="py-2">{job.title}</td>
                    <td className="py-2">{job.company?.name || "-"}</td>
                    <td className="py-2">{job.type}</td>
                    <td className="py-2">{job.status}</td>
                    <td className="py-2">
                      <button className="btn-secondary" onClick={() => handleDeleteJob(job._id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </PageTransition>
  );
};

export default AdminPanelPage;
