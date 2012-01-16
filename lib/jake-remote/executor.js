/**
 * Module dependencies.
 */
var spawn = require('./remote_process').spawn
  , ProcessError = require('./errors/processerror');


/**
 * `Executor` constructor.
 *
 * `Executor` defines a host-specific context in which a remote task will be
 * executed.  The `action` function of a remote task will be invoked once for
 * each host on which the task needs to be performed.  Each invocation will have
 * a unique, host-specific context, ensuring that any operations performed are
 * isolated to that host.
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


var _prompts = [];

Executor.prompts = function(fn) {
  _prompts.push(fn);
}

Executor.prompts(require('./prompts/sudo')());


/**
 * Execute a remote command.
 *
 * @api private
 */
Executor.prototype.run = 
Executor.prototype.exec = function(command, options, callback) {
  terminal.info('['+ this.host  +']' + ' exec: ' + command);
  this._exec(command, options, callback);
}

Executor.prototype.sudo = function(command, options, callback) {
  terminal.info('['+ this.host  +']' + ' sudo: ' + command);
  this._exec('sudo ' + command, options, callback);
}

Executor.prototype._exec = function(command, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  
  var scanners = [];
  for (var i = 0, len = _prompts.length; i < len; i++) {
    var fns = _prompts[i](command);
    if (fns) { scanners = scanners.concat(fns); }
  }
  if (scanners.length) { options.forceTTY = true; }
  
  var self = this;
  var proc = spawn(this.host, command, options);
  var outbuf = '';
  var errbuf = '';
  
  proc.on('line', function(line) {
    terminal.log('LINE: ' + line);
  })
  
  proc.on('password', function(prompt) {
    terminal.password('[' + self.host + '] ' + prompt, function(password) {
      proc.stdin.write(password + '\n');
    });
  });

  proc.stdout.on('data', function (data) {
    outbuf += data;
  });

  proc.stderr.on('data', function (data) {
    errbuf += data;
  });
  
  for (var i = 0, len = scanners.length; i < len; i++) {
    var scanner = scanners[i];
    scanner(proc);
  }
  
  proc.on('exit', function (code, signal) {
    var msg = '['+ self.host  +']' + ' exit: ' + command + ' (';
    msg += (code !== null) ? 'code: ' + code : '';
    msg += (code !== null && code !== null) ? ', ' : '';
    msg += (code !== null) ? 'signal: ' + signal : '';
    msg += ')';
    terminal.info(msg);
    
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
