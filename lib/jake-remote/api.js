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
 * A remote task is a task that is designed to execute commands on a set of
 * remote hosts.
 *
 *     remoteTask(name, [prereqs], {options}, action, [async]);
 *
 * `name` is the name of the task.  `prereqs` is an optional list of
 * prerequisite tasks to perform first.  `options` is a list of remote options,
 * including the hosts to perform the task on.  `action` is the remote action
 * function, defining the action to take on each host.
 *
 * Note that while the function signature is similar to that of a normal, local
 * task, it differs in some crucial ways that are important to understand.
 *
 * First, all remote tasks are asynchronous by definition.  Second, the action
 * function will be invoked multiple times, once for each host specified.
 *
 * A task is considered complete once it has been completed on _all_ hosts.
 * Jake-Remote manages the parallel execution of these actions, and will
 * automatically `complete()` the task when it has been performed on all hosts.
 * Therefore, it is important that `complete()` not be called directly within
 * the task itself.
 *
 * Remote action functions accept a final `done` callback parameter.  This
 * callback must be called when the action is complete on the host in question.
 * Include an `err` as the first argument to `done` if the action failed.
 *
 * For consistency with Jake semantics, a final `{async: true}` argument can be
 * passed.  However, because all remote task are asynchronous, this argument has
 * no effect and is for aesthetics only.
 *
 * Examples:
 *
 *     remoteTask('update', { hosts: [ 'foo.example.com' ] }, function(done) {
 *       this.run('git pull', function(err) {
 *         if (err) { return done(err); }
 *         done();
 *       })
 *     });
 *
 *     remoteTask('install', ['download, 'build'], { hosts: [ 'foo.example.com' ] }, function(done) {
 *       ...
 *     })
 *
 *     remoteTask('update', { hosts: [ 'foo.example.com' ] }, function(done) {
 *       ...
 *     }, {async: true});
 *
 * @param {String} name      name of task
 * @param {Array} prereqs    list of prerequisite tasks
 * @param {Object} options   options
 * @param {Function} action  remtote action function, invoked once per host
 * @param {Object} async     ignored (for consistency with Jake)
 * @api public
 */
api.remoteTask = function(name, prereqs, options, action, async) {
  if (typeof prereqs === 'object' && !Array.isArray(prereqs)) {
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
  if (options.host) { hosts = hosts.concat(options.host); }
  if (options.hosts) { hosts = hosts.concat(options.hosts); }
  
  var rt = new RemoteTask(name, hosts, action);
  jake.Task[fq(name)].prereqs = [].concat(prereqs);
}


/**
 * Return fully qualified name for task `name` in current namespace.
 *
 * @param {String} name
 * @return {String}
 * @api private
 */
function fq(name) {
  var qname = name;
  var ns = jake.currentNamespace;
  
  while (ns) {
    qname = ns.name == 'default' ? qname : (ns.name + ':' + qname);
    ns = ns.parentNamespace;
  }
  return qname;
}
