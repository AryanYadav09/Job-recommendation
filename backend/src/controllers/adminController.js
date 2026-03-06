import User from "../models/User.js";
import Company from "../models/Company.js";
import Job from "../models/Job.js";
import UserAction from "../models/UserAction.js";
import Application from "../models/Application.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllUsers = asyncHandler(async (_req, res) => {
  const users = await User.find()
    .select("-password")
    .populate("company", "name location")
    .sort({ createdAt: -1 })
    .lean();

  res.json(users);
});

export const getAllCompanies = asyncHandler(async (_req, res) => {
  const companies = await Company.find()
    .populate("owner", "name email")
    .sort({ createdAt: -1 })
    .lean();

  const companyIds = companies.map((company) => company._id);
  const jobCounts = await Job.aggregate([
    { $match: { company: { $in: companyIds } } },
    { $group: { _id: "$company", totalJobs: { $sum: 1 } } }
  ]);

  const countMap = jobCounts.reduce((acc, item) => {
    acc[String(item._id)] = item.totalJobs;
    return acc;
  }, {});

  const enriched = companies.map((company) => ({
    ...company,
    totalJobs: countMap[String(company._id)] || 0
  }));

  res.json(enriched);
});

export const getAllJobs = asyncHandler(async (_req, res) => {
  const jobs = await Job.find()
    .populate("company", "name")
    .sort({ createdAt: -1 })
    .lean();

  res.json(jobs);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.role === "ADMIN") {
    const error = new Error("Cannot delete admin users");
    error.statusCode = 403;
    throw error;
  }

  await Promise.all([
    UserAction.deleteMany({ user: user._id }),
    Application.deleteMany({ user: user._id })
  ]);

  if (user.role === "COMPANY") {
    const company = await Company.findOne({ owner: user._id });
    if (company) {
      const jobs = await Job.find({ company: company._id }).select("_id").lean();
      const jobIds = jobs.map((job) => job._id);

      await Promise.all([
        Job.deleteMany({ company: company._id }),
        Company.deleteOne({ _id: company._id }),
        Application.deleteMany({ job: { $in: jobIds } }),
        UserAction.deleteMany({ job: { $in: jobIds } })
      ]);
    }
  }

  await user.deleteOne();
  res.json({ message: "User deleted" });
});

export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndDelete(req.params.jobId).lean();
  if (!job) {
    const error = new Error("Job not found");
    error.statusCode = 404;
    throw error;
  }

  await Promise.all([
    Application.deleteMany({ job: job._id }),
    UserAction.deleteMany({ job: job._id }),
    User.updateMany({ savedJobs: job._id }, { $pull: { savedJobs: job._id } })
  ]);

  res.json({ message: "Job removed" });
});
