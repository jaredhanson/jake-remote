/**
 * Module dependencies.
 */
var tty = require('tty')
  , functionpool = require('functionpool')
  , Keychain = require('./keychain');


/**
 * `Terminal` constructor.
 *
 * A `Terminal` represents an interactive terminal being used by the operator.
 * As such, it is the primary means of displaying output and prompting for
 * input.  In most regards, it behaves identically to Node's built in `console`
 * instance.  However, because input and output from multiple remote hosts will
 * be multiplexed to a single terminal, facilities are in place to ensure that
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
  
  this.stdin.pause();
  this._outbuf = '';
  this._errbuf = '';
  this._prompting = false;
  
  this._keychains = {};
  
  
  var self = this;
  
  this._prompts = new functionpool.Pool({ size: 1 }, function(mode, msg, mask, done) {
    self._prompting = true;
    
    if (mode === 'normal') {
      // CREDIT: https://github.com/visionmedia/commander.js/blob/0.5.1/lib/commander.js
      //         Command.prototype.promptSingleLine
      
      self.stdout.write(msg);
      self.stdin.setEncoding('utf8');
      self.stdin.once('data', function(input) {
        self.stdin.pause();
        done(null, input.trim());
      }).resume();
    } else if (mode === 'password') {
      // CREDIT: https://github.com/visionmedia/commander.js/blob/0.5.1/lib/commander.js
      //         Command.prototype.password
      
      var buf = '';
      
      self.stdout.write(msg);
      tty.setRawMode(true);
      self.stdin.on('keypress', function(c, key) {
        if (key && 'enter' == key.name) {
          console.log();
          self.stdin.removeAllListeners('keypress');
          tty.setRawMode(false);
          self.stdin.pause();
          done(null, buf);
          return;
        }

        if (key && key.ctrl && 'c' == key.name) {
          //console.log('%s', buf);
          console.log();
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

/**
 * Prints to `stdout` with newline.
 *
 * If a prompt is being displayed, `msg` will be buffered and written after the
 * prompt is complete.
 *
 * @param {String} msg
 * @api protected
 */
Terminal.prototype.log =
Terminal.prototype.info = function(msg) {
  // TODO: Implement format support.
  if (this._prompting) {
    this._outbuf += (msg + '\n');
    return;
  }
  
  this.stdout.write(msg + '\n');
}

/**
 * Prompt `msg` and callback `fn(val)`.
 *
 * @param {String} msg
 * @param {Function} fn
 * @api protected
 */
Terminal.prototype.prompt = function(msg, fn) {
  this._prompts.add('normal', msg, null, function(err, val) {
    fn(val);
  });
}

/**
 * Prompt for password with `msg`, `mask` char and callback `fn(val)`.
 *
 * The mask string defaults to '', so no output is written while typing. You may
 * want to use "*" etc.
 *
 * Examples:
 *
 *     program.password('Password: ', function(pass){
 *       console.log('got "%s"', pass);
 *       process.stdin.destroy();
 *     });
 *
 *     program.password('Password: ', '*', function(pass){
 *       console.log('got "%s"', pass);
 *       process.stdin.destroy();
 *     });
 *
 * @param {String} msg
 * @param {String} mask
 * @param {Function} fn
 * @api protected
 */
Terminal.prototype.password = function(msg, mask, fn) {
  if (typeof mask === 'function') {
    fn = mask;
    mask = '';
  }
  
  this._prompts.add('password', msg, mask, function(err, val) {
    fn(val);
  });
}

/**
 * Register `keychain` with given `kind`, or return `kind`'s keychain. 
 *
 * @param {String} kind
 * @param {Keychain} keychain
 * @return {Keychain|Terminal} for chaining, or the keychain
 * @api public
 */
Terminal.prototype.keychain = function(kind, keychain) {
  if (keychain) {
    this._keychains[kind] = keychain;
    return this;
  }
  var kc = this._keychains[kind];
  if (!kc) {
    // lazily create keychain on first use
    kc = new Keychain();
    this._keychains[kind] = kc;
  }
  return kc;
}


/**
 * Expose `Terminal`.
 */
module.exports = Terminal;
