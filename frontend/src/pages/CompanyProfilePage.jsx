import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PageTransition from "../components/PageTransition";
import Loader from "../components/Loader";
import CompanyVerificationBadge from "../components/CompanyVerificationBadge";
import CompanyVerificationInsights from "../components/CompanyVerificationInsights";
import { formatDate, toAbsoluteAssetUrl } from "../utils/format";

const emptyForm = {
  name: "",
  description: "",
  website: "",
  location: "",
  industry: "",
  size: "",
  businessEmail: "",
  registrationNumber: "",
  registrationJurisdiction: "",
  logoUrl: ""
};

const CompanyProfilePage = () => {
  const { refreshUser } = useAuth();
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [certificateFile, setCertificateFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const syncCompany = (data) => {
    setCompany(data);
    setForm({
      name: data.name || "",
      description: data.description || "",
      website: data.website || "",
      location: data.location || "",
      industry: data.industry || "",
      size: data.size || "",
      businessEmail: data.businessEmail || "",
      registrationNumber: data.registrationNumber || "",
      registrationJurisdiction: data.registrationJurisdiction || "",
      logoUrl: data.logoUrl || ""
    });
  };

  const loadCompany = async () => {
    const { data } = await api.get("/company/profile");
    syncCompany(data);
  };

  useEffect(() => {
    loadCompany()
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const certificateUrl = useMemo(
    () => toAbsoluteAssetUrl(company?.certificate?.path || ""),
    [company?.certificate?.path]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data } = await api.put("/company/profile", form);
      syncCompany(data.company);
      setMessage(data.message);
      await refreshUser();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update");
    } finally {
      setSaving(false);
    }
  };

  const handleCertificateUpload = async () => {
    if (!certificateFile) {
      setMessage("Select a certificate file before uploading");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("certificate", certificateFile);

      const { data } = await api.post("/company/verification/certificate", formData);
      syncCompany(data.company);
      setCertificateFile(null);
      setMessage(data.message);
      await refreshUser();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to upload certificate");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <PageTransition>
      <div className="space-y-6">
        <section className="glass mx-auto max-w-4xl p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="section-title">Company Profile</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Keep your company identity and verification documents current.
              </p>
            </div>
            <CompanyVerificationBadge
              status={company?.verificationStatus}
              showAll
              className="self-start"
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Certificate status
              </p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                {company?.verificationStatus === "VERIFIED" &&
                  "Your company can publish new jobs with a verified employer badge."}
                {company?.verificationStatus === "PENDING" &&
                  "Your certificate is queued for admin review. The system has already parsed the document and stored analysis results below."}
                {company?.verificationStatus === "REJECTED" &&
                  "Your last certificate review was rejected. Update your info or upload a new file."}
                {company?.verificationStatus === "UNVERIFIED" &&
                  "Add business details, then upload a certificate to start OCR and registry checks."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Submitted
              </p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                {company?.verificationSubmittedAt
                  ? formatDate(company.verificationSubmittedAt)
                  : "No certificate submitted yet"}
              </p>
              {company?.verificationNotes ? (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  Admin note: {company.verificationNotes}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-5">
            <CompanyVerificationInsights company={company} showPreview />
          </div>
        </section>

        <form className="glass mx-auto max-w-4xl p-6" onSubmit={handleSubmit}>
          <h2 className="section-title">Company Details</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <input
              className="input md:col-span-2"
              placeholder="Company name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <textarea
              className="input md:col-span-2 min-h-28"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Website"
              value={form.website}
              onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Industry"
              value={form.industry}
              onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Size (e.g., 51-200)"
              value={form.size}
              onChange={(e) => setForm((prev) => ({ ...prev, size: e.target.value }))}
            />
            <input
              className="input"
              type="email"
              placeholder="Business email"
              value={form.businessEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, businessEmail: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Registration number"
              value={form.registrationNumber}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, registrationNumber: e.target.value }))
              }
            />
            <input
              className="input"
              placeholder="Registry jurisdiction code (e.g., us_ca, gb)"
              value={form.registrationJurisdiction}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  registrationJurisdiction: e.target.value.toLowerCase()
                }))
              }
            />
            <input
              className="input"
              placeholder="Logo URL"
              value={form.logoUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
            />
          </div>

          <div className="mt-5 flex gap-2">
            <button className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Company Profile"}
            </button>
          </div>
        </form>

        <section className="glass mx-auto max-w-4xl p-6">
          <h2 className="section-title">Verification Certificate</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Upload a PDF, PNG, or JPG certificate. PDFs are parsed directly, images run through OCR, and scanned PDFs use OCR fallback on the first pages.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <input
                className="input"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
              />
              {company?.certificate?.path ? (
                <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  <p>Current file: {company.certificate.originalName || "Uploaded certificate"}</p>
                  <a
                    className="mt-1 inline-flex font-semibold text-accent"
                    href={certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open uploaded certificate
                  </a>
                </div>
              ) : null}
            </div>

            <button
              className="btn-primary"
              type="button"
              onClick={handleCertificateUpload}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload certificate"}
            </button>
          </div>

          {message ? (
            <p className="mt-4 rounded-xl border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-700 dark:text-sky-300">
              {message}
            </p>
          ) : null}
        </section>
      </div>
    </PageTransition>
  );
};

export default CompanyProfilePage;
