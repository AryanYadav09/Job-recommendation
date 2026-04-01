import { formatDate, formatEnumLabel } from "../utils/format";

const CompanyVerificationInsights = ({ company, showPreview = false }) => {
  const analysis = company?.verificationAnalysis;
  const registry = analysis?.registryValidation;

  if (!analysis?.analyzedAt) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/60">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Verification Analysis
        </p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          No OCR or registry analysis has been run yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Verification Analysis
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {analysis.authenticityScore || 0}/100
          </p>
        </div>
        <div className="text-right text-sm text-slate-600 dark:text-slate-300">
          <p>{formatEnumLabel(analysis.recommendation || "manual_review")}</p>
          <p>Ran on {formatDate(analysis.analyzedAt)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Extraction
          </p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
            {analysis.extractor ? formatEnumLabel(analysis.extractor.replace(/\+/g, "_")) : "-"}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Text length: {analysis.extractedTextLength || 0} characters
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            OCR confidence:{" "}
            {typeof analysis.ocrConfidence === "number" ? `${analysis.ocrConfidence}%` : "N/A"}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Registry Validation
          </p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
            {formatEnumLabel(registry?.status || "skipped")}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Provider: {registry?.provider || "Not configured"}
          </p>
          {registry?.message ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{registry.message}</p>
          ) : null}
        </div>
      </div>

      {analysis.matchedSignals?.length ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Positive Signals
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {analysis.matchedSignals.map((signal) => (
              <span
                key={signal}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
              >
                {signal}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {analysis.riskFlags?.length ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Risk Flags
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {analysis.riskFlags.map((flag) => (
              <span
                key={flag}
                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
              >
                {flag}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {showPreview && analysis.extractedTextPreview ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Extracted Text Preview
          </p>
          <pre className="mt-2 max-h-48 overflow-auto rounded-2xl bg-slate-950/95 p-4 text-xs leading-6 text-slate-100">
            {analysis.extractedTextPreview}
          </pre>
        </div>
      ) : null}

      {analysis.errorMessage ? (
        <p className="mt-4 text-sm text-rose-600 dark:text-rose-300">{analysis.errorMessage}</p>
      ) : null}
    </div>
  );
};

export default CompanyVerificationInsights;
