import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PageTransition from "../components/PageTransition";
import Loader from "../components/Loader";
import CompanyVerificationBadge from "../components/CompanyVerificationBadge";
import { parseTagsInput, formatDate } from "../utils/format";

const initialForm = {
  title: "",
  description: "",
  requiredSkills: "",
  category: "",
  location: "",
  type: "remote",
  salaryRange: "",
  salaryMin: "",
  salaryMax: "",
  status: "active"
};

const ManageJobsPage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState("");
  const [applicantData, setApplicantData] = useState(null);
  const [message, setMessage] = useState("");

  const loadJobs = async () => {
    const { data } = await api.get("/company/jobs");
    setJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadJobs().catch(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      requiredSkills: parseTagsInput(form.requiredSkills),
      salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : null
    };

    try {
      if (editingId) {
        await api.put(`/company/jobs/${editingId}`, payload);
        setMessage("Job updated successfully");
      } else {
        await api.post("/company/jobs", payload);
        setMessage("Job created successfully");
      }
      resetForm();
      loadJobs().catch(() => null);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save job");
    }
  };

  const onEdit = (job) => {
    setEditingId(job._id);
    setForm({
      title: job.title,
      description: job.description,
      requiredSkills: (job.requiredSkills || []).join(", "),
      category: job.category,
      location: job.location,
      type: job.type,
      salaryRange: job.salaryRange || "",
      salaryMin: job.salaryMin ?? "",
      salaryMax: job.salaryMax ?? "",
      status: job.status
    });
  };

  const onDelete = async (jobId) => {
    const confirmed = window.confirm("Delete this job?");
    if (!confirmed) return;

    try {
      await api.delete(`/company/jobs/${jobId}`);
      setMessage("Job deleted");
      if (editingId === jobId) resetForm();
      loadJobs().catch(() => null);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to delete");
    }
  };

  const onViewApplicants = async (jobId) => {
    try {
      const { data } = await api.get(`/company/jobs/${jobId}/applicants`);
      setApplicantData(data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load applicants");
    }
  };

  if (loading) return <Loader />;

  return (
    <PageTransition>
      <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <form className="glass p-6" onSubmit={handleSubmit}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="section-title">{editingId ? "Edit Job" : "Post New Job"}</h1>
            <CompanyVerificationBadge status={user?.company?.verificationStatus} showAll />
          </div>

          {user?.company?.verificationStatus !== "VERIFIED" ? (
            <p className="mt-3 rounded-xl border border-amber-300/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300">
              Complete company verification in the Company Profile page before creating new jobs.
            </p>
          ) : null}

          <div className="mt-4 space-y-3">
            <input
              className="input"
              placeholder="Job title"
              required
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <textarea
              className="input min-h-28"
              placeholder="Description"
              required
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Required skills (comma separated)"
              required
              value={form.requiredSkills}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, requiredSkills: e.target.value }))
              }
            />
            <input
              className="input"
              placeholder="Category"
              required
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Location"
              required
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            />

            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              >
                <option value="remote">Remote</option>
                <option value="full-time">Full Time</option>
                <option value="internship">Internship</option>
                <option value="part-time">Part Time</option>
                <option value="hybrid">Hybrid</option>
              </select>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <input
              className="input"
              placeholder="Salary range"
              value={form.salaryRange}
              onChange={(e) => setForm((prev) => ({ ...prev, salaryRange: e.target.value }))}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="input"
                type="number"
                min="0"
                placeholder="Salary min"
                value={form.salaryMin}
                onChange={(e) => setForm((prev) => ({ ...prev, salaryMin: e.target.value }))}
              />
              <input
                className="input"
                type="number"
                min="0"
                placeholder="Salary max"
                value={form.salaryMax}
                onChange={(e) => setForm((prev) => ({ ...prev, salaryMax: e.target.value }))}
              />
            </div>
          </div>

          {message ? (
            <p className="mt-4 rounded-xl border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-700 dark:text-sky-300">
              {message}
            </p>
          ) : null}

          <div className="mt-5 flex gap-2">
            <button className="btn-primary" type="submit">
              {editingId ? "Update Job" : "Create Job"}
            </button>
            {editingId ? (
              <button className="btn-secondary" type="button" onClick={resetForm}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="space-y-5">
          <div className="glass p-5">
            <h2 className="section-title">Your Job Listings</h2>
            <div className="mt-4 space-y-3">
              {jobs.length ? (
                jobs.map((job) => (
                  <article
                    key={job._id}
                    className="rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{job.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {job.type} | {job.location}
                        </p>
                        <span className="badge mt-2 capitalize">{job.status}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button className="btn-secondary" onClick={() => onEdit(job)}>
                          Edit
                        </button>
                        <button className="btn-secondary" onClick={() => onDelete(job._id)}>
                          Delete
                        </button>
                        <button className="btn-primary" onClick={() => onViewApplicants(job._id)}>
                          Applicants
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300">No jobs posted yet.</p>
              )}
            </div>
          </div>

          {applicantData ? (
            <div className="glass p-5">
              <h3 className="section-title">Applicants: {applicantData.job.title}</h3>
              <div className="mt-4 space-y-3">
                {applicantData.applicants.length ? (
                  applicantData.applicants.map((app) => (
                    <article
                      key={app._id}
                      className="rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60"
                    >
                      <p className="font-semibold">{app.user?.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {app.user?.email}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Applied on {formatDate(app.createdAt)}
                      </p>
                      <span className="badge mt-2 capitalize">{app.status}</span>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-300">No applicants yet.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </PageTransition>
  );
};

export default ManageJobsPage;
