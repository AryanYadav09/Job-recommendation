import fs from "fs/promises";
import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";
import { validateCompanyRegistry } from "./registryValidationService.js";
import {
  extractEmailDomain,
  extractHostname,
  normalizeRegistrationNumber,
  textIncludesNormalized
} from "../utils/companyVerification.js";

export const createPendingVerificationAnalysis = () => ({
  analysisStatus: "PENDING",
  extractor: "",
  analyzedAt: null,
  extractedTextPreview: "",
  extractedTextLength: 0,
  ocrConfidence: null,
  authenticityScore: 0,
  recommendation: "MANUAL_REVIEW",
  matchedSignals: [],
  riskFlags: [],
  extractedRegistrationNumbers: [],
  registryValidation: {
    provider: "",
    status: "SKIPPED",
    checkedAt: null,
    message: "",
    matchedName: false,
    matchedCompanyNumber: false,
    jurisdictionCode: "",
    companyNumber: "",
    companyStatus: "",
    registryUrl: "",
    source: ""
  },
  errorMessage: ""
});

const buildFailedAnalysis = (message) => ({
  ...createPendingVerificationAnalysis(),
  analysisStatus: "FAILED",
  analyzedAt: new Date(),
  recommendation: "ANALYSIS_FAILED",
  errorMessage: message || "Document analysis failed."
});

const getWorkerOptions = () => {
  const options = {
    logger: () => undefined
  };

  if (process.env.TESSERACT_LANG_PATH) {
    options.langPath = process.env.TESSERACT_LANG_PATH;
  }

  return options;
};

const getOcrLanguage = () => process.env.OCR_LANGUAGE || "eng";

const withOcrWorker = async (work) => {
  const worker = await createWorker(getOcrLanguage(), 1, getWorkerOptions());

  try {
    return await work(worker);
  } finally {
    await worker.terminate();
  }
};

const performOcr = async (worker, imageLike) => {
  const result = await worker.recognize(imageLike);

  return {
    text: String(result.data?.text || "").trim(),
    confidence:
      typeof result.data?.confidence === "number"
        ? Number(result.data.confidence.toFixed(2))
        : null
  };
};

const extractTextFromPdf = async (buffer) => {
  const parser = new PDFParse({ data: buffer });

  try {
    const textResult = await parser.getText();
    let text = String(textResult.text || "").trim();
    let extractor = "pdf-text";
    let ocrConfidence = null;

    if (text.length < 80) {
      const screenshotResult = await parser.getScreenshot({ scale: 1.5, partial: [1, 2] });
      const pages = (screenshotResult.pages || []).slice(0, 2);

      if (pages.length) {
        const ocrResults = await withOcrWorker(async (worker) => {
          const results = [];
          for (const page of pages) {
            results.push(await performOcr(worker, Buffer.from(page.data)));
          }
          return results;
        });

        const ocrText = ocrResults.map((item) => item.text).filter(Boolean).join("\n").trim();
        const confidenceValues = ocrResults
          .map((item) => item.confidence)
          .filter((value) => typeof value === "number");

        if (ocrText) {
          text = [text, ocrText].filter(Boolean).join("\n").trim();
          extractor = textResult.text?.trim() ? "pdf-text+ocr" : "pdf-ocr";
          ocrConfidence = confidenceValues.length
            ? Number(
                (
                  confidenceValues.reduce((sum, value) => sum + value, 0) /
                  confidenceValues.length
                ).toFixed(2)
              )
            : null;
        }
      }
    }

    return {
      text,
      extractor,
      ocrConfidence
    };
  } finally {
    await parser.destroy();
  }
};

const extractTextFromImage = async (filePath) => {
  return withOcrWorker(async (worker) => {
    const result = await performOcr(worker, filePath);

    return {
      text: result.text,
      extractor: "image-ocr",
      ocrConfidence: result.confidence
    };
  });
};

const extractDocumentContent = async ({ absolutePath, mimeType }) => {
  const buffer = await fs.readFile(absolutePath);

  if (mimeType === "application/pdf") {
    return extractTextFromPdf(buffer);
  }

  return extractTextFromImage(absolutePath);
};

const extractDocumentDomains = (text = "") => {
  return Array.from(
    new Set(
      (String(text).match(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?/gi) || [])
        .map((value) => extractHostname(value))
        .filter(Boolean)
    )
  );
};

