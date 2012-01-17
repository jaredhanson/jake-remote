var vows = require('vows');
var assert = require('assert');
var util = require('util');
require ('./_setup');
var api = require('jake-remote/api');


vows.describe('API').addBatch({
  
  'exports': {
    'should export remoteTask function': function (x) {
      assert.isFunction(api.remoteTask);
    },
  },
  
  'remoteTask': {
    
    'initialized with name, options, and action': {
      topic: function() {
        api.remoteTask('task', { host: 'foo.example.com' }, function(done) {});
        return jake.Task['task'];
      },
      
      'should create Jake task' : function(err, task) {
        assert.instanceOf(task, jake.Task);
      },
      'should not have prerequisite tasks' : function(err, task) {
        assert.lengthOf(task.prereqs, 0);
      },
    },
    
    'initialized with name, single prereq, and action': {
      topic: function() {
        api.remoteTask('task', 'foo', function(done) {});
        return jake.Task['task'];
      },
      
      'should create Jake task' : function(err, task) {
        assert.instanceOf(task, jake.Task);
      },
      'should have prerequisite tasks' : function(err, task) {
        assert.lengthOf(task.prereqs, 1);
        assert.equal(task.prereqs[0], 'foo');
      },
    },
    
    'initialized with name, multiple prereqs, and action': {
      topic: function() {
        api.remoteTask('task', ['foo', 'bar'], function(done) {});
        return jake.Task['task'];
      },
      
      'should create Jake task' : function(err, task) {
        assert.instanceOf(task, jake.Task);
      },
      'should have prerequisite tasks' : function(err, task) {
        assert.lengthOf(task.prereqs, 2);
        assert.equal(task.prereqs[0], 'foo');
        assert.equal(task.prereqs[1], 'bar');
      },
    },
    
    'initialized with a single host in host options': {
      topic: function() {
        var self = this;
        var hosts = [];
        api.remoteTask('task', { host: '127.0.0.1' }, function(done) {
          hosts.push(this.host);
          done();
        });
        
        var task = jake.Task['task'];
        task.once('complete', function() {
          self.callback(null, task, hosts);
        });
        task.invoke();
      },
      
      'should be invoked on correct hosts' : function(err, task, hosts) {
        assert.lengthOf(hosts, 1);
        assert.equal(hosts[0], '127.0.0.1');
      },
    },
    
    'initialized with a single host in hosts options': {
      topic: function() {
        var self = this;
        var hosts = [];
        api.remoteTask('task', { hosts: 'localhost' }, function(done) {
          hosts.push(this.host);
          done();
        });
        
        var task = jake.Task['task'];
        task.once('complete', function() {
          self.callback(null, task, hosts);
        });
        task.invoke();
      },
      
      'should be invoked on correct hosts' : function(err, task, hosts) {
        assert.lengthOf(hosts, 1);
        assert.equal(hosts[0], 'localhost');
      },
    },
    
    'initialized with a multiple host in hosts options': {
      topic: function() {
        var self = this;
        var hosts = [];
        api.remoteTask('task', { hosts: ['foo.example.com', 'bar.example.com'] }, function(done) {
          hosts.push(this.host);
          done();
        });
        
        var task = jake.Task['task'];
        task.once('complete', function() {
          self.callback(null, task, hosts);
        });
        task.invoke();
      },
      
      'should be invoked on correct hosts' : function(err, task, hosts) {
        assert.lengthOf(hosts, 2);
        assert.equal(hosts[0], 'foo.example.com');
        assert.equal(hosts[1], 'bar.example.com');
      },
    },
  
  },

}).export(module);
