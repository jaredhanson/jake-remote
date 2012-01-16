/**
 * Module dependencies.
 */
var Terminal = require('./jake-remote/terminal')
  , Executor = require('./jake-remote/executor')
  , api = require('./jake-remote/api');


/**
 * Create global terminal for multiplexing remote terminals.
 */
global.terminal = new Terminal();

/**
 * Globalize top-level API functions.
 */
for (var method in api) {
  global[method] = api[method];
}
