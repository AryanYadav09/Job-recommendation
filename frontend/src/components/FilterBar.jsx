import {
  Building2,
  Layers3,
  MapPin,
  RefreshCcw,
  Search,
  Sparkles
} from "lucide-react";
import { formatJobType } from "../utils/format";

const jobTypeOptions = ["remote", "full-time", "hybrid", "part-time", "internship"];

const FilterBar = ({
  filters,
  onChange,
  onReset,
  categoryOptions = [],
  companyOptions = [],
  typeCounts = []
}) => {
  const typeCountMap = new Map(typeCounts.map(({ label, count }) => [label, count]));

  return (
    <div className="space-y-4">
      <section className="glass p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700/70 dark:text-sky-300/70">
              Refine your feed
            </p>
            <h3 className="mt-2 font-display text-2xl font-bold text-slate-950 dark:text-white">
              Search filters
            </h3>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
            onClick={onReset}
          >
            <RefreshCcw size={13} /> Reset
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="sr-only">Search</span>
            <div className="input-shell">
              <Search className="input-icon" size={16} />
              <input
                className="input-field"
                placeholder="Job title, keyword, or skill"
                value={filters.search}
                onChange={(e) => onChange("search", e.target.value)}
              />
            </div>
          </label>

          <label className="block">
            <span className="sr-only">Location</span>
            <div className="input-shell">
              <MapPin className="input-icon" size={16} />
              <input
                className="input-field"
                placeholder="City, state, or remote"
                value={filters.location}
                onChange={(e) => onChange("location", e.target.value)}
              />
            </div>
          </label>

          <label className="block">
            <span className="sr-only">Company</span>
            <div className="input-shell">
              <Building2 className="input-icon" size={16} />
              <input
                className="input-field"
                placeholder="Company name"
                value={filters.company}
                onChange={(e) => onChange("company", e.target.value)}
              />
            </div>
          </label>

          <label className="block">
            <span className="sr-only">Skills</span>
            <div className="input-shell">
              <Layers3 className="input-icon" size={16} />
              <input
                className="input-field"
                placeholder="Skills, comma separated"
                value={filters.skills}
                onChange={(e) => onChange("skills", e.target.value)}
              />
            </div>
          </label>

          <select
            className="input"
            value={filters.category}
            onChange={(e) => onChange("category", e.target.value)}
          >
            <option value="">All categories</option>
            {categoryOptions.map((item) => (
              <option key={item.label} value={item.label}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="glass p-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Job type
        </h3>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {jobTypeOptions.map((type) => {
            const isActive = filters.type === type;

            return (
              <button
                type="button"
                key={type}
                className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "border-accent bg-accent text-white shadow-glow"
                    : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                }`}
                onClick={() => onChange("type", isActive ? "" : type)}
              >
                <span>{formatJobType(type)}</span>
                <span className={`text-xs ${isActive ? "text-white/80" : "text-slate-400"}`}>
                  {typeCountMap.get(type) || 0}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {categoryOptions.length ? (
        <section className="glass p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Categories
          </h3>
          <div className="mt-4 space-y-2">
            {categoryOptions.slice(0, 7).map((item) => {
              const isActive = filters.category === item.label;

              return (
                <button
                  type="button"
                  key={item.label}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    isActive
                      ? "bg-sky-50 text-accent"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900/70"
                  }`}
                  onClick={() => onChange("category", isActive ? "" : item.label)}
                >
                  <span>{item.label}</span>
                  <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {companyOptions.length ? (
        <section className="glass p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Top companies
          </h3>
          <div className="mt-4 space-y-2">
            {companyOptions.slice(0, 6).map((item) => {
              const isActive = filters.company === item.label;

              return (
                <button
                  type="button"
                  key={item.label}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    isActive
                      ? "bg-sky-50 text-accent"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900/70"
                  }`}
                  onClick={() => onChange("company", isActive ? "" : item.label)}
                >
                  <span>{item.label}</span>
                  <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[28px] bg-slate-950 p-5 text-white shadow-lifted">
        <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
            <Sparkles size={14} /> Better UX tip
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Mix one search term with a location or category filter to surface higher-fit roles faster.
          </p>
        </div>
      </section>
    </div>
  );
};

export default FilterBar;
