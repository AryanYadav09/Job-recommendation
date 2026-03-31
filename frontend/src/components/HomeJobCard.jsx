import { ArrowRight, Briefcase, Building2, MapPin, Wallet } from "lucide-react";
import { getInitials } from "../utils/format";

const HomeJobCard = ({ job, onDetails }) => {
  const companyName = job.company?.name || "Unknown Company";

  return (
    <article className="flex h-full flex-col rounded-[28px] border border-sky-100 bg-white p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lifted dark:border-slate-800 dark:bg-slate-950/70">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            <Briefcase size={12} /> Actively hiring
          </span>
          <h3 className="mt-4 font-display text-xl font-bold leading-snug text-slate-950 dark:text-white">
            {job.title}
          </h3>
          <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
            <Building2 size={13} /> {companyName}
          </p>
        </div>

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent2 font-display text-lg font-bold text-white shadow-glow">
          {getInitials(companyName)}
        </div>
      </div>

      <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
        <p className="inline-flex items-center gap-2">
          <MapPin size={14} /> {job.location}
        </p>
        <p className="inline-flex items-center gap-2">
          <Wallet size={14} /> {job.salaryRange || "Compensation shared during hiring"}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between pt-6">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {job.type}
        </span>
        <button
          className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-blue-700"
          onClick={() => onDetails(job._id)}
        >
          View details <ArrowRight size={14} />
        </button>
      </div>
    </article>
  );
};

export default HomeJobCard;
