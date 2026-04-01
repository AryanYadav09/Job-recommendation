import Job from "../models/Job.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import UserAction from "../models/UserAction.js";
import Application from "../models/Application.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ACTION_WEIGHTS = {
  view: 1,
  save: 3,
  apply: 5
};

const recordAction = async ({ userId, jobId, actionType }) => {
  await UserAction.findOneAndUpdate(
    { user: userId, job: jobId, actionType },
    {
      user: userId,
      job: jobId,
      actionType,
      weight: ACTION_WEIGHTS[actionType] || 1,
      updatedAt: new Date()
    },
    {
      upsert: true,
      setDefaultsOnInsert: true,
      new: true
    }
  );
};

export const getJobs = asyncHandler(async (req, res) => {
  const { skills, location, type, company, category, search } = req.query;

  const query = { status: "active" };

  if (skills) {
    const parsedSkills = String(skills)
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    if (parsedSkills.length) {
      query.requiredSkills = { $in: parsedSkills };
    }
  }

  if (location) {
    query.location = { $regex: location, $options: "i" };
  }

  if (type) {
    query.type = type;
  }

  if (category) {
    query.category = { $regex: category, $options: "i" };
  }

  if (company) {
    const companies = await Company.find({
      name: { $regex: company, $options: "i" }
    })
      .select("_id")
      .lean();
    query.company = { $in: companies.map((c) => c._id) };
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { requiredSkills: { $in: [new RegExp(search, "i")] } }
    ];
  }

  const jobs = await Job.find(query)
    .populate("company", "name logoUrl location industry verificationStatus")
    .sort({ createdAt: -1 })
    .lean();

  res.json(jobs);
});

export const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId)
    .populate(
      "company",
      "name logoUrl location industry description website verificationStatus"
    )
    .lean();

  if (!job) {
    const error = new Error("Job not found");
    error.statusCode = 404;
    throw error;
  }

  res.json(job);
});

export const trackView = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId).lean();
  if (!job) {
    const error = new Error("Job not found");
    error.statusCode = 404;
    throw error;
  }

  await recordAction({
    userId: req.user._id,
    jobId: req.params.jobId,
    actionType: "view"
  });

  res.json({ message: "View tracked" });
});

export const toggleSaveJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId).lean();
  if (!job) {
    const error = new Error("Job not found");
    error.statusCode = 404;
    throw error;
  }

  const user = await User.findById(req.user._id);
  const jobId = String(req.params.jobId);
  const hasSaved = user.savedJobs.some((id) => String(id) === jobId);

  if (hasSaved) {
    user.savedJobs = user.savedJobs.filter((id) => String(id) !== jobId);
    await user.save();
    return res.json({ message: "Job removed from saved list", saved: false });
  }

  user.savedJobs.push(jobId);
  await user.save();

  await recordAction({
    userId: req.user._id,
    jobId,
    actionType: "save"
  });

  res.json({ message: "Job saved", saved: true });
});

export const applyToJob = asyncHandler(async (req, res) => {
  const { resumeUrl = "", coverLetter = "" } = req.body;

  const job = await Job.findById(req.params.jobId).lean();
  if (!job) {
    const error = new Error("Job not found");
    error.statusCode = 404;
    throw error;
  }

  const existing = await Application.findOne({
    user: req.user._id,
    job: req.params.jobId
  }).lean();

  if (existing) {
    const error = new Error("You already applied to this job");
    error.statusCode = 409;
    throw error;
  }

  const application = await Application.create({
    user: req.user._id,
    job: req.params.jobId,
    company: job.company,
    resumeUrl,
    coverLetter
  });

  await recordAction({
    userId: req.user._id,
    jobId: req.params.jobId,
    actionType: "apply"
  });

  res.status(201).json({
    message: "Application submitted",
    application
  });
});

export const getSavedJobs = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("savedJobs")
    .populate({
      path: "savedJobs",
      populate: { path: "company", select: "name logoUrl location verificationStatus" }
    })
    .lean();

  res.json(user?.savedJobs || []);
});
