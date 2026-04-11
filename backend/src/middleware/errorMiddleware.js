export const notFound = (_req, _res, next) => {
  const error = new Error("Route not found");
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || (err.name === "MulterError" ? 400 : 500);

  res.status(statusCode).json({
    message:
      err.name === "MulterError" && err.code === "LIMIT_FILE_SIZE"
        ? "File size exceeds the allowed limit"
        : err.message || "Server error",
    code: err.code || undefined,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
};
