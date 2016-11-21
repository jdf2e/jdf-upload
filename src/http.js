'use strict';

const request = require('request');
const Base = require('./baseUploader');
const path = require('path');
const glob = require('glob');
const fs = require('fs');
const base = require('jdf-file').base;

module.exports = class Http extends Base {
  constructor(options) {
    super(options);
    // 需要在服务器端做好配置入口
    this.uploadPath = `http://${options.host}:${options.port}/`;
  }

  upload(root, target, upPath) {
    const uploadInfo = this.getUploadInfo(upPath);

    return new Promise((resolve, reject) => {
      glob(uploadInfo.glob, {
        cwd: root,
        nodir: true,
      }, (err, files) => {
        if (err) {
          reject(err);
        } else {
          const formData = {};
          const remotePrefix = base.pathJoin(path.join(this.options.rootPrefix, target, '/'));

          files.forEach((file) => {
            formData[remotePrefix + file] = fs.createReadStream(path.resolve(root, file));
          });

          request.post({ url: this.uploadPath, formData: formData }, (error, res) => {
            if (error) {
              reject(error);
            } else if (res.statusCode !== 200) {
              reject(new Error(`remote server status error, code ${res.statusCode}`))
            } else {
              resolve();
            }
          });
        }
      })
    })
  }
}
