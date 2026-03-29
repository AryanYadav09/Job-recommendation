import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import PageTransition from "../components/PageTransition";
import Loader from "../components/Loader";
import StatCard from "../components/StatCard";
import { parseTagsInput, formatDate } from "../utils/format";
import { Bookmark, BookmarkX, Briefcase, Building2, MapPin } from "lucide-react";

const jobTypeOptions = ["remote", "full-time", "internship", "part-time", "hybrid"];

const ProfilePage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    skills: "",
    interests: "",
    experienceLevel: "JUNIOR",
    preferredCategory: "",
    desiredRoles: "",
    preferredLocations: "",
    desiredJobTypes: ["remote"],
    expectedSalaryMin: "",
    expectedSalaryMax: "",
    location: ""
  });
  const [savedJobs, setSavedJobs] = useState([]);
  const [activity, setActivity] = useState({
    counters: { views: 0, saves: 0, applies: 0 },
    applications: []
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    const [profileRes, activityRes] = await Promise.all([
      api.get("/users/profile"),
      api.get("/users/activity")
    ]);

    const profile = profileRes.data;
    setSavedJobs(profile.savedJobs || []);
    setForm({
      name: profile.name || "",
      skills: (profile.skills || []).join(", "),
      interests: (profile.interests || []).join(", "),
      experienceLevel: profile.experienceLevel || "JUNIOR",
      preferredCategory: profile.preferredCategory || "",
      desiredRoles: (profile.desiredRoles || []).join(", "),
      preferredLocations: (profile.preferredLocations || []).join(", "),
      desiredJobTypes: profile.desiredJobTypes?.length ? profile.desiredJobTypes : ["remote"],
      expectedSalaryMin: profile.expectedSalaryMin || "",
      expectedSalaryMax: profile.expectedSalaryMax || "",
      location: profile.location || ""
    });
    setActivity(activityRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData().catch(() => setLoading(false));
  }, []);

  const toggleJobType = (type) => {
    setForm((prev) => ({
      ...prev,
      desiredJobTypes: prev.desiredJobTypes.includes(type)
        ? prev.desiredJobTypes.filter((item) => item !== type)
        : [...prev.desiredJobTypes, type]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put("/users/profile", {
        ...form,
        skills: parseTagsInput(form.skills),
        interests: parseTagsInput(form.interests),
        desiredRoles: parseTagsInput(form.desiredRoles),
        preferredLocations: parseTagsInput(form.preferredLocations),
        expectedSalaryMin: form.expectedSalaryMin ? Number(form.expectedSalaryMin) : null,
        expectedSalaryMax: form.expectedSalaryMax ? Number(form.expectedSalaryMax) : null
      });
      setMessage("Profile updated successfully");
      fetchData().catch(() => null);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update profile");
    }
  };

  const handleUnsave = async (jobId) => {
    try {
      await api.post(`/jobs/${jobId}/save`);
      setSavedJobs((prev) => prev.filter((j) => j._id !== jobId));
    } catch {
      // silent
    }
  };

  if (loading) return <Loader />;

  return (
    <PageTransition>
      <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <form className="glass p-6" onSubmit={handleSubmit}>
          <h1 className="section-title">Profile</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Keep preferences updated so recommendations stay relevant.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <input
              className="input md:col-span-2"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              className="input md:col-span-2"
              placeholder="Skills (comma separated)"
              value={form.skills}
              onChange={(e) => setForm((prev) => ({ ...prev, skills: e.target.value }))}
            />
            <input
              className="input md:col-span-2"
              placeholder="Interests (comma separated)"
              value={form.interests}
              onChange={(e) => setForm((prev) => ({ ...prev, interests: e.target.value }))}
            />
            <select
              className="input"
              value={form.experienceLevel}
              onChange={(e) => setForm((prev) => ({ ...prev, experienceLevel: e.target.value }))}
            >
              <option value="FRESHER">Fresher</option>
              <option value="JUNIOR">Junior</option>
              <option value="MID">Mid</option>
              <option value="SENIOR">Senior</option>
            </select>
            <input
              className="input"
              placeholder="Preferred category"
              value={form.preferredCategory}
              onChange={(e) => setForm((prev) => ({ ...prev, preferredCategory: e.target.value }))}
            />
            <input
              className="input md:col-span-2"
              placeholder="Desired roles (comma separated)"
              value={form.desiredRoles}
              onChange={(e) => setForm((prev) => ({ ...prev, desiredRoles: e.target.value }))}
            />
            <input
              className="input md:col-span-2"
              placeholder="Preferred locations (comma separated)"
              value={form.preferredLocations}
              onChange={(e) => setForm((prev) => ({ ...prev, preferredLocations: e.target.value }))}
            />
            <input
              className="input"
              type="number"
              min="0"
              placeholder="Expected salary min"
              value={form.expectedSalaryMin}
              onChange={(e) => setForm((prev) => ({ ...prev, expectedSalaryMin: e.target.value }))}
            />
            <input
              className="input"
              type="number"
              min="0"
              placeholder="Expected salary max"
              value={form.expectedSalaryMax}
              onChange={(e) => setForm((prev) => ({ ...prev, expectedSalaryMax: e.target.value }))}
            />
            <input
              className="input md:col-span-2"
              placeholder="Current location"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            />
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Preferred job types
            </p>
            <div className="flex flex-wrap gap-2">
              {jobTypeOptions.map((type) => {
                const selected = form.desiredJobTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleJobType(type)}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      selected
                        ? "bg-accent text-white"
                        : "border border-slate-300 bg-white/70 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {message ? (
            <p className="mt-4 rounded-xl border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-700 dark:text-sky-300">
              {message}
            </p>
          ) : null}

          <button className="btn-primary mt-5">Save profile</button>
        </form>

        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Views" value={activity.counters.views} accent="blue" />
            <StatCard label="Saves" value={activity.counters.saves} accent="accent" />
            <StatCard label="Applies" value={activity.counters.applies} accent="green" />
          </div>

          <div className="glass p-5">
            <h2 className="section-title flex items-center gap-2">
              <Bookmark size={16} className="text-accent" /> Saved Jobs
              <span className="ml-auto rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                {savedJobs.length}
              </span>
            </h2>
            <div className="mt-4 space-y-3">
              {savedJobs.length ? (
                savedJobs.map((job) => (
                  <article
                    key={job._id}
                    className="rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className="cursor-pointer truncate font-semibold hover:text-accent"
                          onClick={() => navigate(`/jobs/${job._id}`)}
                        >
                          {job.title}
                        </p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Building2 size={11} /> {job.company?.name || "—"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleUnsave(job._id)}
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20"
                        title="Remove from saved"
                      >
                        <BookmarkX size={15} />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1"><MapPin size={11} /> {job.location}</span>
                      <span className="inline-flex items-center gap-1"><Briefcase size={11} /> {job.category}</span>
                      {job.salaryRange && job.salaryRange !== "Not disclosed" && (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{job.salaryRange}</span>
                      )}
                    </div>
                    <span className="badge mt-2 capitalize">{job.type}</span>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No saved jobs yet.</p>
              )}
            </div>
          </div>

          <div className="glass p-5">
            <h2 className="section-title">Recent applications</h2>
            <div className="mt-4 space-y-3">
              {activity.applications.length ? (
                activity.applications.map((application) => (
                  <article
                    className="rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60"
                    key={application._id}
                  >
                    <p className="font-semibold">{application.job?.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {application.job?.company?.name} | {formatDate(application.createdAt)}
                    </p>
                    <span className="badge mt-2 capitalize">{application.status}</span>
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

export default ProfilePage;
