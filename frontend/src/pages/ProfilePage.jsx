import { useEffect, useState } from "react";
import api from "../services/api";
import PageTransition from "../components/PageTransition";
import Loader from "../components/Loader";
import StatCard from "../components/StatCard";
import { parseTagsInput, formatDate } from "../utils/format";

const jobTypeOptions = ["remote", "full-time", "internship", "part-time", "hybrid"];

const ProfilePage = () => {
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
