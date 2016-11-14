'use strict';

module.exports = class BaseUploader {
  constructor(options) {
    this.options = options;
  }

  startUpload(source, target) {
    this.upload(source, target)
      .then(() => {
        const remotePath = this.options.host + '/' + target;
        console.log(`jdf upload [${remotePath}] success!`);
      })
      .catch((err) =>{
        console.log(err.message);
      });
  }

  upload() {
    throw new Error(`method 'startUpload' in base uploader is an abstract method`);
  }

  static create(type, options) {
    const uploader = require(`./${type}`);
    return new uploader(options);
  }
}
