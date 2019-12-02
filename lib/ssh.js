const path = require('path');
const fs = require('fs-extra');
const config = require('../config.json');

const getSSHFilePath = (filename) => {
  if (config.sshPath) {
    return path.join(config.sshPath, filename);
  }
  if (process.platform === 'win32') {
    return path.join(process.env.USERPROFILE, '.ssh', filename);
  }
  return path.join('~/.ssh', filename);
};

exports.getSSHPublicKey = () => fs.readFileSync(getSSHFilePath('id_rsa.pub'), 'utf8');

exports.getSSHPrivateKey = () => fs.readFileSync(getSSHFilePath('id_rsa'), 'utf8');