const computeAuthenticity = async ({ company, extraction }) => {
  const matchedSignals = [];
  const riskFlags = [];
  let score = 0;

  const extractedText = extraction.text || "";
  const normalizedExtractedRegistrationText = normalizeRegistrationNumber(extractedText);
  const normalizedRegistrationNumber = normalizeRegistrationNumber(company.registrationNumber);
  const businessEmailDomain = extractEmailDomain(company.businessEmail);
  const websiteDomain = extractHostname(company.website);
  const extractedDomains = extractDocumentDomains(extractedText);

  if (extractedText.length >= 80) {
    score += 10;
    matchedSignals.push("Document text was extracted successfully.");
  } else {
    riskFlags.push("Very little text could be extracted from the document.");
  }

  if (textIncludesNormalized(extractedText, company.name)) {
    score += 25;
    matchedSignals.push("Company name appears in the document.");
  } else {
    riskFlags.push("Company name was not found in the extracted text.");
  }

  if (
    normalizedRegistrationNumber &&
    normalizedExtractedRegistrationText.includes(normalizedRegistrationNumber)
  ) {
    score += 30;
    matchedSignals.push("Registration number appears in the document.");
  } else if (normalizedRegistrationNumber) {
    riskFlags.push("Registration number was not found in the extracted text.");
  }

  if (websiteDomain) {
    if (extractedDomains.some((domain) => domain === websiteDomain)) {
      score += 10;
      matchedSignals.push("Company website appears in the document.");
    } else {
      riskFlags.push("Company website was not found in the extracted text.");
    }
  }

  if (businessEmailDomain && websiteDomain) {
    if (businessEmailDomain === websiteDomain) {
      score += 5;
      matchedSignals.push("Business email domain matches website domain.");
    } else {
      riskFlags.push("Business email domain does not match website domain.");
    }
  }

  if (typeof extraction.ocrConfidence === "number") {
    if (extraction.ocrConfidence >= 70) {
      score += 5;
      matchedSignals.push("OCR confidence is high.");
    } else if (extraction.ocrConfidence < 50) {
      riskFlags.push("OCR confidence is low.");
    }
  }

  const registryValidation = await validateCompanyRegistry({
    companyName: company.name,
    companyNumber: company.registrationNumber,
    jurisdictionCode: company.registrationJurisdiction
  });

  if (registryValidation.status === "MATCHED") {
    score += 15;
    matchedSignals.push("Registry API returned a company match.");
  } else if (registryValidation.status === "PARTIAL") {
    score += 8;
    matchedSignals.push("Registry API returned a partial match.");
    riskFlags.push("Registry match was partial and should be reviewed.");
  } else if (registryValidation.status === "NOT_FOUND") {
    riskFlags.push("Registry API could not confirm the company.");
  } else if (registryValidation.status === "ERROR") {
    riskFlags.push("Registry validation failed due to a provider error.");
  }

  if (registryValidation.companyStatus) {
    if (/active|existing|normal/i.test(registryValidation.companyStatus)) {
      score += 5;
      matchedSignals.push("Registry shows the company as active.");
    } else {
      riskFlags.push(`Registry status is ${registryValidation.companyStatus}.`);
    }
  }

  const authenticityScore = Math.min(100, score);

  let recommendation = "LOW_CONFIDENCE";
  if (registryValidation.status === "MATCHED" && authenticityScore >= 80) {
    recommendation = "HIGH_CONFIDENCE";
  } else if (authenticityScore >= 60) {
    recommendation = "MEDIUM_CONFIDENCE";
  }

  return {
    authenticityScore,
    recommendation,
    matchedSignals,
    riskFlags,
    registryValidation
  };
};

export const analyzeCompanyCertificate = async ({ company, absolutePath, mimeType }) => {
  try {
    const extraction = await extractDocumentContent({ absolutePath, mimeType });
    const authenticity = await computeAuthenticity({ company, extraction });

    return {
      analysisStatus: "COMPLETED",
      extractor: extraction.extractor,
      analyzedAt: new Date(),
      extractedTextPreview: extraction.text.slice(0, 1200),
      extractedTextLength: extraction.text.length,
      ocrConfidence: extraction.ocrConfidence,
      authenticityScore: authenticity.authenticityScore,
      recommendation: authenticity.recommendation,
      matchedSignals: authenticity.matchedSignals,
      riskFlags: authenticity.riskFlags,
      extractedRegistrationNumbers: company.registrationNumber ? [company.registrationNumber] : [],
      registryValidation: authenticity.registryValidation,
      errorMessage: ""
    };
  } catch (error) {
    return buildFailedAnalysis(error.message);
  }
};
