export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    // 400 = 'fail', 500 = 'error'
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    //We attach a stack property to this instance of the error, but make sure to exclude this class from the stack trace (as denoted by the second property).
    Error.captureStackTrace(this, this.constructor);
  }
}
