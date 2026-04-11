import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import Company from "../models/Company.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import UserAction from "../models/UserAction.js";
import User from "../models/User.js";
import {
  analyzeCompanyCertificate,
  createPendingVerificationAnalysis
} from "../services/documentVerificationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { handleValidation } from "../utils/handleValidation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRootDir = path.resolve(__dirname, "../../uploads");

const verificationIdentityFields = new Set([
  "name",
  "website",
  "businessEmail",
  "registrationNumber",
  "registrationJurisdiction"
]);

const normalizeSalary = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizeJobPayload = (payload) => ({
  ...payload,
  salaryMin:
    payload.salaryMin !== undefined ? normalizeSalary(payload.salaryMin) : payload.salaryMin,
  salaryMax:
    payload.salaryMax !== undefined ? normalizeSalary(payload.salaryMax) : payload.salaryMax
});

const toStoredCertificatePath = (fileName) => `/uploads/company-certificates/${fileName}`;

const resolveStoredCertificatePath = (relativePath) => {
  if (!relativePath) return "";
  const normalizedPath = relativePath.replace(/^\/+/, "").replace(/^uploads[\\/]/, "");
  return path.resolve(uploadsRootDir, normalizedPath);
};

const removeCertificateFile = async (certificate) => {
  if (!certificate?.path) return;

  try {
    await fs.unlink(resolveStoredCertificatePath(certificate.path));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Failed to remove company certificate", error);
    }
  }
};

const resetVerificationState = (company) => {
  company.verificationStatus = company.certificate?.path ? "PENDING" : "UNVERIFIED";
  company.verificationNotes = "";
  company.verificationSubmittedAt = company.certificate?.path ? new Date() : null;
  company.verificationReviewedAt = null;
  company.verificationReviewedBy = null;
  company.verificationAnalysis = createPendingVerificationAnalysis();
};

const refreshVerificationAnalysis = async (company) => {
  if (!company.certificate?.path) {
    return createPendingVerificationAnalysis();
  }

  return analyzeCompanyCertificate({
    company,
    absolutePath: resolveStoredCertificatePath(company.certificate.path),
    mimeType: company.certificate.mimeType
  });
};

const ensureCompany = async (user) => {
  let company = await Company.findOne({ owner: user._id });
  if (!company) {
    company = await Company.create({
      owner: user._id,
      name: `${user.name} Company`
    });
    if (!user.company) {
      user.company = company._id;
      await user.save();
    }
  }
  return company;
};

export const getCompanyProfile = asyncHandler(async (req, res) => {
  const company = await ensureCompany(req.user);
  res.json(company);
});

export const getPublicCompanyProfile = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.companyId).lean();

  if (!company) {
    const error = new Error("Company not found");
    error.statusCode = 404;
    throw error;
  }

  const jobs = await Job.find({
    company: company._id,
    status: "active"
  })
    .select("title category location type salaryRange createdAt")
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();

  res.json({
    profileType: "COMPANY",
    profile: {
      _id: String(company._id),
      name: company.name,
      description: company.description || "",
      website: company.website || "",
      businessEmail: company.businessEmail || "",
      location: company.location || "",
      industry: company.industry || "",
      size: company.size || "",
      logoUrl: company.logoUrl || "",
      verificationStatus: company.verificationStatus,
      jobs
    }
  });
});

export const updateCompanyProfile = asyncHandler(async (req, res) => {
  handleValidation(req);

  const company = await ensureCompany(req.user);

  const allowedFields = [
    "name",
    "description",
    "website",
    "location",
    "industry",
    "size",
    "businessEmail",
    "registrationNumber",
    "registrationJurisdiction",
    "logoUrl"
  ];

  let requiresVerificationRefresh = false;

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (verificationIdentityFields.has(field) && company[field] !== req.body[field]) {
        requiresVerificationRefresh = true;
      }
      company[field] = req.body[field];
    }
  });

  if (requiresVerificationRefresh) {
    resetVerificationState(company);
    company.verificationAnalysis = await refreshVerificationAnalysis(company);
  }

  await company.save();

  res.json({ message: "Company profile updated", company });
});

export const uploadCompanyCertificate = asyncHandler(async (req, res) => {
  const company = await ensureCompany(req.user);

  if (!req.file) {
    const error = new Error("Certificate file is required");
    error.statusCode = 400;
    throw error;
  }

  if (!company.businessEmail || !company.registrationNumber) {
    await fs.unlink(req.file.path).catch(() => null);
    const error = new Error("Save business email and registration number before uploading");
    error.statusCode = 400;
    throw error;
  }

  const fileBuffer = await fs.readFile(req.file.path);
  const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  const duplicateCertificate = await Company.findOne({
    _id: { $ne: company._id },
    "certificate.hash": fileHash
  })
    .select("_id")
    .lean();

  if (duplicateCertificate) {
    await fs.unlink(req.file.path).catch(() => null);
    const error = new Error("This certificate file is already being used by another company");
    error.statusCode = 409;
    throw error;
  }

  await removeCertificateFile(company.certificate);

  company.certificate = {
    originalName: req.file.originalname,
    storedName: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    path: toStoredCertificatePath(req.file.filename),
    hash: fileHash,
    uploadedAt: new Date()
  };
  company.verificationStatus = "PENDING";
  company.verificationNotes = "";
  company.verificationSubmittedAt = new Date();
  company.verificationReviewedAt = null;
  company.verificationReviewedBy = null;
  company.verificationAnalysis = await refreshVerificationAnalysis(company);

  await company.save();

  res.status(201).json({
    message: "Certificate uploaded. Verification is pending admin review.",
    company
  });
});

