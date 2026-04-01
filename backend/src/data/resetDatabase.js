import Application from "../models/Application.js";
import UserAction from "../models/UserAction.js";
import Job from "../models/Job.js";
import Company from "../models/Company.js";
import User from "../models/User.js";

export const clearAppCollections = async () => {
  const [applicationsResult, userActionsResult, jobsResult, companiesResult, usersResult] =
    await Promise.all([
      Application.deleteMany({}),
      UserAction.deleteMany({}),
      Job.deleteMany({}),
      Company.deleteMany({}),
      User.deleteMany({})
    ]);

  return [
    { collection: "applications", deleted: applicationsResult.deletedCount || 0 },
    { collection: "useractions", deleted: userActionsResult.deletedCount || 0 },
    { collection: "jobs", deleted: jobsResult.deletedCount || 0 },
    { collection: "companies", deleted: companiesResult.deletedCount || 0 },
    { collection: "users", deleted: usersResult.deletedCount || 0 }
  ];
};

