var util = require('util');

module.exports = function sudoPrompt() {
  
  return function(command) {
    if (command.match(/sudo /)) {
      return scan;
    }
    return null;
  }
}


function scan(proc) {
  proc.stdout.on('data', function(chunk) {
    var match = chunk.match(/\[sudo\] password for (\S+): /);
    if (match) {
      return proc.emit('password', match[0], { type: 'sudo' })
    }
  });
}