export const createJob = asyncHandler(async (req, res) => {
  handleValidation(req);

  const company = await ensureCompany(req.user);
  if (company.verificationStatus !== "VERIFIED") {
    const error = new Error("Company verification is required before posting new jobs");
    error.statusCode = 403;
    throw error;
  }

  const payload = normalizeJobPayload(req.body);

  const job = await Job.create({
    ...payload,
    company: company._id,
    postedBy: req.user._id
  });

  res.status(201).json({ message: "Job posted", job });
});

export const updateJob = asyncHandler(async (req, res) => {
  handleValidation(req);

  const company = await ensureCompany(req.user);
  const payload = normalizeJobPayload(req.body);

  const job = await Job.findOne({
    _id: req.params.jobId,
    company: company._id
  });

  if (!job) {
    const error = new Error("Job not found or not owned by this company");
    error.statusCode = 404;
    throw error;
  }

  Object.assign(job, payload);
  await job.save();

  res.json({ message: "Job updated", job });
});

export const deleteJob = asyncHandler(async (req, res) => {
  const company = await ensureCompany(req.user);

  const job = await Job.findOneAndDelete({
    _id: req.params.jobId,
    company: company._id
  });

  if (!job) {
    const error = new Error("Job not found or not owned by this company");
    error.statusCode = 404;
    throw error;
  }

  await Promise.all([
    Application.deleteMany({ job: job._id }),
    UserAction.deleteMany({ job: job._id }),
    User.updateMany({ savedJobs: job._id }, { $pull: { savedJobs: job._id } })
  ]);

  res.json({ message: "Job deleted" });
});

export const getCompanyJobs = asyncHandler(async (req, res) => {
  const company = await ensureCompany(req.user);

  const jobs = await Job.find({ company: company._id })
    .sort({ createdAt: -1 })
    .lean();

  res.json(jobs);
});

export const getCompanyApplications = asyncHandler(async (req, res) => {
  const company = await ensureCompany(req.user);

  const applications = await Application.find({ company: company._id })
    .populate("job", "title category location type status")
    .populate("user", "name email skills experienceLevel location desiredRoles")
    .sort({ createdAt: -1 })
    .lean();

  const statusCounts = applications.reduce(
    (acc, application) => {
      const status = application.status || "submitted";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {
      submitted: 0,
      reviewing: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0
    }
  );

  res.json({
    applications,
    counters: {
      total: applications.length,
      ...statusCounts
    }
  });
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  handleValidation(req);

  const company = await ensureCompany(req.user);

  const application = await Application.findOne({
    _id: req.params.applicationId,
    company: company._id
  });

  if (!application) {
    const error = new Error("Application not found for this company");
    error.statusCode = 404;
    throw error;
  }

  application.status = req.body.status;
  await application.save();

  const populatedApplication = await Application.findById(application._id)
    .populate("job", "title category location type status")
    .populate("user", "name email skills experienceLevel location desiredRoles")
    .lean();

  res.json({
    message: "Application status updated",
    application: populatedApplication
  });
});

export const getDashboard = asyncHandler(async (req, res) => {
  const company = await ensureCompany(req.user);

  const jobs = await Job.find({ company: company._id }).select("_id status").lean();
  const jobIds = jobs.map((job) => job._id);

  const [applicationsCount, recentApplications, actions] = await Promise.all([
    Application.countDocuments({ company: company._id }),
    Application.find({ company: company._id })
      .populate("job", "title")
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    UserAction.aggregate([
      { $match: { job: { $in: jobIds }, actionType: "view" } },
      { $group: { _id: "$job", views: { $sum: 1 } } }
    ])
  ]);

  const viewsByJob = actions.reduce((acc, action) => {
    acc[String(action._id)] = action.views;
    return acc;
  }, {});

  res.json({
    counters: {
      totalJobs: jobs.length,
      activeJobs: jobs.filter((job) => job.status === "active").length,
      closedJobs: jobs.filter((job) => job.status === "closed").length,
      totalApplications: applicationsCount
    },
    verificationStatus: company.verificationStatus,
    verificationAnalysis: company.verificationAnalysis,
    viewsByJob,
    recentApplications
  });
});
