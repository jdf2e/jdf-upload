'use strict';

const request = require('request');
const Base = require('./baseUploader');
const path = require('path');
const glob = require('glob');
const fs = require('fs');

module.exports = class Http extends Base {
  constructor(options) {
    super(options);
    // 需要在服务器端做好配置入口
    this.uploadPath = `http://${options.host}:${options.port}/`;
  }

  upload(source, target) {
    return new Promise((resolve, reject) => {
      glob('**/*', {
        cwd: source,
        nodir: true,
      }, (err, files) => {
        if (err) {
          reject(err);
        }
        else {
          let formData = {};
          const remotePrefix = path.join(this.options.rootPrefix, target, '/').replace(/\\/g,'/')
          files.forEach((file) => {
            formData[remotePrefix + file] = fs.createReadStream(path.resolve(source, file));
          });
          request.post({url:this.uploadPath, formData: formData}, (err, res, body) => {
            if (err) {
              reject(err);
            }
            else if (res.statusCode !== 200) {
              reject(new Error(`remote server status error, code ${res.statusCode}`))
            }
            else {
              resolve();
            }
          });
        }
      })
    })
  }
}
