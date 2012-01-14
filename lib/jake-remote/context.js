/**
 * Module dependencies.
 */
var spawn = require('./remote_process').spawn
  , ProcessError = require('./errors/processerror');


/**
 * `Context` constructor.
 *
 * `Context` defines a host-specific context in which a remote task will be
 * executed.  The `action` function of a remote task will be invoked once for
 * each host on which the task needs to be performed.  Each invocation will have
 * a unique, host-specific context, ensuring that any operations performed are
 * isolated to that host.
 *
 * @api private
 */
function Context(host) {
  this.host = host;
}

/**
 * Execute a remote command.
 *
 * @api private
 */
Context.prototype.run = 
Context.prototype.exec = function(command, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  
  console.info('['+ this.host  +']' + ' exec: ' + command);
  
  var self = this;
  var cmd = spawn(this.host, command);
  var outbuf = '';
  var errbuf = '';

  cmd.stdout.on('data', function (data) {
    //console.log('stdout: ' + data);
    outbuf += data;
  });

  cmd.stderr.on('data', function (data) {
    //console.log('stderr: ' + data);
    errbuf += data;
  });

  cmd.on('exit', function (code, signal) {
    var msg = '['+ self.host  +']' + ' exit: ' + command + ' (';
    msg += (code !== null) ? 'code: ' + code : '';
    msg += (code !== null && code !== null) ? ', ' : '';
    msg += (code !== null) ? 'signal: ' + signal : '';
    msg += ')';
    console.info(msg);
    
    var successCode = (options.successCode === undefined) ? 0 : options.successCode;
    if (code !== successCode) {
      return callback(new ProcessError(code, signal), outbuf, errbuf);
    }
    return callback(null, outbuf, errbuf);
  });
}


/**
 * Expose `Context`.
 */
module.exports = Context;
