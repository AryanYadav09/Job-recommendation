import { validationResult } from "express-validator";

export const handleValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array().map((e) => e.msg).join(", "));
    error.statusCode = 400;
    throw error;
  }
};
