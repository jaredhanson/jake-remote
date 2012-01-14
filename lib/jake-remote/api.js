/**
 * Module dependencies.
 */
var util = require('util')
  , spawn = require('child_process').spawn
  , RemoteTask = require('./remotetask');

/**
 * Expose API.
 */
var api = module.exports = {};


/**
 * Define a remote task.
 *
 * @api public
 */
api.remoteTask = function(name, prereqs, options, action, async) {
  if (typeof prereqs === 'object') {
    // interface: name, options, action
    async = action;
    action = options
    options = prereqs;
    prereqs = [];
  }
  if (typeof options === 'function') {
    // interface: name, prereqs, action
    action = options;
    options = {};
  }
  
  var hosts = [];
  if (options.hosts) { hosts = hosts.concat(options.hosts); }
  
  var rt = new RemoteTask(name, hosts, action);
  
  // TODO: Set up prereqs:
  // jake.Task['name'].prereqs = ...;
}
