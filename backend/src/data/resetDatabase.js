import Application from "../models/Application.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import UserAction from "../models/UserAction.js";
import Job from "../models/Job.js";
import Company from "../models/Company.js";
import User from "../models/User.js";

export const clearAppCollections = async () => {
  const [
    messagesResult,
    conversationsResult,
    applicationsResult,
    userActionsResult,
    jobsResult,
    companiesResult,
    usersResult
  ] =
    await Promise.all([
      Message.deleteMany({}),
      Conversation.deleteMany({}),
      Application.deleteMany({}),
      UserAction.deleteMany({}),
      Job.deleteMany({}),
      Company.deleteMany({}),
      User.deleteMany({})
    ]);

  return [
    { collection: "messages", deleted: messagesResult.deletedCount || 0 },
    { collection: "conversations", deleted: conversationsResult.deletedCount || 0 },
    { collection: "applications", deleted: applicationsResult.deletedCount || 0 },
    { collection: "useractions", deleted: userActionsResult.deletedCount || 0 },
    { collection: "jobs", deleted: jobsResult.deletedCount || 0 },
    { collection: "companies", deleted: companiesResult.deletedCount || 0 },
    { collection: "users", deleted: usersResult.deletedCount || 0 }
  ];
};
