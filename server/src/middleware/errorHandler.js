export class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Global 4-parameter error handler: every error leaves the API in the same JSON shape
//   { success: false, message: string, errors?: { field: message } }
export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors;

  if (err.name === 'ValidationError') {
    // Mongoose schema validation
    status = 400;
    message = 'Validation failed';
    errors = Object.fromEntries(Object.entries(err.errors).map(([field, e]) => [field, e.message]));
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
    errors = { [err.path]: `Invalid value for ${err.path}` };
  } else if (err.code === 11000) {
    // MongoDB duplicate key (unique index)
    status = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    const label = { rollNo: 'roll number', code: 'course code' }[field] || field;
    message = `A record with this ${label} already exists`;
    errors = { [field]: `This ${label} is already in use` };
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
    errors = undefined;
  }

  if (status >= 500) {
    console.error(err);
    message = 'Internal server error';
    errors = undefined;
  }
  res.status(status).json({ success: false, message, ...(errors && { errors }) });
}
