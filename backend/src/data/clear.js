import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { clearAppCollections } from "./resetDatabase.js";

dotenv.config();

const clearDatabase = async () => {
  await connectDB();

  const results = await clearAppCollections();

  console.log("Database cleared successfully");
  console.table(results);

  await mongoose.connection.close();
};

clearDatabase().catch(async (error) => {
  console.error("Database clear failed:", error);
  await mongoose.connection.close();
  process.exit(1);
});

