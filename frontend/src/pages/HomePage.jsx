import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users2
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import PageTransition from "../components/PageTransition";
import HomeJobCard from "../components/HomeJobCard";
import { homeByUser } from "../utils/roleHome";
import { getInitials } from "../utils/format";

const recruiterHighlights = [
  {
    name: "Aisha Khan",
    role: "Talent Partner",
    company: "Nexa Labs",
    focus: "Engineering and product hiring across remote teams."
  },
  {
    name: "Rohit Mehta",
    role: "Lead Recruiter",
    company: "Orbit Systems",
    focus: "Backend, cloud, and infrastructure roles with fast response cycles."
  },
  {
    name: "Sara Chen",
    role: "Hiring Manager",
    company: "Vertex Dynamics",
    focus: "Design, research, and cross-functional leadership openings."
  }
];

const testimonials = [
  {
    name: "Priya S.",
    role: "Frontend Developer",
    review:
      "The search filters were clear, the jobs felt relevant, and I found interview-ready opportunities much faster here."
  },
  {
    name: "Daniel R.",
    role: "Product Designer",
    review:
      "The homepage made it easy to compare companies and salaries without logging in first. That made me trust the platform more."
  },
  {
    name: "Mehul A.",
    role: "Recruiting Lead",
    review:
      "Our team used JobPulse to post roles and the employer flow was straightforward. We started getting quality applications quickly."
  }
];

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const sliderRef = useRef(null);

  useEffect(() => {
    api
      .get("/jobs")
      .then(({ data }) => setJobs(data))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const topicOptions = useMemo(() => {
    const options = ["All", "Remote", "Full Time", "Hybrid"];

    jobs.forEach((job) => {
      if (!options.includes(job.category) && options.length < 9) {
        options.push(job.category);
      }
    });

    return options;
  }, [jobs]);

  const uniqueCompanies = useMemo(() => {
    const map = new Map();
    jobs.forEach((job) => {
      const name = job.company?.name;
      if (!name || map.has(name)) return;
      map.set(name, {
        name,
        totalJobs: 0
      });
    });

    jobs.forEach((job) => {
      const name = job.company?.name;
      if (!name || !map.has(name)) return;
      map.get(name).totalJobs += 1;
    });

    return Array.from(map.values());
  }, [jobs]);

  const featuredJobs = useMemo(() => {
    const normalized = selectedTopic.toLowerCase();
    const filtered = jobs.filter((job) => {
      if (selectedTopic === "All") return true;
      if (normalized === "remote") return job.type === "remote";
      if (normalized === "full time") return job.type === "full-time";
      if (normalized === "hybrid") return job.type === "hybrid";
      return job.category.toLowerCase() === normalized;
    });

    return filtered.slice(0, 10);
  }, [jobs, selectedTopic]);

  const platformStats = useMemo(
    () => [
      { label: "Live jobs", value: String(jobs.length).padStart(2, "0") },
      { label: "Trusted companies", value: String(uniqueCompanies.length).padStart(2, "0") },
      {
        label: "Hiring categories",
        value: String(new Set(jobs.map((job) => job.category)).size).padStart(2, "0")
      },
      { label: "Candidate searches", value: "12k+" }
    ],
    [jobs, uniqueCompanies.length]
  );

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const value = searchTerm.trim();
    navigate(value ? `/jobs?search=${encodeURIComponent(value)}` : "/jobs");
  };

  const scrollSlider = (direction) => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({
      left: direction * 360,
      behavior: "smooth"
    });
  };

  return (
    <PageTransition>
      <section className="relative overflow-hidden rounded-[40px] border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-blue-100 px-6 py-10 shadow-card md:px-10 md:py-14">
        <div className="absolute -left-14 top-8 h-48 w-48 rounded-full bg-sky-200/80 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-200/70 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.35fr_0.9fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              <Sparkles size={14} /> Job search made simpler
            </span>
            <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">
              Discover jobs, compare opportunities, and hire smarter with JobPulse.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              JobPulse helps candidates explore verified roles and helps employers publish openings faster with a cleaner, modern experience.
            </p>

            <form onSubmit={handleSearchSubmit} className="mt-8 grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="input-shell">
                <Search className="input-icon" size={18} />
                <input
                  className="input-field py-4"
                  placeholder="Search roles, companies, skills, or categories"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <button className="btn-primary min-h-[3.5rem] px-6">
                <span className="inline-flex items-center gap-2">
                  Search jobs <ArrowRight size={16} />
                </span>
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              {user ? (
                <Link className="btn-primary" to={homeByUser(user)}>
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link className="btn-primary" to="/signup?role=USER">
                    Sign up
                  </Link>
                  <Link className="btn-secondary" to="/login">
                    Login
                  </Link>
                </>
              )}
              <Link className="btn-secondary" to="/signup?role=COMPANY">
                Employer signup
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="glass p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700/70 dark:text-sky-300/70">
                Why JobPulse
              </p>
              <div className="mt-5 space-y-4">
                <div className="rounded-[22px] border border-sky-100 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                    <Search size={15} className="text-accent" /> Search confidently
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Browse public job listings without signing in and jump into deeper filters on the jobs page.
                  </p>
                </div>
                <div className="rounded-[22px] border border-sky-100 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                    <Users2 size={15} className="text-accent" /> Candidate + employer workflows
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Candidates get personalized dashboards after login, while employers can sign up and publish roles.
                  </p>
                </div>
                <div className="rounded-[22px] border border-sky-100 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                    <Building2 size={15} className="text-accent" /> Designed for clarity
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    A faster UI, modern search, and job cards that make it easier to compare options.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-[36px] bg-white px-6 py-8 shadow-card md:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          {platformStats.map((stat) => (
            <article key={stat.label} className="rounded-[24px] border border-sky-100 bg-sky-50/70 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700/70">
                {stat.label}
              </p>
              <p className="mt-2 font-display text-4xl font-bold text-slate-950">{stat.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-[36px] bg-[#dfeeff] px-6 py-10 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700/70">
              Fresh opportunities
            </p>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950">
              What are you looking for today?
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Explore featured jobs from the latest public listings. Use the slider to browse at least 10 openings without leaving the home page.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="btn-icon" onClick={() => scrollSlider(-1)} aria-label="Scroll jobs left">
              <ChevronLeft size={18} />
            </button>
            <button className="btn-icon" onClick={() => scrollSlider(1)} aria-label="Scroll jobs right">
              <ChevronRight size={18} />
            </button>
            <Link className="btn-secondary" to="/jobs">
              View all jobs
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {topicOptions.map((topic) => {
            const active = selectedTopic === topic;
            return (
              <button
                key={topic}
                type="button"
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-accent text-white shadow-glow"
                    : "border border-white bg-white text-slate-700 hover:border-sky-200 hover:text-accent"
                }`}
                onClick={() => setSelectedTopic(topic)}
              >
                {topic}
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          {loading ? (
            <Loader />
          ) : featuredJobs.length ? (
            <div
              ref={sliderRef}
              className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2"
            >
              {featuredJobs.map((job) => (
                <div key={job._id} className="w-[320px] shrink-0 snap-start md:w-[360px]">
                  <HomeJobCard
                    job={job}
                    onDetails={(jobId) => navigate(`/jobs/${jobId}`)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="glass p-5 text-sm text-slate-600">
              No featured jobs available right now.
            </div>
          )}
        </div>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[36px] border border-sky-100 bg-white px-6 py-8 shadow-card md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700/70">
            Trusted companies
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">
            Teams and recruiters hiring through JobPulse
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            We surface openings from credible teams and make it easier for candidates to scan where the best opportunities are coming from.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {uniqueCompanies.slice(0, 6).map((company) => (
              <article
                key={company.name}
                className="rounded-[24px] border border-sky-100 bg-sky-50/60 px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent2 font-display text-sm font-bold text-white shadow-glow">
                    {getInitials(company.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">{company.name}</p>
                    <p className="text-xs text-slate-500">{company.totalJobs} jobs live</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[36px] bg-gradient-to-br from-slate-950 to-blue-950 px-6 py-8 text-white shadow-lifted md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
            Recruiter spotlight
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">
            Real recruiters, faster responses
          </h2>
          <div className="mt-6 space-y-4">
            {recruiterHighlights.map((recruiter) => (
              <article
                key={`${recruiter.name}-${recruiter.company}`}
                className="rounded-[24px] border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 font-display text-sm font-bold text-white">
                    {getInitials(recruiter.name)}
                  </div>
                  <div>
                    <p className="font-semibold">{recruiter.name}</p>
                    <p className="text-sm text-slate-300">
                      {recruiter.role} at {recruiter.company}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">{recruiter.focus}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-[36px] border border-sky-100 bg-white px-6 py-8 shadow-card md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700/70">
              User reviews
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">
              What people say about JobPulse
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
            <Star size={15} className="fill-current" /> Rated by candidates and recruiters
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {testimonials.map((item) => (
            <article
              key={`${item.name}-${item.role}`}
              className="rounded-[28px] border border-sky-100 bg-sky-50/50 p-5"
            >
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={15} className="fill-current" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-700">{item.review}</p>
              <div className="mt-5 border-t border-sky-100 pt-4">
                <p className="font-semibold text-slate-950">{item.name}</p>
                <p className="text-sm text-slate-500">{item.role}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-3">
        <div className="rounded-[30px] bg-gradient-to-br from-sky-600 to-blue-700 p-6 text-white shadow-lifted">
          <TrendingUp size={20} />
          <h3 className="mt-4 font-display text-2xl font-bold">More visibility</h3>
          <p className="mt-3 text-sm leading-7 text-blue-50">
            Employers can showcase openings, manage listings, and reach candidates from day one.
          </p>
        </div>
        <div className="rounded-[30px] bg-white p-6 shadow-card">
          <Users2 size={20} className="text-accent" />
          <h3 className="mt-4 font-display text-2xl font-bold text-slate-950">Candidate-first UX</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Browse, compare, and shortlist opportunities with a cleaner experience across the site.
          </p>
        </div>
        <div className="rounded-[30px] bg-white p-6 shadow-card">
          <ShieldCheck size={20} className="text-accent" />
          <h3 className="mt-4 font-display text-2xl font-bold text-slate-950">Trusted job flow</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            From public discovery to recruiter outreach, the platform is designed to feel credible and easy to use.
          </p>
        </div>
      </section>
    </PageTransition>
  );
};

export default HomePage;
