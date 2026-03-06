import Company from "../models/Company.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import UserAction from "../models/UserAction.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { handleValidation } from "../utils/handleValidation.js";

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
    "logoUrl"
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      company[field] = req.body[field];
    }
  });

  await company.save();

  res.json({ message: "Company profile updated", company });
});

export const createJob = asyncHandler(async (req, res) => {
  handleValidation(req);

  const company = await ensureCompany(req.user);
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

export const getJobApplicants = asyncHandler(async (req, res) => {
  const company = await ensureCompany(req.user);

  const job = await Job.findOne({ _id: req.params.jobId, company: company._id }).lean();
  if (!job) {
    const error = new Error("Job not found or not owned by this company");
    error.statusCode = 404;
    throw error;
  }

  const applicants = await Application.find({ job: req.params.jobId })
    .populate("user", "name email skills experienceLevel location")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ job, applicants });
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
    viewsByJob,
    recentApplications
  });
});
