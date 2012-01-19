/**
 * `Keychain` constructor.
 *
 * A `Keychain` holds a set of credentials used to authenticate with a
 * particular subsystem.  For example, one keychain would hold passwords for
 * authenticating as a system user, while another would hold passphrases that
 * protect SSH keys.
 *
 * @api public
 */
function Keychain() {
  this._keys = {};
}

/**
 * Get credential for `realm`.
 *
 * @param {String} realm
 * @return {String}
 * @api public
 */
Keychain.prototype.get = function(realm) {
  return this._keys[realm];
}

/**
 * Set `credential` for `realm`.
 *
 * @param {String} realm
 * @param {String} credential
 * @api public
 */
Keychain.prototype.set = function(realm, credential) {
  this._keys[realm] = credential;
}


/**
 * Expose `Keychain`.
 */
module.exports = Keychain;
