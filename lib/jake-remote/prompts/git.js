var util = require('util');

module.exports = function() {
  
  return function(command) {
    if (command.match(/git /)) {
      return [sshHost, sshKey];
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

function sshHost(proc) {
  proc.stdout.on('data', function(chunk) {
    // TODO: Buffer multiple lines to extract host and fingerprint
    
    var match = chunk.match(/Are you sure you want to continue connecting \(yes\/no\)\? /);
    if (match) {
      return proc.emit('prompt', match[0]);
    }
  });
}
