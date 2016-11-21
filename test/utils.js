const path = require('path');

module.exports = {
  defaultConfig:function(type) {
    const config = require('./files/config.json');
    const uploadSource = path.resolve(path.dirname(__filename), 'files', config.outputDirName);
    return {
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port || config.upload.port || (type === 'http' ? 3000 : (type === 'ftp' ? 21 : 22)),// eslint-disable-line
      rootPrefix: config.upload.rootPrefix, // scp和http方式上传的时候会用到来拼接远程的地址
      root: uploadSource,
      target: 'page.jd.com',
      projectPath: config.projectPath,
    }
  }
}
