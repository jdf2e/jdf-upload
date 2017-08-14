'use strict';

const uploader = require('./src/baseUploader');
const path = require('path');
const logger = require('jdf-log');

const taskStart = () => {
  logger.profile('upload');
};

const taskEnd = taskStart;

module.exports = function(dir, options, jdf) {
  if (options.logLevel) {
    logger.level(options.logLevel);
  }

  const type = jdf.config.upload.type || options.type;

  // 如果输入的上传类型不对就退出
  if (['ftp', 'scp', 'http'].indexOf(type) === -1) {
    logger.error(`unknown upload type '${type}'`);
    return;
  }

  // 如果没有配置过上传的参数，也退出
  for (const k of ['host', 'user', 'password']) { // eslint-disable-line
    if (!jdf.config[k] && !jdf.config.upload[k]) {
      logger.error(`config.json value of "${k}" error`);
      return;
    }
    // 如果现在参数还在根节点下，就给出警告
    if (!jdf.config.upload[k]) {
      logger.warn(`the key '${k}' in the root node of config.json should be moved to the 'upload' node`);
    } else {
      jdf.config[k] = jdf.config.upload[k];
    }
  }

  const uploadSource = path.resolve(process.cwd(), jdf.config.outputDirName); // 编译后文件的根目录
  let targetServerPath = jdf.config.serverDir; // 远程接收文件的根路径，具体到某个域名对应的文件夹，根据服务器的配置来定
  const projectPath = jdf.config.projectPath.slice(-1) === '/' ? jdf.config.projectPath : `${jdf.config.projectPath}/`; // 项目目录带版本号信息

  if (options.preview && jdf.config.previewServerDir) {
    targetServerPath = jdf.config.previewServerDir;
  }

  const engine = uploader.create(type, {
    host: jdf.config.host,
    user: jdf.config.user,
    password: jdf.config.password,
    port: jdf.config.port || jdf.config.upload.port || (type === 'http' ? 3000 : (type === 'ftp' ? 21 : 22)),// eslint-disable-line
    rootPrefix: jdf.config.upload.rootPrefix, // scp和http方式上传的时候会用到来拼接远程的地址
    root: uploadSource,
    target: targetServerPath,
    projectPath: projectPath,
  });
  // Promise.resolve().then(taskStart).then(() => engine.startUpload(dir)).then(taskEnd);return;
  return jdf.output(dir, options)
    .then(taskStart)
    .then(() => engine.startUpload(dir)).then(taskEnd);
}
