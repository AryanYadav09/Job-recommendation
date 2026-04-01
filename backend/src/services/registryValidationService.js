import {
  normalizeCompanyName,
  normalizeRegistrationNumber
} from "../utils/companyVerification.js";

const OPEN_CORPORATES_BASE_URL = "https://api.opencorporates.com/v0.4";

const buildSkippedResult = (message) => ({
  provider: process.env.COMPANY_REGISTRY_PROVIDER || "",
  status: "SKIPPED",
  checkedAt: new Date(),
  message,
  matchedName: false,
  matchedCompanyNumber: false,
  jurisdictionCode: "",
  companyNumber: "",
  companyStatus: "",
  registryUrl: "",
  source: ""
});

const mapRegistryResult = (registryCompany, expectedName, expectedNumber, expectedJurisdiction, message = "") => {
  if (!registryCompany) {
    return {
      provider: "opencorporates",
      status: "NOT_FOUND",
      checkedAt: new Date(),
      message: message || "No company match was returned by OpenCorporates.",
      matchedName: false,
      matchedCompanyNumber: false,
      jurisdictionCode: expectedJurisdiction || "",
      companyNumber: expectedNumber || "",
      companyStatus: "",
      registryUrl: "",
      source: "OpenCorporates"
    };
  }

  const registryName = registryCompany.name || "";
  const registryNumber = registryCompany.company_number || registryCompany.native_company_number || "";
  const registryJurisdiction = registryCompany.jurisdiction_code || expectedJurisdiction || "";
  const normalizedExpectedName = normalizeCompanyName(expectedName);
  const normalizedRegistryName = normalizeCompanyName(registryName);
  const normalizedExpectedNumber = normalizeRegistrationNumber(expectedNumber);
  const normalizedRegistryNumber = normalizeRegistrationNumber(registryNumber);
  const matchedName =
    Boolean(normalizedExpectedName) &&
    Boolean(normalizedRegistryName) &&
    (normalizedRegistryName.includes(normalizedExpectedName) ||
      normalizedExpectedName.includes(normalizedRegistryName));
  const matchedCompanyNumber =
    Boolean(normalizedExpectedNumber) &&
    Boolean(normalizedRegistryNumber) &&
    normalizedExpectedNumber === normalizedRegistryNumber;

  let status = "NOT_FOUND";
  if (matchedName && matchedCompanyNumber) status = "MATCHED";
  else if (matchedName || matchedCompanyNumber) status = "PARTIAL";

  return {
    provider: "opencorporates",
    status,
    checkedAt: new Date(),
    message:
      message ||
      (status === "MATCHED"
        ? "OpenCorporates returned a direct match."
        : status === "PARTIAL"
          ? "OpenCorporates returned a partial match."
          : "OpenCorporates did not return a reliable match."),
    matchedName,
    matchedCompanyNumber,
    jurisdictionCode: registryJurisdiction,
    companyNumber: registryNumber || expectedNumber || "",
    companyStatus: registryCompany.current_status || (registryCompany.inactive ? "inactive" : ""),
    registryUrl:
      registryCompany.registry_url ||
      registryCompany.opencorporates_url ||
      "",
    source: "OpenCorporates"
  };
};

const fetchOpenCorporatesCompany = async ({ token, jurisdictionCode, companyNumber }) => {
  const url = new URL(
    `${OPEN_CORPORATES_BASE_URL}/companies/${encodeURIComponent(jurisdictionCode)}/${encodeURIComponent(companyNumber)}`
  );
  url.searchParams.set("api_token", token);

  const response = await fetch(url);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`OpenCorporates company lookup failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.results?.company || null;
};

const searchOpenCorporatesCompanies = async ({ token, companyName, jurisdictionCode }) => {
  const url = new URL(`${OPEN_CORPORATES_BASE_URL}/companies/search`);
  url.searchParams.set("api_token", token);
  url.searchParams.set("q", companyName);
  if (jurisdictionCode) {
    url.searchParams.set("jurisdiction_code", jurisdictionCode);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OpenCorporates search failed with status ${response.status}`);
  }

  const data = await response.json();
  return (data.results?.companies || []).map((entry) => entry.company).filter(Boolean);
};

export const validateCompanyRegistry = async ({
  companyName,
  companyNumber,
  jurisdictionCode
}) => {
  const provider = String(process.env.COMPANY_REGISTRY_PROVIDER || "").toLowerCase();
  const token = process.env.OPENCORPORATES_API_TOKEN;

  if (!provider) {
    return buildSkippedResult("No registry provider configured.");
  }

  if (provider !== "opencorporates") {
    return buildSkippedResult(`Unsupported registry provider: ${provider}`);
  }

  if (!token) {
    return buildSkippedResult("OpenCorporates API token is missing.");
  }

  if (!companyName) {
    return buildSkippedResult("Company name is required for registry validation.");
  }

  try {
    if (companyNumber && jurisdictionCode) {
      const company = await fetchOpenCorporatesCompany({
        token,
        jurisdictionCode,
        companyNumber
      });

      if (company) {
        return mapRegistryResult(
          company,
          companyName,
          companyNumber,
          jurisdictionCode
        );
      }
    }

    const searchResults = await searchOpenCorporatesCompanies({
      token,
      companyName,
      jurisdictionCode
    });

    const normalizedExpectedNumber = normalizeRegistrationNumber(companyNumber);
    const directNumberMatch = searchResults.find((company) => {
      const candidateNumber = normalizeRegistrationNumber(
        company.company_number || company.native_company_number || ""
      );
      return normalizedExpectedNumber && candidateNumber === normalizedExpectedNumber;
    });

    const bestCandidate =
      directNumberMatch ||
      searchResults.find((company) => {
        const normalizedCandidateName = normalizeCompanyName(company.name || "");
        const normalizedExpectedName = normalizeCompanyName(companyName);
        return (
          normalizedCandidateName &&
          normalizedExpectedName &&
          (normalizedCandidateName.includes(normalizedExpectedName) ||
            normalizedExpectedName.includes(normalizedCandidateName))
        );
      }) ||
      null;

    return mapRegistryResult(
      bestCandidate,
      companyName,
      companyNumber,
      jurisdictionCode,
      bestCandidate
        ? "OpenCorporates search returned a candidate match."
        : "OpenCorporates search returned no matching company."
    );
  } catch (error) {
    return {
      provider: "opencorporates",
      status: "ERROR",
      checkedAt: new Date(),
      message: error.message || "OpenCorporates validation failed.",
      matchedName: false,
      matchedCompanyNumber: false,
      jurisdictionCode: jurisdictionCode || "",
      companyNumber: companyNumber || "",
      companyStatus: "",
      registryUrl: "",
      source: "OpenCorporates"
    };
  }
};
