import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Target, TrendingUp } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useDebounce from "../hooks/useDebounce";
import FilterBar from "../components/FilterBar";
import JobCard from "../components/JobCard";
import Loader from "../components/Loader";
import PageTransition from "../components/PageTransition";

const initialFilters = {
  search: "",
  skills: "",
  location: "",
  type: "",
  company: ""
};

const spotlightTracks = [
  {
    title: "Frontend & Product",
    description: "UI-heavy roles with fast product iteration and design collaboration.",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Platform & Backend",
    description: "Reliability, API architecture, and high-scale service ownership.",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Data, AI & Analytics",
    description: "Data-driven roles focused on experimentation, insights, and automation.",
    image:
      "https://images.unsplash.com/photo-1551281044-8b8e7b4be95a?auto=format&fit=crop&w=1200&q=80"
  }
];

const JobFeedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState(initialFilters);
  const [jobs, setJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

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
    const [jobsRes, profileRes] = await Promise.all([
      api.get("/jobs", { params: queryParams }),
      api.get("/users/profile")
    ]);

    setJobs(jobsRes.data);
    setSavedJobs(new Set((profileRes.data.savedJobs || []).map((job) => String(job._id))));
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
      setMessage("Application submitted successfully");
      fetchRecommendations().catch(() => null);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to apply");
    }
  };

  const handleDetails = (jobId) => navigate(`/jobs/${jobId}`);

  return (
    <PageTransition>
      <section className="mb-8 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-lg">
          {/* Background image with stronger overlay */}
          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80"
            alt="Team collaborating on modern tech projects"
            className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-luminosity"
          />
          {/* Accent colour wash */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-transparent to-accent2/20" />
          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900/80 to-transparent" />

          <div className="relative flex h-full min-h-[17rem] flex-col justify-between p-6 md:p-8">
            {/* Top badge */}
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <Sparkles size={13} className="text-sky-300" /> AI-powered recommendations
            </span>

            {/* Headline block */}
            <div>
              <h1 className="mt-4 max-w-md font-display text-2xl font-bold leading-snug text-white md:text-3xl">
                Discover roles built around{" "}
                <span className="text-sky-300">your skills</span> and{" "}
                <span className="text-emerald-300">salary goals</span>.
              </h1>
              <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-slate-300/90">
                Your feed adapts with every view, save, and application — getting smarter over time.
              </p>

              <button
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow transition hover:bg-sky-50 active:scale-95"
                onClick={() => document.getElementById("explore-jobs")?.scrollIntoView({ behavior: "smooth" })}
              >
                Explore opportunities <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="glass p-5">
            <h2 className="section-title">Your recommendation profile</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p className="inline-flex items-center gap-2">
                <Target size={15} className="text-accent" /> Preferred category: {user.preferredCategory || "Not set"}
              </p>
              <p className="inline-flex items-center gap-2">
                <TrendingUp size={15} className="text-accent2" /> Experience: {user.experienceLevel}
              </p>
              <p>
                Salary target: {user.expectedSalaryMin ? `$${Math.round(user.expectedSalaryMin / 1000)}k` : "-"}
                {" - "}
                {user.expectedSalaryMax ? `$${Math.round(user.expectedSalaryMax / 1000)}k` : "-"}
              </p>
            </div>
          </div>

          <div className="glass p-5">
            <h2 className="section-title">How ranking works</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>50% profile match (skills + job preferences)</li>
              <li>30% behavior score from views, saves, applies</li>
              <li>20% collaborative signal from similar users</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="section-title mb-3">Trending domains to explore</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {spotlightTracks.map((track) => (
            <article
              key={track.title}
              className="glass overflow-hidden p-0 transition hover:shadow-lg"
            >
              <img src={track.image} alt={track.title} className="h-44 w-full object-cover" />
              <div className="p-4">
                <h3 className="font-display text-lg">{track.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{track.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="section-title mb-3">Recommended for you</h2>
        {recommendations.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.slice(0, 6).map((item) => (
              <JobCard
                key={`reco-${item.job._id}`}
                job={item.job}
                reason={`${item.reason} (score: ${item.score.final})`}
                onSave={handleSave}
                onApply={handleApply}
                onDetails={handleDetails}
                saved={savedJobs.has(String(item.job._id))}
              />
            ))}
          </div>
        ) : (
          <div className="glass p-4 text-sm text-slate-600 dark:text-slate-300">
            Complete a few actions to strengthen personalized recommendations.
          </div>
        )}
      </section>

      <section id="explore-jobs">
        <h2 className="section-title mb-3">Explore jobs</h2>
        <FilterBar
          filters={filters}
          onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          onReset={() => setFilters(initialFilters)}
        />

        {message ? (
          <p className="mb-4 rounded-xl border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-700 dark:text-sky-300">
            {message}
          </p>
        ) : null}

        {loading ? (
          <Loader />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                onSave={handleSave}
                onApply={handleApply}
                onDetails={handleDetails}
                saved={savedJobs.has(String(job._id))}
              />
            ))}
          </div>
        )}

        {!loading && !jobs.length ? (
          <div className="glass mt-4 p-4 text-sm text-slate-600 dark:text-slate-300">
            No jobs found with current filters.
          </div>
        ) : null}
      </section>
    </PageTransition>
  );
};

export default JobFeedPage;
