/**
 * Module dependencies.
 */
var spawn = require('./remote_process').spawn
  , ProcessError = require('./errors/processerror');


/**
 * `Executor` constructor.
 *
 * An `Exector` is responsible for executing commands on a remote host.  When a
 * remote action function is invoked for a host, it is done in the context of an
 * `Executor`.  Each `Executor` is specific to a single host, ensuring that any
 * operations are isolated to that host alone.
 *
 * System Administration Tips:
 *
 *    # Invalidate existing sudo permissions
 *    $ sudo -k
 *
 *    # List identities represented by ssh-agent
 *    $ ssh-add -l
 *
 *    # Remove all identities from ssh-agent
 *    $ ssh-add -D
 *
 * @api private
 */
function Executor(host) {
  this.host = host;
}


/**
 * Register a prompt detector.
 *
 * @param {Function} fn
 * @api public
 */
Executor.prompts = function(fn) {
  _prompts.push(fn);
}
var _prompts = [];

Executor.prompts(require('./prompts/sudo')());
Executor.prompts(require('./prompts/git')());


/**
 * Execute a remote command.
 *
 * The callback gets the arguments `(err, stdout, stderr)`. On success, `err`
 * will be null. On error, `err` will be an instance of `Error` and `err.code`
 * will be the exit code of the remote command, and `err.signal` will be set to
 * the signal that terminated the process.  Any output from the command will be
 * buffered and available in `stdout` and `stderr`.
 *
 * Options:
 *   - `silencePrompt`  disable prompt from being displayed on terminal, defaults to _false_
 *   - `silenceOutput`  disable command output from being displayed on terminal, defaults to _false_
 *
 * Examples:
 *
 *     this.exec('make install', function(err, stdout, stderr) {
 *       // ...
 *     });
 *
 * @param {String} command
 * @param {Object} options
 * @param {Function} callback
 * @api public
 */
Executor.prototype.run = 
Executor.prototype.exec = function(command, options, callback) {
  this._exec(command, options, callback);
}

/**
 * Execute a remote command as another user.
 *
 * This function behaves the same as `exec`, with the exception that the command
 * is executed as the super user.
 *
 *     this.sudo('apt-get install nodejs', function(err, stdout, stderr) {
 *       // ...
 *     });
 *
 * @param {String} command
 * @param {Object} options
 * @param {Function} callback
 * @api public
 */
Executor.prototype.sudo = function(command, options, callback) {
  // TODO: Implement an option to specify which user/group to run as.
  this._exec('sudo ' + command, options, callback);
}

/**
 * Internal execute implementation.
 *
 * @api private
 */
Executor.prototype._exec = function(command, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  var silencePrompt = (options.silencePrompt !== undefined) ? options.silencePrompt : false;
  var silenceOutput = (options.silenceOutput !== undefined) ? options.silenceOutput : false;
  var silenceStatus = (options.silenceStatus !== undefined) ? options.silenceStatus : true;
  
  var self = this;
  
  if (!silencePrompt) { terminal.info('['+ this.host  +']' + ' > ' + command); }
  
  // Commands may issue prompts that require input (for example, sudo will
  // require a password).  A set of scanning functions will monitor the remote
  // process' output stream in order to detect these prompts.
  var scanners = [];
  for (var i = 0, len = _prompts.length; i < len; i++) {
    var fns = _prompts[i](command);
    if (fns) { scanners = scanners.concat(fns); }
  }
  if (scanners.length) { options.forceTTY = true; }
  
  // spawn a remote shell to execute the command
  var proc = spawn(this.host, command, options);
  var outbuf = '';
  var errbuf = '';
  
  // initialize scanners for prompt detection
  for (var i = 0, len = scanners.length; i < len; i++) {
    var scanner = scanners[i];
    scanner(proc);
  }
  
  
  // display output and issue prompts to the terminal
  proc.on('line', function(line) {
    if (!silenceOutput) { terminal.info('['+ self.host  +'] ' + line); }
  });

  proc.on('password', function(prompt) {
    terminal.password('[' + self.host + '] ' + prompt, function(password) {
      proc.stdin.write(password + '\n');
    });
  });

  // buffer output streams
  proc.stdout.on('data', function (data) {
    outbuf += data;
  });

  proc.stderr.on('data', function (data) {
    errbuf += data;
  });
  
  proc.on('exit', function (code, signal) {
    if (!silenceStatus) { terminal.info('['+ self.host  +']' + ' => ' + code); }
    
    var successCode = (options.successCode === undefined) ? 0 : options.successCode;
    if (code !== successCode) {
      return callback(new ProcessError(code, signal), outbuf, errbuf);
    }
    return callback(null, outbuf, errbuf);
  });
}


/**
 * Expose `Executor`.
 */
module.exports = Executor;
