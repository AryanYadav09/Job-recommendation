import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BriefcaseBusiness,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Sparkles
} from "lucide-react";
import api from "../services/api";
import Loader from "../components/Loader";
import PageTransition from "../components/PageTransition";
import CompanyVerificationBadge from "../components/CompanyVerificationBadge";
import { formatDate, formatJobType, getInitials, toAbsoluteAssetUrl } from "../utils/format";

const PublicProfilePage = ({ profileType }) => {
  const { profileId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);

      try {
        const endpoint =
          profileType === "company"
            ? `/company/${profileId}/public-profile`
            : `/users/${profileId}/public-profile`;
        const response = await api.get(endpoint);
        setData(response.data);
        setErrorMessage("");
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load profile");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile().catch(() => setLoading(false));
  }, [profileId, profileType]);

  if (loading) return <Loader />;

  if (!data?.profile) {
    return (
      <PageTransition>
        <div className="glass p-6 text-sm text-rose-500">{errorMessage || "Profile not found."}</div>
      </PageTransition>
    );
  }

  if (data.profileType === "COMPANY") {
    const company = data.profile;

    return (
      <PageTransition>
        <section className="space-y-6">
          <div className="rounded-[34px] border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-blue-100 p-6 shadow-card dark:border-slate-800 dark:bg-slate-950/70 md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                {company.logoUrl ? (
                  <img
                    src={toAbsoluteAssetUrl(company.logoUrl)}
                    alt={company.name}
                    className="h-16 w-16 rounded-[1.5rem] object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-sky-500 to-blue-700 font-display text-xl font-bold text-white shadow-sm">
                    {getInitials(company.name)}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700/70 dark:text-sky-300/70">
                    Company profile
                  </p>
                  <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
                    {company.name}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={14} /> {company.location || "Location not shared"}
                    </span>
                    {company.industry ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles size={14} /> {company.industry}
                      </span>
                    ) : null}
                    {company.size ? (
                      <span className="inline-flex items-center gap-1.5">
                        <BriefcaseBusiness size={14} /> {company.size}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <CompanyVerificationBadge status={company.verificationStatus} showAll />
            </div>

            <p className="mt-6 max-w-4xl text-base leading-8 text-slate-600 dark:text-slate-300">
              {company.description || "This company has not added a description yet."}
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="glass p-6">
              <h2 className="section-title">Contact details</h2>
              <div className="mt-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Website</p>
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-2 font-semibold text-accent"
                    >
                      Visit website <ExternalLink size={14} />
                    </a>
                  ) : (
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      Not shared
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Business email</p>
                  <p className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <Mail size={14} /> {company.businessEmail || "Not shared"}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="section-title">Active jobs</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Latest published roles from this company.
                  </p>
                </div>
                <span className="badge">{company.jobs.length}</span>
              </div>

              <div className="mt-5 space-y-3">
                {company.jobs.length ? (
                  company.jobs.map((job) => (
                    <article
                      key={job._id}
                      className="rounded-[24px] border border-slate-200/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/60"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950 dark:text-white">{job.title}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {formatJobType(job.type)} | {job.location} | Posted {formatDate(job.createdAt)}
                          </p>
                        </div>
                        <Link className="btn-secondary" to={`/jobs/${job._id}`}>
                          View role
                        </Link>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                    No active jobs are public right now.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </PageTransition>
    );
  }

  const profile = data.profile;

  return (
    <PageTransition>
      <section className="space-y-6">
        <div className="rounded-[34px] border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-blue-100 p-6 shadow-card dark:border-slate-800 dark:bg-slate-950/70 md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-sky-500 to-blue-700 font-display text-xl font-bold text-white shadow-sm">
              {getInitials(profile.name)}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700/70 dark:text-sky-300/70">
                Candidate profile
              </p>
              <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
                {profile.name}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} /> {profile.location || "Location not shared"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles size={14} /> {profile.experienceLevel || "Experience not shared"}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-6 max-w-4xl text-base leading-8 text-slate-600 dark:text-slate-300">
            {profile.experienceSummary || "No experience summary has been shared yet."}
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="glass p-6">
            <h2 className="section-title">Career snapshot</h2>
            <div className="mt-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Preferred category</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {profile.preferredCategory || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Desired roles</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {profile.desiredRoles?.length ? profile.desiredRoles.join(", ") : "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Resume</p>
                {profile.resumeUrl ? (
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-2 font-semibold text-accent"
                  >
                    Open resume <ExternalLink size={14} />
                  </a>
                ) : (
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">Not shared</p>
                )}
              </div>
            </div>
          </div>

          <div className="glass p-6">
            <h2 className="section-title">Skills</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.skills?.length ? (
                profile.skills.map((skill) => (
                  <span key={skill} className="badge">
                    {skill}
                  </span>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                  No skills have been shared yet.
                </div>
              )}
            </div>

            {profile.resumeUrl ? (
              <div className="mt-6 rounded-[24px] border border-slate-200/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <FileText size={15} /> Resume available
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Use the resume link in the career snapshot panel to open the candidate's latest shared resume.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </PageTransition>
  );
};

export default PublicProfilePage;
