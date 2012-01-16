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
  
  var self = this;
  var outbuf = '';
  var errbuf = '';
  
  this.stdout.on('data', function(chunk) {
    outbuf = outbuf.concat(chunk);
    var idx = outbuf.indexOf('\n');
    while (idx !== -1) {
      var line = outbuf.slice(0, idx);
      self.emit('line', line);
      outbuf = outbuf.slice(idx + 1);
      idx = outbuf.indexOf('\n');
    }
  });
  
  this.stderr.on('data', function(chunk) {
    errbuf = errbuf.concat(chunk);
    var idx = errbuf.indexOf('\n');
    while (idx !== -1) {
      var line = errbuf.slice(0, idx);
      self.emit('line', line);
      errbuf = errbuf.slice(idx + 1);
      idx = errbuf.indexOf('\n');
    }
  });
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
  proc.stdin.setEncoding('utf8');
  proc.stdout.setEncoding('utf8');
  proc.stderr.setEncoding('utf8');
  
  return new RemoteProcess(proc);
}


/**
 * Expose `RemoteProcess`.
 */
module.exports = RemoteProcess;
