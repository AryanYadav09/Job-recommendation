import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useDebounce from "../hooks/useDebounce";
import FilterBar from "../components/FilterBar";
import JobCard from "../components/JobCard";
import Loader from "../components/Loader";
import PageTransition from "../components/PageTransition";
import { formatJobType } from "../utils/format";

const initialFilters = {
  search: "",
  skills: "",
  location: "",
  type: "",
  company: "",
  category: ""
};

const knownTypes = ["remote", "full-time", "hybrid", "part-time", "internship"];

const JobFeedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [filters, setFilters] = useState(initialFilters);
  const [jobs, setJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const debouncedSearch = useDebounce(filters.search, 350);

  const queryParams = useMemo(() => {
    const params = {
      ...filters,
      search: debouncedSearch
    };

    Object.keys(params).forEach((key) => {
      if (!params[key]) delete params[key];
    });

    return params;
  }, [filters, debouncedSearch]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const [jobsRes, profileRes, activityRes] = await Promise.all([
      api.get("/jobs", { params: queryParams }),
      api.get("/users/profile"),
      api.get("/users/activity")
    ]);

    setJobs(jobsRes.data);
    setSavedJobs(new Set((profileRes.data.savedJobs || []).map((job) => String(job._id))));
    setAppliedJobs(
      new Set((activityRes.data.applications || []).map((application) => String(application.job?._id)))
    );
    setLoading(false);
  }, [queryParams]);

  const fetchRecommendations = useCallback(async () => {
    const { data } = await api.get(`/recommendations/${user._id}`);
    setRecommendations(data.recommendations || []);
  }, [user]);

  useEffect(() => {
    fetchJobs().catch(() => setLoading(false));
  }, [fetchJobs]);

  useEffect(() => {
    fetchRecommendations().catch(() => setRecommendations([]));
  }, [fetchRecommendations]);

  useEffect(() => {
    if (!location.hash) return;

    const id = location.hash.replace("#", "");
    const target = document.getElementById(id);

    if (!target) return;

    const timer = window.setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [location.hash, loading]);

  const handleSave = async (jobId) => {
    try {
      const { data } = await api.post(`/jobs/${jobId}/save`);
      setSavedJobs((prev) => {
        const next = new Set(prev);
        if (data.saved) next.add(jobId);
        else next.delete(jobId);
        return next;
      });
      setMessage(data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save job");
    }
  };

  const handleApply = async (jobId) => {
    try {
      await api.post(`/jobs/${jobId}/apply`, {});
      setAppliedJobs((prev) => new Set(prev).add(String(jobId)));
      setMessage("Application submitted successfully");
      fetchRecommendations().catch(() => null);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to apply");
    }
  };

  const handleDetails = (jobId) => navigate(`/jobs/${jobId}`);

  const handleQuickTag = (value) => {
    const normalized = value.toLowerCase().replace(/\s+/g, "-");

    if (knownTypes.includes(normalized)) {
      setFilters((prev) => ({ ...prev, type: normalized }));
    } else if (normalized === (user.preferredCategory || "").toLowerCase()) {
      setFilters((prev) => ({ ...prev, category: user.preferredCategory }));
    } else {
      setFilters((prev) => ({ ...prev, search: value }));
    }

    document.getElementById("job-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const categoryOptions = useMemo(() => {
    const counts = new Map();

    jobs.forEach((job) => {
      counts.set(job.category, (counts.get(job.category) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [jobs]);

  const companyOptions = useMemo(() => {
    const counts = new Map();

    jobs.forEach((job) => {
      const name = job.company?.name;
      if (!name) return;
      counts.set(name, (counts.get(name) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [jobs]);

  const typeCounts = useMemo(() => {
    const counts = new Map();

    jobs.forEach((job) => {
      counts.set(job.type, (counts.get(job.type) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [jobs]);

  const activeFilters = useMemo(
    () =>
      [
        filters.search ? `Search: ${filters.search}` : null,
        filters.location ? `Location: ${filters.location}` : null,
        filters.company ? `Company: ${filters.company}` : null,
        filters.category || null,
        filters.type ? formatJobType(filters.type) : null,
        filters.skills ? `Skills: ${filters.skills}` : null
      ].filter(Boolean),
    [filters]
  );

  const sortedJobs = useMemo(() => {
    const items = [...jobs];

    switch (sortBy) {
      case "saved-first":
        return items.sort(
          (a, b) =>
            Number(savedJobs.has(String(b._id))) - Number(savedJobs.has(String(a._id))) ||
            new Date(b.createdAt) - new Date(a.createdAt)
        );
      case "salary-high":
        return items.sort(
          (a, b) =>
            (b.salaryMax ?? b.salaryMin ?? -1) - (a.salaryMax ?? a.salaryMin ?? -1)
        );
      case "salary-low":
        return items.sort((a, b) => {
          const first = a.salaryMin ?? a.salaryMax ?? Number.MAX_SAFE_INTEGER;
          const second = b.salaryMin ?? b.salaryMax ?? Number.MAX_SAFE_INTEGER;
          return first - second;
        });
      case "company":
        return items.sort((a, b) =>
          (a.company?.name || "").localeCompare(b.company?.name || "")
        );
      default:
        return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }, [jobs, savedJobs, sortBy]);

  const quickTags = useMemo(
    () =>
      Array.from(
        new Set([
          user.preferredCategory,
          ...(user.desiredJobTypes || []).map(formatJobType),
          ...(user.skills || []).slice(0, 2)
        ].filter(Boolean))
      ).slice(0, 5),
    [user]
  );

  const heroStats = useMemo(
    () => [
      { label: "Active roles", value: String(jobs.length).padStart(2, "0") },
      { label: "Top matches", value: String(recommendations.length).padStart(2, "0") },
      { label: "Saved jobs", value: String(savedJobs.size).padStart(2, "0") }
    ],
    [jobs.length, recommendations.length, savedJobs.size]
  );

  return (
    <PageTransition>
      <section className="relative overflow-hidden rounded-[36px] border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-blue-100 px-6 py-8 text-slate-900 shadow-card dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:shadow-lifted md:px-8 md:py-10">
        <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-sky-200/80 blur-3xl dark:bg-sky-500/20" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-200/70 blur-3xl dark:bg-blue-500/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.75),_transparent_35%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.09),_transparent_35%)]" />

        <div className="relative grid gap-8 xl:grid-cols-[1.45fr_0.95fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-sky-100">
              <Sparkles size={14} className="text-sky-500 dark:text-sky-300" /> Personalized job search
            </span>

            <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Find your next role with a faster, cleaner hiring experience.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 md:text-lg">
              Browse a sharper blue-and-white job board built around your profile, goals, and the roles you are most likely to care about.
            </p>

            <div className="mt-8 rounded-[28px] bg-white/95 p-3 text-slate-900 shadow-lifted">
              <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_auto]">
                <label className="block">
                  <span className="sr-only">Search jobs</span>
                  <div className="input-shell h-full">
                    <Search className="input-icon" size={18} />
                    <input
                      className="input-field py-4"
                      placeholder="Job title, company, or keyword"
                      value={filters.search}
                      onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="sr-only">Location</span>
                  <div className="input-shell h-full">
                    <MapPin className="input-icon" size={18} />
                    <input
                      className="input-field py-4"
                      placeholder="Location or remote"
                      value={filters.location}
                      onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                </label>

                <button
                  className="btn-primary min-h-[3.5rem] px-6"
                  onClick={() =>
                    document.getElementById("job-results")?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    Search jobs <ArrowRight size={16} />
                  </span>
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {quickTags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-accent"
                    onClick={() => handleQuickTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[24px] border border-sky-100 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-white/10 dark:bg-white/5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                    {stat.label}
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 self-end">
            <div className="rounded-[28px] border border-sky-100 bg-white/75 p-5 backdrop-blur-md dark:border-white/10 dark:bg-white/10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-200">
                Recommendation profile
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-white">
                Tuned for your next move
              </h2>

              <div className="mt-5 space-y-3">
                <div className="rounded-[22px] border border-sky-100 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                    <Target size={15} className="text-sky-500 dark:text-sky-300" /> Preferred category
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                    {user.preferredCategory || "Still exploring"}
                  </p>
                </div>

                <div className="rounded-[22px] border border-sky-100 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                    <TrendingUp size={15} className="text-sky-500 dark:text-sky-300" /> Experience
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                    {user.experienceLevel || "Not set"}
                  </p>
                </div>

                <div className="rounded-[22px] border border-sky-100 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                    <BriefcaseBusiness size={15} className="text-sky-500 dark:text-sky-300" /> Salary range
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                    {user.expectedSalaryMin ? `$${Math.round(user.expectedSalaryMin / 1000)}k` : "-"}
                    {" - "}
                    {user.expectedSalaryMax ? `$${Math.round(user.expectedSalaryMax / 1000)}k` : "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-blue-200 bg-gradient-to-br from-blue-600 to-sky-500 p-5 text-white shadow-card dark:border-sky-400/20 dark:from-sky-400/20 dark:to-blue-500/10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                Ranking signals
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-blue-50 dark:text-slate-200">
                <li>50% profile match from skills, category, and job type preferences</li>
                <li>30% behavior signal from views, saves, and applications</li>
                <li>20% collaborative signal from similar users and role overlap</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="top-matches" className="mt-8">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700/70">
              Personalized section
            </p>
            <h2 className="section-title mt-2">Top matches for you</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Fresh recommendations update as you browse, save, and apply.
          </p>
        </div>

        {recommendations.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {recommendations.slice(0, 6).map((item) => (
              <JobCard
                key={`reco-${item.job._id}`}
                job={item.job}
                reason={`${item.reason} (score: ${item.score.final})`}
                onSave={handleSave}
                onApply={handleApply}
                onDetails={handleDetails}
                saved={savedJobs.has(String(item.job._id))}
                applied={appliedJobs.has(String(item.job._id))}
              />
            ))}
          </div>
        ) : (
          <div className="glass p-4 text-sm text-slate-600 dark:text-slate-300">
            Complete a few actions to strengthen personalized recommendations.
          </div>
        )}
      </section>

      <section id="job-results" className="mt-10 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <FilterBar
            filters={filters}
            onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
            onReset={() => setFilters(initialFilters)}
            categoryOptions={categoryOptions}
            companyOptions={companyOptions}
            typeCounts={typeCounts}
          />
        </aside>

        <div>
          <div className="rounded-[28px] border border-sky-100 bg-white/90 p-5 shadow-card dark:border-slate-800 dark:bg-slate-950/70">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700/70 dark:text-sky-300/70">
                  Curated opportunities
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                  Job Listings
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {jobs.length} roles match your current filter set.
                </p>
              </div>

              <div className="flex flex-col gap-3 md:items-end">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300">
                  <SlidersHorizontal size={14} /> Smart filter mode
                </div>
                <select
                  className="input min-w-[12rem] md:w-auto"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest first</option>
                  <option value="saved-first">Saved first</option>
                  <option value="salary-high">Highest salary</option>
                  <option value="salary-low">Lowest salary</option>
                  <option value="company">Company name</option>
                </select>
              </div>
            </div>

            {activeFilters.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeFilters.map((item) => (
                  <span key={item} className="badge">
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {message ? (
            <p className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-300">
              {message}
            </p>
          ) : null}

          <div className="mt-6">
            {loading ? (
              <Loader />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {sortedJobs.map((job) => (
                  <JobCard
                    key={job._id}
                    job={job}
                    onSave={handleSave}
                    onApply={handleApply}
                    onDetails={handleDetails}
                    saved={savedJobs.has(String(job._id))}
                    applied={appliedJobs.has(String(job._id))}
                  />
                ))}
              </div>
            )}
          </div>

          {!loading && !sortedJobs.length ? (
            <div className="glass mt-4 p-5 text-sm text-slate-600 dark:text-slate-300">
              No jobs matched the current filters. Try clearing one or two filters for a broader search.
            </div>
          ) : null}
        </div>
      </section>
    </PageTransition>
  );
};

export default JobFeedPage;
