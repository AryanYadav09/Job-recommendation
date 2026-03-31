import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
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

const getFiltersFromParams = (searchParams) => ({
  search: searchParams.get("search") || "",
  skills: searchParams.get("skills") || "",
  location: searchParams.get("location") || "",
  type: searchParams.get("type") || "",
  company: searchParams.get("company") || "",
  category: searchParams.get("category") || ""
});

const PublicJobsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isCandidate = user?.role === "USER" && user.onboardingCompleted;

  const [filters, setFilters] = useState(() => getFiltersFromParams(searchParams));
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const debouncedSearch = useDebounce(filters.search, 350);

  useEffect(() => {
    setFilters(getFiltersFromParams(searchParams));
  }, [searchParams]);

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

  const syncSearchParams = useCallback(
    (nextFilters) => {
      const nextParams = new URLSearchParams();
      Object.entries(nextFilters).forEach(([key, value]) => {
        if (value) nextParams.set(key, value);
      });
      setSearchParams(nextParams, { replace: location.pathname === "/jobs" });
    },
    [location.pathname, setSearchParams]
  );

  const fetchJobs = useCallback(async () => {
    setLoading(true);

    const requests = [api.get("/jobs", { params: queryParams })];
    if (isCandidate) requests.push(api.get("/users/profile"));

    const [jobsRes, profileRes] = await Promise.all(requests);
    setJobs(jobsRes.data);
    setSavedJobs(
      new Set((profileRes?.data?.savedJobs || []).map((job) => String(job._id)))
    );
    setLoading(false);
  }, [isCandidate, queryParams]);

  useEffect(() => {
    fetchJobs().catch(() => setLoading(false));
  }, [fetchJobs]);

  const handleFilterChange = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    syncSearchParams(next);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setSearchParams({}, { replace: true });
  };

  const handleSave = async (jobId) => {
    if (!isCandidate) {
      navigate("/login", { state: { from: { pathname: `/jobs/${jobId}` } } });
      return;
    }

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
    if (!isCandidate) {
      navigate("/login", { state: { from: { pathname: `/jobs/${jobId}` } } });
      return;
    }

    try {
      await api.post(`/jobs/${jobId}/apply`, {});
      setMessage("Application submitted successfully");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to apply");
    }
  };

  const handleDetails = (jobId) => navigate(`/jobs/${jobId}`);

  const categoryOptions = useMemo(() => {
    const counts = new Map();
    jobs.forEach((job) => counts.set(job.category, (counts.get(job.category) || 0) + 1));
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [jobs]);

  const companyOptions = useMemo(() => {
    const counts = new Map();
    jobs.forEach((job) => {
      const name = job.company?.name;
      if (name) counts.set(name, (counts.get(name) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [jobs]);

  const typeCounts = useMemo(() => {
    const counts = new Map();
    jobs.forEach((job) => counts.set(job.type, (counts.get(job.type) || 0) + 1));
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
  }, [jobs, sortBy]);

  return (
    <PageTransition>
      <section className="rounded-[36px] border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-blue-100 px-6 py-8 shadow-card md:px-8 md:py-10">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700/70">
              Public jobs directory
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
              Search jobs without logging in.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
              Browse all active roles, refine by company or location, and create an account when you are ready to save and apply.
            </p>
          </div>

          {!user ? (
            <div className="flex flex-wrap gap-3">
              <Link className="btn-secondary" to="/login">
                Login
              </Link>
              <Link className="btn-primary" to="/signup?role=USER">
                Sign up
              </Link>
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-[1.5fr_1fr_auto]">
          <div className="input-shell">
            <Search className="input-icon" size={18} />
            <input
              className="input-field py-4"
              placeholder="Search title, company, or keyword"
              value={filters.search}
              onChange={(event) => handleFilterChange("search", event.target.value)}
            />
          </div>
          <input
            className="input"
            placeholder="Location or remote"
            value={filters.location}
            onChange={(event) => handleFilterChange("location", event.target.value)}
          />
          <button
            className="btn-primary min-h-[3.5rem] px-6"
            onClick={() =>
              document.getElementById("public-job-results")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span className="inline-flex items-center gap-2">
              Search jobs <ArrowRight size={16} />
            </span>
          </button>
        </div>
      </section>

      <section id="public-job-results" className="mt-10 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <FilterBar
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleReset}
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
                  Browse all jobs
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                  Explore open roles
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {jobs.length} active roles available right now.
                </p>
              </div>

              <select
                className="input min-w-[12rem] md:w-auto"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="salary-high">Highest salary</option>
                <option value="salary-low">Lowest salary</option>
                <option value="company">Company name</option>
              </select>
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
                    disableActions={!isCandidate}
                  />
                ))}
              </div>
            )}
          </div>

          {!loading && !sortedJobs.length ? (
            <div className="glass mt-4 p-5 text-sm text-slate-600 dark:text-slate-300">
              No jobs matched the current filters. Try a broader search.
            </div>
          ) : null}
        </div>
      </section>
    </PageTransition>
  );
};

export default PublicJobsPage;
