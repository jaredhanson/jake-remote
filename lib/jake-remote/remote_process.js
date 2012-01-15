/**
 * Module dependencies.
 */
var spawn = require('child_process').spawn;

/**
 * Expose remote_process.
 */
var remote_process = module.exports = {};


/**
 * Launches a new remote process on `host` with given `command`.
 *
 * @api public
 */
remote_process.spawn = function(host, command, options) {
  options = options || {};
  
  // TODO: Implement support for additional SSH options.
  var args = [];
  if (options.forceTTY) { args.push('-tt'); }
  
  return spawn('ssh', args.concat([host, command]));
}
