var util = require('util');

module.exports = function() {
  
  return function(command) {
    if (command.match(/git /)) {
      return sshKey;
    }
    return null;
  }
}


function sshKey(proc) {
  proc.stdout.on('data', function(chunk) {
    var match = chunk.match(/Enter passphrase for key '(\S+)': /);
    if (match) {
      return proc.emit('password', match[0], { keychain: 'ssh-key', realm: match[1] })
    }
  });
}
