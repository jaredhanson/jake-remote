var util = require('util');

module.exports = function() {
  
  return function(command) {
    if (command.match(/sudo /)) {
      return scan;
    }
    return null;
  }
}


function sudo(proc) {
  proc.stdout.on('data', function(chunk) {
    var match = chunk.match(/\[sudo\] password for (\S+): /);
    if (match) {
      return proc.emit('password', match[0], { keychain: 'system', realm: match[1] })
    }
  });
}
