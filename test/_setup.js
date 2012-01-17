var jake = require(process.env['JAKE_MODULE'] + '/lib/jake');
var api = require(process.env['JAKE_MODULE'] + '/lib/api');

global.jake = jake;

for (var p in api) {
  global[p] = api[p];
}
