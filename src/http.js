'use strict';

const request = require('request');
const Base = require('./baseUploader');
const path = require('path');
const glob = require('glob');
const fs = require('fs');
const base = require('jdf-utils').base;
const logger = require('jdf-log');

module.exports = class Http extends Base {
  constructor(options) {
    super(options);
    // 需要在服务器端做好配置入口
    this.uploadPath = `http://${options.host}:${options.port}/`;
    logger.debug('http mode used');
  }

  upload(root, target, upPath) {
    let uploadGlob = this.getUploadInfo(upPath).map(info => info.glob);
    uploadGlob = uploadGlob.length > 1 ? `{${uploadGlob.join(',')}}` : uploadGlob[0];

    return new Promise((resolve, reject) => {
      glob(uploadGlob, {
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
            logger.verbose(`source:${path.resolve(root, file)} target:${remotePrefix + file}`);
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
