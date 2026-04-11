import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, BookmarkX, Briefcase, MapPin, MessageCircleMore } from "lucide-react";
import api from "../services/api";
import { useMessaging } from "../context/MessagingContext";
import PageTransition from "../components/PageTransition";
import Loader from "../components/Loader";
import ProfileIdentityLink from "../components/ProfileIdentityLink";
import StatCard from "../components/StatCard";
import { parseTagsInput, formatDate } from "../utils/format";

const jobTypeOptions = ["remote", "full-time", "internship", "part-time", "hybrid"];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { ensureConversation } = useMessaging();
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
    location: "",
    experienceSummary: "",
    resumeUrl: ""
  });
  const [savedJobs, setSavedJobs] = useState([]);
  const [activity, setActivity] = useState({
    counters: { views: 0, saves: 0, applies: 0 },
    applications: []
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [chattingCompanyId, setChattingCompanyId] = useState("");

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
      location: profile.location || "",
      experienceSummary: profile.experienceSummary || "",
      resumeUrl: profile.resumeUrl || ""
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

  const handleSubmit = async (event) => {
    event.preventDefault();
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
      setSavedJobs((prev) => prev.filter((job) => job._id !== jobId));
    } catch {
      // silent
    }
  };

  const handleMessageCompany = async (companyId) => {
    if (!companyId) return;

    setChattingCompanyId(companyId);

    try {
      await ensureConversation({ targetCompanyId: companyId });
      setMessage("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to open conversation");
    } finally {
      setChattingCompanyId("");
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
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              className="input md:col-span-2"
              placeholder="Skills (comma separated)"
              value={form.skills}
              onChange={(event) => setForm((prev) => ({ ...prev, skills: event.target.value }))}
            />
            <input
              className="input md:col-span-2"
              placeholder="Interests (comma separated)"
              value={form.interests}
              onChange={(event) => setForm((prev) => ({ ...prev, interests: event.target.value }))}
            />
            <select
              className="input"
              value={form.experienceLevel}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, experienceLevel: event.target.value }))
              }
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
              onChange={(event) =>
                setForm((prev) => ({ ...prev, preferredCategory: event.target.value }))
              }
            />
            <input
              className="input md:col-span-2"
              placeholder="Desired roles (comma separated)"
              value={form.desiredRoles}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, desiredRoles: event.target.value }))
              }
            />
            <input
              className="input md:col-span-2"
              placeholder="Preferred locations (comma separated)"
              value={form.preferredLocations}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, preferredLocations: event.target.value }))
              }
            />
            <input
              className="input"
              type="number"
              min="0"
              placeholder="Expected salary min"
              value={form.expectedSalaryMin}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, expectedSalaryMin: event.target.value }))
              }
            />
            <input
              className="input"
              type="number"
              min="0"
              placeholder="Expected salary max"
              value={form.expectedSalaryMax}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, expectedSalaryMax: event.target.value }))
              }
            />
            <input
              className="input md:col-span-2"
              placeholder="Current location"
              value={form.location}
              onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
            />
            <textarea
              className="input min-h-28 md:col-span-2"
              placeholder="Experience summary"
              value={form.experienceSummary}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, experienceSummary: event.target.value }))
              }
            />
            <input
              className="input md:col-span-2"
              placeholder="Resume URL"
              value={form.resumeUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, resumeUrl: event.target.value }))}
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
                        <div className="mt-1">
                          <ProfileIdentityLink
                            role="COMPANY"
                            id={job.company?._id}
                            name={job.company?.name || "Unknown company"}
                            avatarUrl={job.company?.logoUrl}
                            size="sm"
                            showSubtitle={false}
                          />
                        </div>
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
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} /> {job.location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Briefcase size={11} /> {job.category}
                      </span>
                      {job.salaryRange && job.salaryRange !== "Not disclosed" ? (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {job.salaryRange}
                        </span>
                      ) : null}
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
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{application.job?.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(application.createdAt)}
                        </p>
                        <div className="mt-1">
                          <ProfileIdentityLink
                            role="COMPANY"
                            id={application.job?.company?._id}
                            name={application.job?.company?.name || "Unknown company"}
                            avatarUrl={application.job?.company?.logoUrl}
                            size="sm"
                            showSubtitle={false}
                          />
                        </div>
                      </div>
                      <span className="badge capitalize">{application.status}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="btn-secondary"
                        onClick={() => navigate(`/jobs/${application.job?._id}`)}
                      >
                        View job
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => handleMessageCompany(application.job?.company?._id)}
                        disabled={chattingCompanyId === application.job?.company?._id}
                      >
                        <span className="inline-flex items-center gap-2">
                          <MessageCircleMore size={15} />
                          {chattingCompanyId === application.job?.company?._id
                            ? "Opening..."
                            : "Message company"}
                        </span>
                      </button>
                    </div>
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
