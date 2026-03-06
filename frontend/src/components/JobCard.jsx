import { motion } from "framer-motion";
import { Bookmark, CheckCircle2, MapPin, Clock3, Building2 } from "lucide-react";

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
    <motion.article
      layout
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="glass p-5"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg">{job.title}</h3>
          <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
            <Building2 size={14} /> {job.company?.name || "Unknown Company"}
          </p>
        </div>
        <span className="badge capitalize">{job.type}</span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
        <span className="inline-flex items-center gap-1"><MapPin size={13} /> {job.location}</span>
        <span className="inline-flex items-center gap-1"><Clock3 size={13} /> {job.category}</span>
      </div>

      <p className="text-sm text-slate-700 dark:text-slate-200">{job.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(job.requiredSkills || []).slice(0, 4).map((skill) => (
          <span className="badge" key={`${job._id}-${skill}`}>
            {skill}
          </span>
        ))}
      </div>

      {reason ? (
        <div className="mt-4 rounded-xl border border-accent/35 bg-accent/10 px-3 py-2 text-xs font-medium text-sky-700 dark:text-sky-300">
          {reason}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn-secondary" onClick={() => onDetails(job._id)}>
          View Details
        </button>
        {!disableActions ? (
          <>
            <button className="btn-secondary" onClick={() => onSave(job._id)}>
              <span className="inline-flex items-center gap-1">
                <Bookmark size={15} /> {saved ? "Saved" : "Save"}
              </span>
            </button>
            <button className="btn-primary" onClick={() => onApply(job._id)}>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 size={15} /> Apply
              </span>
            </button>
          </>
        ) : null}
      </div>
    </motion.article>
  );
};

export default JobCard;
