import { CircleAlert, Clock3, ShieldCheck } from "lucide-react";

const badgeConfig = {
  VERIFIED: {
    label: "Verified employer",
    Icon: ShieldCheck,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
  },
  PENDING: {
    label: "Verification pending",
    Icon: Clock3,
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
  },
  REJECTED: {
    label: "Verification rejected",
    Icon: CircleAlert,
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
  },
  UNVERIFIED: {
    label: "Unverified",
    Icon: CircleAlert,
    className:
      "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
  }
};

const CompanyVerificationBadge = ({ status = "UNVERIFIED", showAll = false, className = "" }) => {
  const normalizedStatus = badgeConfig[status] ? status : "UNVERIFIED";

  if (!showAll && normalizedStatus !== "VERIFIED") {
    return null;
  }

  const { Icon, label, className: colorClassName } = badgeConfig[normalizedStatus];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${colorClassName} ${className}`.trim()}
    >
      <Icon size={12} />
      {label}
    </span>
  );
};

export default CompanyVerificationBadge;
