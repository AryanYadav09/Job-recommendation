import { useEffect, useMemo, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { BriefcaseBusiness, Building2, Search, ShieldCheck, Users } from "lucide-react";
import api from "../services/api";
import PageTransition from "../components/PageTransition";
import Loader from "../components/Loader";
import CompanyVerificationBadge from "../components/CompanyVerificationBadge";
import CompanyVerificationInsights from "../components/CompanyVerificationInsights";
import { formatDate, toAbsoluteAssetUrl } from "../utils/format";

const adminSections = [
  { key: "verification", label: "Verification Queue", icon: ShieldCheck },
  { key: "users", label: "Users", icon: Users },
  { key: "companies", label: "Companies", icon: Building2 },
  { key: "jobs", label: "Jobs", icon: BriefcaseBusiness }
];

const sectionLinkClass = ({ isActive }) =>
  `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-accent text-white shadow-glow"
      : "bg-white text-slate-700 hover:bg-sky-50 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:bg-slate-800"
  }`;

const AdminPanelPage = () => {
  const { section = "verification" } = useParams();
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [reviewNotes, setReviewNotes] = useState({});
  const [reviewingId, setReviewingId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const activeSection = adminSections.find((item) => item.key === section) || adminSections[0];

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

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!normalizedSearch) return users;

    return users.filter((user) =>
      [user.name, user.email, user.role, user.company?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [normalizedSearch, users]);

  const filteredCompanies = useMemo(() => {
    if (!normalizedSearch) return companies;

    return companies.filter((company) =>
      [
        company.name,
        company.owner?.name,
        company.owner?.email,
        company.industry,
        company.businessEmail,
        company.registrationNumber,
        company.registrationJurisdiction,
        company.verificationStatus
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [companies, normalizedSearch]);

  const filteredJobs = useMemo(() => {
    if (!normalizedSearch) return jobs;

    return jobs.filter((job) =>
      [job.title, job.company?.name, job.type, job.status, job.location, job.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [jobs, normalizedSearch]);

  const filteredPendingCompanies = useMemo(() => {
    if (!normalizedSearch) return pendingCompanies;

    return pendingCompanies.filter((company) =>
      [
        company.name,
        company.owner?.name,
        company.owner?.email,
        company.businessEmail,
        company.registrationNumber,
        company.registrationJurisdiction,
        company.verificationStatus,
        company.verificationAnalysis?.recommendation,
        ...(company.verificationAnalysis?.matchedSignals || []),
        ...(company.verificationAnalysis?.riskFlags || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [normalizedSearch, pendingCompanies]);

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
      <section className="space-y-6">
        <div>
          <h1 className="font-display text-3xl">Admin Panel</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            Manage users, companies, jobs, and verification reviews from separate sections.
          </p>
        </div>

        {message ? (
          <p className="rounded-xl border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-700 dark:text-sky-300">
            {message}
          </p>
        ) : null}

        <div className="glass p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {adminSections.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink key={item.key} className={sectionLinkClass} to={`/admin/${item.key}`}>
                    <Icon size={16} />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>

            <div className="input-shell w-full xl:w-96">
              <Search className="input-icon" size={16} />
              <input
                className="input-field"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={`Search ${activeSection.label.toLowerCase()}`}
              />
            </div>
          </div>
        </div>

        {section === "verification" ? (
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
              {filteredPendingCompanies.length ? (
                filteredPendingCompanies.map((company) => {
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
                  No companies matched this search in the verification queue.
                </p>
              )}
            </div>
          </div>
        ) : null}

        {section === "users" ? (
          <div className="glass overflow-x-auto p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="section-title">Users</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Search by name, email, role, or linked company.
                </p>
              </div>
              <span className="badge">{filteredUsers.length} results</span>
            </div>
            <table className="mt-3 min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Company</th>
                  <th className="py-2">Joined</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length ? (
                  filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="border-t border-slate-200/60 dark:border-slate-700/60"
                    >
                      <td className="py-2">{user.name}</td>
                      <td className="py-2">{user.email}</td>
                      <td className="py-2">{user.role}</td>
                      <td className="py-2">{user.company?.name || "-"}</td>
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
                  ))
                ) : (
                  <tr>
                    <td className="py-4 text-slate-600 dark:text-slate-300" colSpan="6">
                      No users matched your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {section === "companies" ? (
          <div className="glass overflow-x-auto p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="section-title">Companies</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Search by company, owner, registration details, or verification status.
                </p>
              </div>
              <span className="badge">{filteredCompanies.length} results</span>
            </div>
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
                {filteredCompanies.length ? (
                  filteredCompanies.map((company) => (
                    <tr
                      key={company._id}
                      className="border-t border-slate-200/60 dark:border-slate-700/60"
                    >
                      <td className="py-2">{company.name}</td>
                      <td className="py-2">{company.owner?.name || "-"}</td>
                      <td className="py-2">{company.industry || "-"}</td>
                      <td className="py-2">{company.totalJobs}</td>
                      <td className="py-2">
                        <CompanyVerificationBadge status={company.verificationStatus} showAll />
                      </td>
                      <td className="py-2">
                        {company.verificationAnalysis?.authenticityScore || 0}/100
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-4 text-slate-600 dark:text-slate-300" colSpan="6">
                      No companies matched your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {section === "jobs" ? (
          <div className="glass overflow-x-auto p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="section-title">Jobs</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Search by title, company, type, location, category, or status.
                </p>
              </div>
              <span className="badge">{filteredJobs.length} results</span>
            </div>
            <table className="mt-3 min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="py-2">Title</th>
                  <th className="py-2">Company</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Location</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.length ? (
                  filteredJobs.map((job) => (
                    <tr
                      key={job._id}
                      className="border-t border-slate-200/60 dark:border-slate-700/60"
                    >
                      <td className="py-2">{job.title}</td>
                      <td className="py-2">{job.company?.name || "-"}</td>
                      <td className="py-2">{job.type}</td>
                      <td className="py-2">{job.location || "-"}</td>
                      <td className="py-2">{job.status}</td>
                      <td className="py-2">
                        <button className="btn-secondary" onClick={() => handleDeleteJob(job._id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-4 text-slate-600 dark:text-slate-300" colSpan="6">
                      No jobs matched your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </PageTransition>
  );
};

export default AdminPanelPage;
