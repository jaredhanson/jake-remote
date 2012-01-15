/**
 * Module dependencies.
 */
var tty = require('tty')
  , functionpool = require('functionpool');


/**
 * `Terminal` constructor.
 *
 * A `Terminal` represents an interactive terminal the user is using.  As such,
 * it is the primary means of displaying output and prompting for input.  In
 * most regards, it behaves identically to Node's built in `console` instance.
 * However, because input and output from multiple remote hosts will be
 * multiplexed to a single `Terminal`, facilities are in place to ensure that
 * the display is updated sensibly.
 *
 * Multiple prompts can be issued simultaneously.  However, only one will be
 * active at any given moment.  Once the prior prompt is complete, the next one
 * will be displayed.  Additionally, any output that is written to the terminal
 * while a prompt is active will be buffered until all prompts are complete.
 *
 * @api private
 */
function Terminal() {
  this.stdin = process.stdin;
  this.stdout = process.stdout;
  this.stderr = process.stderr;
  
  this._outbuf = '';
  this._errbuf = '';
  this._prompting = false;
  
  
  var self = this;
  
  this._prompts = new functionpool.Pool({ size: 1 }, function(mode, msg, mask, done) {
    self._prompting = true;
    
    if (mode === 'normal') {
      // CREDIT: https://github.com/visionmedia/commander.js/blob/0.5.1/lib/commander.js
      //         Command.prototype.promptSingleLine
      
      self.stdout.write(msg);
      self.stdin.setEncoding('utf8');
      self.stdin.once('data', function(input) {
        done(null, input.trim());
      }).resume();
    } else if (mode === 'raw') {
      // CREDIT: https://github.com/visionmedia/commander.js/blob/0.5.1/lib/commander.js
      //         Command.prototype.password
      
      var buf = '';
      
      self.stdout.write(msg);
      self.stdin.resume();
      tty.setRawMode(true);
      self.stdin.on('keypress', function(c, key) {
        if (key && 'enter' == key.name) {
          console.log();
          self.stdin.removeAllListeners('keypress');
          tty.setRawMode(false);
          done(null, buf);
          return;
        }

        if (key && key.ctrl && 'c' == key.name) {
          //console.log('%s', buf);
          process.exit();
        }

        self.stdout.write(mask);
        buf += c;
      }).resume();
    }
  });
  this._prompts.on('idle', function() {
    self._prompting = false;
    if (self._outbuf.length) { 
      self.stdout.write(self._outbuf);
      self._outbuf = '';
    }
  });
}

Terminal.prototype.log =
Terminal.prototype.info = function(msg) {
  // TODO: Implement format support.
  if (this._prompting) {
    this._outbuf += (msg + '\n');
    return;
  }
  
  this.stdout.write(msg + '\n');
}

Terminal.prototype.prompt = function(msg, fn) {
  this._prompts.add('normal', msg, null, function(err, val) {
    fn(val);
  });
}

Terminal.prototype.password = function(msg, mask, fn) {
  if (typeof mask === 'function') {
    fn = mask;
    mask = '';
  }
  
  this._prompts.add('raw', msg, mask, function(err, val) {
    fn(val);
  });
}


module.exports = Terminal;