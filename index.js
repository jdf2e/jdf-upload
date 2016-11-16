'use strict';

const Uploader = require('./baseUploader');
const path = require('path');

module.exports = function (dir, options, jdf) {
  let type = options.type || jdf.upload.type;

  // 如果输入的上传类型不对就退出
  if (['ftp', 'scp', 'http'].indexOf(type) === -1) {
    console.log(`jdf error: unknown upload type '${type}'`);
    return;
  }

  // 如果没有配置过上传的参数，也退出
  for (let k of ['host', 'user', 'password']) {
    if (jdf.config[k] == JSON.parse(jdf.config.configJsonFileContent)[k] || (!jdf.config[k] && !jdf.config.upload[k])) {
      console.log(`jdf error: config.json value of "${k}" error`);
      return;
    }
    // 如果现在参数还在根节点下，就给出警告
    if (!jdf.config.upload[k]) {
      console.warn(`jdf warn: the key '${k}' in the root node of config.json should be moved to the 'upload' node`);
    }
    else {
      jdf.config[k] = jdf.config.upload[k];
    }
  }

  const uploadSource = path.resolve(process.cwd(), jdf.config.outputDirName); // 编译后文件的根目录
  let targetServerPath = jdf.config.serverDir; // 远程接收文件的根路径，具体到某个域名对应的文件夹，根据服务器的配置来定
  const projectPath = jdf.config.projectPath.slice(-1) == '/' ? jdf.config.projectPath : jdf.config.projectPath + '/'; // 项目目录带版本号信息

  if (options.preview && jdf.config.previewServerDir) {
    targetServerPath = jdf.config.previewServerDir;
  } else if (options.nc && jdf.config.newcdn) {
    jdf.config.cdn = jdf.config.newcdn;
  } else if (options.nh && jdf.config.newcdn) {
    // 内链link src替换
    jdf.config.cdnDefalut = jdf.config.cdn;
    jdf.config.cdn = jdf.config.newcdn;
    targetServerPath = jdf.config.previewServerDir;
  } else if (options.list && jdf.config.uploadList) {
    // 根据config.json配置上传 todo 到底是根据用户命令行的list还是根据config.json的list呢
    options.list = jdf.config.uploadList;
  }

  const engine = Uploader.create(type, {
    host: jdf.config.host,
    user: jdf.config.user,
    password: jdf.config.password,
    port: jdf.config.port || jdf.config.upload.port || (type == 'http' ? 3000 : (type == 'ftp' ? 21 : 22)),
    rootPrefix: jdf.config.upload.rootPrefix, // scp和http方式上传的时候会用到来拼接远程的地址
    root: uploadSource,
    target: targetServerPath,
    projectPath: projectPath
  });

  // engine.startUpload(dir);return;
  jdf.output(dir, options, function () {
    engine.startUpload(dir);
  });
}
