const path = require('path');
const fs = require('fs-extra');
const Git = require('nodegit');
const { getSSHPublicKey, getSSHPrivateKey } = require('./ssh');
const config = require('../config.json');

const sshPublicKey = getSSHPublicKey();
const sshPrivateKey = getSSHPrivateKey();

const parseVersion = (version) => {
  const match = version.match(/^v0\.0\.0-(\d+)-([a-h0-9]+)$/);
  if (match) {
    const [, timestamp, commit] = match;
    return {
      version: 'v0.0.0',
      timestamp,
      commit,
    };
  }
  return {
    version,
  };
};

const getModulePath = exports.getModulePath = module => path.join(__dirname, '../repos', module);

/**
 * @param {string} module
 * @returns {Promise<Git.Repository>}
 */
exports.loadModule = async (module) => {
  const modulePath = getModulePath(module);

  // Просто, но эффективно
  await fs.emptyDir(modulePath);

  const cloneOptions = {
    fetchOpts: {
      callbacks: {
        certificateCheck() { return 0; },
        credentials(url, userName) {
          return Git.Cred.sshKeyMemoryNew(
            userName,
            sshPublicKey,
            sshPrivateKey,
            '',
          );
        },
      },
    },
  };

  return await Git.Clone(`${config.repoBaseUrl}/${module}.git`, modulePath, cloneOptions);
};

/**
 * @param {Git.Repository} repository
 * @returns {Promise<string[]>}
 */
exports.getVersions = async (repository) => {
  return Git.Tag.listMatch('v*', repository);
};

/**
 * @param {Git.Repository} repository
 * @param {string} version
 * @returns {Promise<Git.Commit>}
 */
exports.getVersionCommit = async (repository, version) => {
  const parsedVersion = parseVersion(version);

  if (parsedVersion.version !== 'v0.0.0') {
    const ref = await Git.Reference.dwim(repository, version);
    const object = await ref.peel(Git.Object.TYPE.COMMIT);
    return Git.Commit.lookup(repository, object.id());
  } else {
    const object = await Git.Revparse.single(repository, parsedVersion.commit);
    return repository.getCommit(object.id());
  }
};

/**
 * @param {Git.Repository} repository
 * @param {string} version
 * @returns {Promise}
 */
exports.checkoutVersion = async (repository, version) => {
  const parsedVersion = parseVersion(version);

  if (parsedVersion.version !== 'v0.0.0') {
    const ref = await Git.Reference.dwim(repository, version);
    const object = await ref.peel(Git.Object.TYPE.COMMIT);
    await Git.Checkout.tree(repository, object);
    repository.setHeadDetached(object);
  } else {
    const object = await Git.Revparse.single(repository, parsedVersion.commit);
    await Git.Checkout.tree(repository, object);
    repository.setHeadDetached(object);
  }
};
