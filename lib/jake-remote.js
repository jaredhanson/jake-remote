/**
 * Module dependencies.
 */
var api = require('./jake-remote/api');

/**
 * Globalize top-level API functions.
 */
for (var method in api) {
  global[method] = api[method];
}
