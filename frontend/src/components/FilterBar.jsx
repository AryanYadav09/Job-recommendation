import { Search } from "lucide-react";

const FilterBar = ({ filters, onChange, onReset }) => {
  return (
    <div className="glass mb-6 p-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
        <label className="lg:col-span-2">
          <span className="sr-only">Search</span>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              className="input pl-11"
              placeholder="Search title or skill"
              value={filters.search}
              onChange={(e) => onChange("search", e.target.value)}
            />
          </div>
        </label>
        <input
          className="input"
          placeholder="Skills (comma separated)"
          value={filters.skills}
          onChange={(e) => onChange("skills", e.target.value)}
        />
        <input
          className="input"
          placeholder="Location"
          value={filters.location}
          onChange={(e) => onChange("location", e.target.value)}
        />
        <select
          className="input"
          value={filters.type}
          onChange={(e) => onChange("type", e.target.value)}
        >
          <option value="">All Types</option>
          <option value="remote">Remote</option>
          <option value="full-time">Full Time</option>
          <option value="internship">Internship</option>
          <option value="part-time">Part Time</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <input
          className="input"
          placeholder="Company"
          value={filters.company}
          onChange={(e) => onChange("company", e.target.value)}
        />
      </div>
      <div className="mt-3 flex justify-end">
        <button className="btn-secondary" onClick={onReset}>
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
