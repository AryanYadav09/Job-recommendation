import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { parseTagsInput } from "../utils/format";
import PageTransition from "../components/PageTransition";

const jobTypeOptions = [
  { label: "Remote", value: "remote" },
  { label: "Full Time", value: "full-time" },
  { label: "Internship", value: "internship" },
  { label: "Part Time", value: "part-time" },
  { label: "Hybrid", value: "hybrid" }
];

const OnboardingPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    skills: "",
    interests: "",
    experienceLevel: "JUNIOR",
    preferredCategory: "",
    desiredRoles: "",
    preferredLocations: "",
    expectedSalaryMin: "",
    expectedSalaryMax: "",
    location: ""
  });
  const [jobTypes, setJobTypes] = useState(["remote"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    if (user.role !== "USER") {
      navigate("/", { replace: true });
      return;
    }
    if (user.onboardingCompleted) {
      navigate("/jobs", { replace: true });
    }
  }, [user, navigate]);

  const toggleJobType = (type) => {
    setJobTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!jobTypes.length) {
      setError("Select at least one preferred job type.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/users/onboarding", {
        skills: parseTagsInput(form.skills),
        interests: parseTagsInput(form.interests),
        experienceLevel: form.experienceLevel,
        preferredCategory: form.preferredCategory,
        desiredRoles: parseTagsInput(form.desiredRoles),
        desiredJobTypes: jobTypes,
        preferredLocations: parseTagsInput(form.preferredLocations),
        expectedSalaryMin: form.expectedSalaryMin ? Number(form.expectedSalaryMin) : null,
        expectedSalaryMax: form.expectedSalaryMax ? Number(form.expectedSalaryMax) : null,
        location: form.location
      });

      await refreshUser();
      navigate("/jobs", { replace: true });
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Could not save onboarding details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <section className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <form
          onSubmit={handleSubmit}
          className="glass p-6 md:p-8"
        >
          <h1 className="font-display text-3xl">Let us personalize your job feed</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            This setup appears only once for new users. It helps us rank better jobs before your
            activity history is available.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <input
              className="input md:col-span-2"
              placeholder="Skills (comma separated)"
              value={form.skills}
              onChange={(e) => setForm((prev) => ({ ...prev, skills: e.target.value }))}
              required
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
              required
            />
            <input
              className="input md:col-span-2"
              placeholder="Desired roles (comma separated)"
              value={form.desiredRoles}
              onChange={(e) => setForm((prev) => ({ ...prev, desiredRoles: e.target.value }))}
              required
            />
            <input
              className="input md:col-span-2"
              placeholder="Preferred locations (comma separated)"
              value={form.preferredLocations}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, preferredLocations: e.target.value }))
              }
              required
            />
            <input
              className="input"
              type="number"
              min="0"
              placeholder="Expected salary min (yearly)"
              value={form.expectedSalaryMin}
              onChange={(e) => setForm((prev) => ({ ...prev, expectedSalaryMin: e.target.value }))}
            />
            <input
              className="input"
              type="number"
              min="0"
              placeholder="Expected salary max (yearly)"
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

          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Preferred job types
            </p>
            <div className="flex flex-wrap gap-2">
              {jobTypeOptions.map((type) => {
                const selected = jobTypes.includes(type.value);
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => toggleJobType(type.value)}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      selected
                        ? "bg-accent text-white"
                        : "border border-slate-300 bg-white/70 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                    }`}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-rose-500">{error}</p> : null}

          <button className="btn-primary mt-6" disabled={loading}>
            {loading ? "Saving preferences..." : "Complete setup"}
          </button>
        </form>

        <div
          className="glass overflow-hidden p-0"
        >
          <img
            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80"
            alt="Career planning workspace"
            className="h-56 w-full object-cover"
          />
          <div className="p-6">
            <h2 className="font-display text-2xl">What this improves</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>Better cold-start recommendations before activity signals.</li>
              <li>More relevant location and salary-aligned opportunities.</li>
              <li>Faster personalization from your first session.</li>
            </ul>
          </div>
        </div>
      </section>
    </PageTransition>
  );
};

export default OnboardingPage;
