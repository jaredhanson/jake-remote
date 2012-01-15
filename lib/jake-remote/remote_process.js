/**
 * Module dependencies.
 */
var util = require('util')
  , EventEmitter = require('events').EventEmitter
  , spawn = require('child_process').spawn;


function RemoteProcess(proc) {
  EventEmitter.call(this);
  
  this.stdin = proc.stdin;
  this.stdout = proc.stdout;
  this.stderr = proc.stderr;
  proc.on('exit', this.emit.bind(this, 'exit'));
}

/**
 * Inherit from `EventEmitter`.
 */
util.inherits(RemoteProcess, EventEmitter);


/**
 * Launches a new remote process on `host` with given `command`.
 *
 * @api public
 */
RemoteProcess.spawn = function(host, command, options) {
  options = options || {};
  
  // TODO: Implement support for additional SSH options.
  var args = [];
  if (options.forceTTY) { args.push('-tt'); }
  
  var proc = spawn('ssh', args.concat([host, command]));
  return new RemoteProcess(proc);
}


/**
 * Expose `RemoteProcess`.
 */
module.exports = RemoteProcess;
