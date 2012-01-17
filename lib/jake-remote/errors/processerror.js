/**
 * `ProcessError` error.
 *
 * @api private
 */
function ProcessError(code, signal) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'ProcessError';
  this.message = 'Process failed with code: ' + code;
  this.code = code;
  this.signal = signal;
};

/**
 * Inherit from `Error`.
 */
ProcessError.prototype.__proto__ = Error.prototype;


/**
 * Expose `ProcessError`.
 */
module.exports = ProcessError;
