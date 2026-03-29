import { Bookmark, BookmarkCheck, Briefcase, Building2, CheckCircle2, DollarSign, MapPin } from "lucide-react";

const JobCard = ({
  job,
  reason,
  onSave,
  onApply,
  onDetails,
  saved,
  disableActions = false
}) => {
  return (
    <article className="glass flex flex-col p-5 transition hover:shadow-lg">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold leading-snug">{job.title}</h3>
          <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
            <Building2 size={13} /> {job.company?.name || "Unknown Company"}
          </p>
        </div>
        <span className="badge shrink-0 capitalize">{job.type}</span>
      </div>

      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
        <span className="inline-flex items-center gap-1"><Briefcase size={12} /> {job.category}</span>
        {job.salaryRange && job.salaryRange !== "Not disclosed" && (
          <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
            <DollarSign size={12} /> {job.salaryRange}
          </span>
        )}
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {job.description}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(job.requiredSkills || []).slice(0, 5).map((skill) => (
          <span className="badge" key={`${job._id}-${skill}`}>
            {skill}
          </span>
        ))}
      </div>

      {reason ? (
        <div className="mt-3 rounded-xl border border-sky-400/30 bg-sky-50/60 px-3 py-2 text-xs font-medium text-sky-700 dark:bg-sky-900/20 dark:text-sky-300">
          {reason}
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <button className="btn-secondary" onClick={() => onDetails(job._id)}>
          View Details
        </button>
        {!disableActions ? (
          <>
            <button className="btn-secondary" onClick={() => onSave(job._id)}>
              <span className="inline-flex items-center gap-1.5">
                {saved ? <BookmarkCheck size={14} className="text-accent" /> : <Bookmark size={14} />}
                {saved ? "Saved" : "Save"}
              </span>
            </button>
            <button className="btn-primary" onClick={() => onApply(job._id)}>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Apply
              </span>
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
};

export default JobCard;

