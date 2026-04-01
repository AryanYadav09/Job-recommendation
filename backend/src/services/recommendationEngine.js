import User from "../models/User.js";
import Job from "../models/Job.js";
import UserAction from "../models/UserAction.js";
import Application from "../models/Application.js";

const ACTION_WEIGHTS = {
  view: 1,
  save: 3,
  apply: 5
};

const normalize = (value, maxValue) => {
  if (!maxValue) return 0;
  return Number((value / maxValue).toFixed(4));
};

const toLower = (value) => String(value || "").trim().toLowerCase();

const parseSalaryToken = (token) => {
  if (!token) return null;
  const cleaned = token.replace(/\s/g, "").toLowerCase();
  const numeric = Number.parseFloat(cleaned);
  if (!Number.isFinite(numeric)) return null;
  if (cleaned.endsWith("m")) return Math.round(numeric * 1000000);
  if (cleaned.endsWith("k")) return Math.round(numeric * 1000);
  return Math.round(numeric);
};

const extractSalaryBounds = (salaryRange) => {
  if (!salaryRange) return [null, null];
  const tokens = String(salaryRange).match(/\d+(?:\.\d+)?\s*[kKmM]?/g);
  if (!tokens || !tokens.length) return [null, null];

  const values = tokens
    .map(parseSalaryToken)
    .filter((value) => Number.isFinite(value));

  if (!values.length) return [null, null];
  if (values.length === 1) return [values[0], values[0]];

  return [Math.min(...values), Math.max(...values)];
};

const getJobSalaryBounds = (job) => {
  if (Number.isFinite(job.salaryMin) || Number.isFinite(job.salaryMax)) {
    return [
      Number.isFinite(job.salaryMin) ? job.salaryMin : null,
      Number.isFinite(job.salaryMax) ? job.salaryMax : null
    ];
  }
  return extractSalaryBounds(job.salaryRange);
};

const computeContentScore = (user, job) => {
  const userSkills = (user.skills || []).map(toLower).filter(Boolean);
  const jobSkills = (job.requiredSkills || []).map(toLower).filter(Boolean);

  const matchedSkills = jobSkills.filter((skill) => userSkills.includes(skill));
  const skillScore = jobSkills.length
    ? Number((matchedSkills.length / jobSkills.length).toFixed(4))
    : 0;

  const preferredCategory = toLower(user.preferredCategory);
  const categoryScore =
    preferredCategory && toLower(job.category).includes(preferredCategory) ? 1 : 0;

  const locationPrefs = [...(user.preferredLocations || []), user.location]
    .map(toLower)
    .filter(Boolean);

  const jobLocation = toLower(job.location);
  const locationScore = locationPrefs.length
    ? locationPrefs.some((loc) => jobLocation.includes(loc) || (loc === "remote" && job.type === "remote"))
      ? 1
      : 0
    : 0;

  const desiredTypes = (user.desiredJobTypes || []).map(toLower);
  const typeScore = desiredTypes.length
    ? desiredTypes.includes(toLower(job.type))
      ? 1
      : 0
    : 0;

  const expectedMin = Number.isFinite(user.expectedSalaryMin) ? user.expectedSalaryMin : null;
  const expectedMax = Number.isFinite(user.expectedSalaryMax) ? user.expectedSalaryMax : null;
  const [jobMin, jobMax] = getJobSalaryBounds(job);

  let salaryScore = 0;
  if (expectedMin !== null || expectedMax !== null) {
    if (jobMin !== null || jobMax !== null) {
      const safeExpectedMin = expectedMin ?? 0;
      const safeExpectedMax = expectedMax ?? Number.MAX_SAFE_INTEGER;
      const safeJobMin = jobMin ?? 0;
      const safeJobMax = jobMax ?? safeJobMin;
      salaryScore = safeJobMax >= safeExpectedMin && safeJobMin <= safeExpectedMax ? 1 : 0;
    }
  }

  const matchedPreferences = [];
  if (categoryScore) matchedPreferences.push("preferred category");
  if (locationScore) matchedPreferences.push("preferred location");
  if (typeScore) matchedPreferences.push("preferred job type");
  if (salaryScore) matchedPreferences.push("salary expectation");

  const contentScore = Number(
    (
      skillScore * 0.6 +
      categoryScore * 0.15 +
      locationScore * 0.1 +
      typeScore * 0.1 +
      salaryScore * 0.05
    ).toFixed(4)
  );

  return {
    contentScore,
    matchedSkills,
    matchedPreferences
  };
};

