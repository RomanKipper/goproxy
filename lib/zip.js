const archiver = require('archiver');

exports.createZipStream = ({ sourcePath, pathPrefix }) => {
  const archive = archiver('zip', {
    // Работаем локально, сжатие нам ни к чему
    // С другой стороны, официальная прокся использует сжатие, возможно поэтому хэш-суммы разнятся
    zlib: { level: 0 },
  });

  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn('archiver couldn\'t find a file');
    } else {
      throw err;
    }
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.glob(
    '**/!(.git)',
    { cwd: sourcePath }, // glob options
    { prefix: pathPrefix },
  );

  archive.finalize();

  return archive;
};
