var functionpool = require('functionpool')
  , util = require('util')
  , Context = require('./context');


function RemoteTask(name, hosts, action) {
  this._name = name;
  this._hosts = hosts;
  this._action = action;
  this.define();
}

RemoteTask.prototype.define = function() {
  var self = this;
  
  task(this._name, function() {
    var taskArgs = arguments;
    var results = {};
    var failed = false;
    
    // Allocate a function pool to perform the action on the remote hosts.
    // The pool serves as a mechanism to limit the number of simultaneous
    // connections that will be established.
    var pool = new functionpool.Pool({ size: 5 }, function(host, done) {
      function finished(err) {
        process.nextTick(function() { done(err); });
      };
      
      // Create a new context for this host, within which the action will be
      // invoked.
      var ctx = new Context(host);
      var args = Array.prototype.slice.call(taskArgs);
      args.push(finished);  // callback is the last argument
      self._action.apply(ctx, args);
    });
    pool.on('fail', function() {
      // When a remote action fails, any tasks remaining in the pool will be
      // cleared.  Some actions may be currently executing, so final reporting
      // will wait until they have completed and the pool is idle.
      pool.clearQueue();
      failed = true;
    });
    pool.on('idle', function() {
      report();
      
      if (failed) { return fail(new Error('Remote task failed: ' + self._name)); }
      return complete();
    });
    
    
    // queues work for `host` and collects results.
    function work(host) {
      results[host] = null;
      pool.task(host, function(err) {
        results[host] = err || true;
      });
    }
    
    // reports results.
    function report() {
      var done = self._hosts.filter(function(host) {
        var result = results[host];
        return (result === true);
      });
      var failed = self._hosts.filter(function(host) {
        var result = results[host];
        return (result !== true && result !== null);
      });
      var incomplete = self._hosts.filter(function(host) {
        var result = results[host];
        return (result === null);
      });
      
      console.info('Task %s: %d/%d complete. (%d done, %d failed)', self._name,
                                                                    (done.length + failed.length),
                                                                    self._hosts.length,
                                                                    done.length,
                                                                    failed.length);
    }
    
    console.info('Invoking %s task on %d hosts.', self._name, self._hosts.length);
    for (var i = 0, len = self._hosts.length; i < len; i++) {
      work(self._hosts[i]);
    }
  }, {async: true});
}

module.exports = RemoteTask;
