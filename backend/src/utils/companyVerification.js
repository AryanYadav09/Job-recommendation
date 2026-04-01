const COMPANY_SUFFIXES = /\b(private|pvt|limited|ltd|incorporated|inc|corporation|corp|company|co|llc|llp|plc)\b/gi;

export const normalizeFreeformText = (value = "") =>
  String(value).toLowerCase().replace(/[^a-z0-9]/g, "");

export const normalizeCompanyName = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(COMPANY_SUFFIXES, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const normalizeRegistrationNumber = (value = "") =>
  String(value).toUpperCase().replace(/[^A-Z0-9]/g, "");

export const textIncludesNormalized = (text = "", value = "") => {
  const normalizedText = normalizeFreeformText(text);
  const normalizedValue = normalizeFreeformText(value);

  if (!normalizedText || !normalizedValue) {
    return false;
  }

  return normalizedText.includes(normalizedValue);
};

export const extractHostname = (value = "") => {
  if (!value) return "";

  try {
    const normalizedValue = value.includes("://") ? value : `https://${value}`;
    return new URL(normalizedValue).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
};

export const extractEmailDomain = (value = "") => {
  const parts = String(value).trim().toLowerCase().split("@");
  return parts[1] ? parts[1].replace(/^www\./i, "") : "";
};

export const formatEnumLabel = (value = "") =>
  String(value)
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