const computeReason = ({ job, skillMatch, behaviorScore, similarUserScore, matchedSkills, matchedPreferences }) => {
  const topSignal = Math.max(skillMatch, behaviorScore, similarUserScore);

  if (topSignal === skillMatch) {
    if (matchedSkills.length) {
      return `Recommended because your skills match (${matchedSkills.slice(0, 3).join(", ")})`;
    }
    if (matchedPreferences.length) {
      return `Recommended because it matches your ${matchedPreferences
        .slice(0, 2)
        .join(" and ")}`;
    }
  }

  if (topSignal === behaviorScore) {
    return `Recommended because of your activity on ${job.category} and related roles`;
  }

  if (topSignal === similarUserScore) {
    return "Recommended because users with similar skills applied to this job";
  }

  if (matchedPreferences.length) {
    return `Recommended because it matches your ${matchedPreferences.slice(0, 2).join(" and ")}`;
  }

  return "Recommended based on your profile and activity";
};

const getSimilarUsers = async (userId, user) => {
  if (user.skills?.length) {
    return User.find({
      _id: { $ne: userId },
      role: "USER",
      skills: { $in: user.skills }
    })
      .select("_id")
      .limit(100)
      .lean();
  }

  if (user.preferredCategory) {
    return User.find({
      _id: { $ne: userId },
      role: "USER",
      preferredCategory: { $regex: user.preferredCategory, $options: "i" }
    })
      .select("_id")
      .limit(100)
      .lean();
  }

  return [];
};

export const generateRecommendations = async (userId, limit = 10) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const [jobs, userActions] = await Promise.all([
    Job.find({ status: "active" })
      .populate("company", "name logoUrl verificationStatus")
      .lean(),
    UserAction.find({ user: userId }).populate("job").lean()
  ]);

  if (!jobs.length) return [];

  const behaviorSkillMap = new Map();
  const behaviorCategoryMap = new Map();
  const behaviorCompanyMap = new Map();
  const interactedJobIds = new Set();

  for (const action of userActions) {
    const actionWeight = ACTION_WEIGHTS[action.actionType] || action.weight || 1;
    if (!action.job) continue;

    interactedJobIds.add(String(action.job._id));

    for (const skill of action.job.requiredSkills || []) {
      const key = toLower(skill);
      behaviorSkillMap.set(key, (behaviorSkillMap.get(key) || 0) + actionWeight);
    }

    const categoryKey = toLower(action.job.category);
    if (categoryKey) {
      behaviorCategoryMap.set(
        categoryKey,
        (behaviorCategoryMap.get(categoryKey) || 0) + actionWeight
      );
    }

    const companyKey = String(action.job.company);
    behaviorCompanyMap.set(companyKey, (behaviorCompanyMap.get(companyKey) || 0) + actionWeight);
  }

  const similarUsers = await getSimilarUsers(userId, user);
  const similarUserIds = similarUsers.map((u) => u._id);
  const similarUserApplications = similarUserIds.length
    ? await Application.find({ user: { $in: similarUserIds } }).select("job").lean()
    : [];

  const collaborativeJobCount = new Map();
  for (const app of similarUserApplications) {
    const key = String(app.job);
    collaborativeJobCount.set(key, (collaborativeJobCount.get(key) || 0) + 1);
  }

  const maxCollaborative =
    Math.max(...Array.from(collaborativeJobCount.values(), (value) => value), 0) || 1;

  const behaviorRawScores = [];
  const behaviorByJob = new Map();

  for (const job of jobs) {
    const skillSignal = (job.requiredSkills || []).reduce((acc, skill) => {
      return acc + (behaviorSkillMap.get(toLower(skill)) || 0);
    }, 0);

    const categorySignal = behaviorCategoryMap.get(toLower(job.category)) || 0;
    const companySignal = behaviorCompanyMap.get(String(job.company?._id || job.company)) || 0;

    const behaviorRaw = skillSignal + categorySignal + companySignal;
    behaviorRawScores.push(behaviorRaw);
    behaviorByJob.set(String(job._id), behaviorRaw);
  }

  const maxBehaviorRaw = Math.max(...behaviorRawScores, 0) || 1;

  const scored = jobs
    .map((job) => {
      const jobId = String(job._id);
      const { contentScore, matchedSkills, matchedPreferences } = computeContentScore(user, job);

      const skillMatchScore = contentScore;
      const behaviorScore = normalize(behaviorByJob.get(jobId) || 0, maxBehaviorRaw);
      const similarUserScore = normalize(collaborativeJobCount.get(jobId) || 0, maxCollaborative);

      const finalScore = Number(
        (
          skillMatchScore * 0.5 +
          behaviorScore * 0.3 +
          similarUserScore * 0.2
        ).toFixed(4)
      );

      return {
        job,
        score: {
          final: finalScore,
          skillMatchScore,
          behaviorScore,
          similarUserScore
        },
        reason: computeReason({
          job,
          skillMatch: skillMatchScore,
          behaviorScore,
          similarUserScore,
          matchedSkills,
          matchedPreferences
        }),
        alreadyInteracted: interactedJobIds.has(jobId)
      };
    })
    .sort((a, b) => b.score.final - a.score.final)
    .slice(0, limit);

  return scored;
};
