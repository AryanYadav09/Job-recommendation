import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  CheckCircle2,
  DollarSign,
  MapPin
} from "lucide-react";
import { formatJobType, formatRelativeTime } from "../utils/format";
import CompanyVerificationBadge from "./CompanyVerificationBadge";
import ProfileIdentityLink from "./ProfileIdentityLink";

const JobCard = ({
  job,
  reason,
  onSave,
  onApply,
  onDetails,
  saved,
  applied = false,
  disableActions = false
}) => {
  const companyName = job.company?.name || "Unknown Company";
  const salaryLabel =
    job.salaryRange && job.salaryRange !== "Not disclosed"
      ? job.salaryRange
      : "Compensation shared during hiring";

  return (
    <article className="group flex h-full flex-col rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lifted dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-sky-900">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700/70 dark:text-sky-300/70">
              {job.category}
            </p>
            <h3 className="mt-1 font-display text-lg font-bold leading-snug text-slate-950 dark:text-white">
              {job.title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <ProfileIdentityLink
                role="COMPANY"
                id={job.company?._id}
                name={companyName}
                subtitle={job.company?.industry || job.location}
                avatarUrl={job.company?.logoUrl}
                size="sm"
              />
              <CompanyVerificationBadge status={job.company?.verificationStatus} />
            </div>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
          {formatJobType(job.type)}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={14} /> {job.location}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Briefcase size={14} /> {job.category}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <DollarSign size={14} /> {salaryLabel}
        </span>
      </div>

      <p className="line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
        {job.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(job.requiredSkills || []).slice(0, 5).map((skill) => (
          <span className="badge" key={`${job._id}-${skill}`}>
            {skill}
          </span>
        ))}
      </div>

      {reason ? (
        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-3.5 py-3 text-xs font-medium leading-6 text-sky-700 dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-300">
          {reason}
        </div>
      ) : null}

      <div className="mt-auto border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Posted
            </p>
            <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
              {formatRelativeTime(job.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button className="btn-secondary" onClick={() => onDetails(job._id)}>
              View details
            </button>
            {!disableActions ? (
              <>
                <button
                  className="btn-icon"
                  onClick={() => onSave(job._id)}
                  aria-label={saved ? "Remove job from saved list" : "Save job"}
                >
                  {saved ? <BookmarkCheck size={16} className="text-accent" /> : <Bookmark size={16} />}
                </button>
                <button
                  className={applied ? "btn-secondary" : "btn-primary"}
                  onClick={() => onApply(job._id)}
                  disabled={applied}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> {applied ? "Applied" : "Apply"}
                  </span>
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
};

export default JobCard;
