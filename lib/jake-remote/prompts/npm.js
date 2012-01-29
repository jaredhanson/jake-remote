var util = require('util');

module.exports = function() {
  // Useful for npm install, when dependencies exist to private repositories.
  
  return function(command) {
    if (command.match(/npm /)) {
      return sshKey;
    }
    return null;
  }
}


function sshKey(proc) {
  proc.stdout.on('data', function(chunk) {
    var match = chunk.match(/Enter passphrase for key '(\S+)': /);
    if (match) {
      return proc.emit('password', match[0], { kind: 'ssh-key', realm: match[1] })
    }
  });
}
