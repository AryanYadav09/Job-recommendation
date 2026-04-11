import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localUploadsRootDir = path.resolve(__dirname, "../../uploads");
const serverlessUploadsRootDir = path.join(os.tmpdir(), "jobpulse-uploads");

export const uploadsRootDir =
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? serverlessUploadsRootDir
    : localUploadsRootDir;

export const ensureDirectory = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
};
