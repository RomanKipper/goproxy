const path = require('path');
const fs = require('fs-extra');
const Koa = require('koa');
const Router = require('koa-router');
const logger = require('koa-logger');
const {
  loadModule,
  getModulePath,
  getVersions,
  checkoutVersion,
  getVersionCommit,
} = require('./lib/git');
const { createZipStream } = require('./lib/zip');
const config = require('./config.json');

const app = new Koa();
const router = new Router({
  prefix: `/${config.moduleNamespace}`,
});

router.get('/:module/@v/list', async (ctx) => {
  const { module } = ctx.params;

  console.log(`list versions -- module: ${module}`);

  const repository = await loadModule(module);
  const versions = await getVersions(repository);
  await repository.cleanup();

  ctx.body = versions.join('\n');
});

router.get('/:module/@v/:version.info', async (ctx) => {
  const { module, version } = ctx.params;

  console.log(`get info -- module: ${module}, version: ${version}`);

  const repository = await loadModule(module);
  const commit = await getVersionCommit(repository, version);
  const info = {
    Version: version,
    Time: commit.date(),
  };
  await repository.cleanup();

  ctx.body = info;
});

router.get('/:module/@v/:version.mod', async (ctx) => {
  const { module, version } = ctx.params;

  console.log(`get go.mod -- module: ${module}, version: ${version}`);

  const repository = await loadModule(module);
  await checkoutVersion(repository, version);
  await repository.cleanup();

  try {
    const goModPath = path.join(getModulePath(module), 'go.mod');
    await fs.access(goModPath); // go.mod может и не быть
    ctx.body = fs.createReadStream(goModPath);
  } catch (error) {
    ctx.body = `module ${config.moduleNamespace}/${module}\n`;
  }
});

router.get('/:module/@v/:version.zip', async (ctx) => {
  const { module, version } = ctx.params;

  console.log(`get zip -- module: ${module}, version: ${version}`);

  const repository = await loadModule(module);
  await checkoutVersion(repository, version);
  await repository.cleanup();

  ctx.body = createZipStream({
    sourcePath: getModulePath(module),
    pathPrefix: `/${config.moduleNamespace}/${module}@${version}`,
  });
});

app.use(logger());
app.use(router.routes());

app.listen(config.port, () => {
  console.log(`goproxy is listening on port ${config.port}\n`)
});
