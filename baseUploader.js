'use strict';
const fs = require('fs');
const path = require('path');
const base = require('jdf-file').$;

module.exports = class BaseUploader {
  constructor(options) {
    this.options = options;
  }

  startUpload(upPath) {
    this.upload(this.options.root, this.options.target, upPath)
      .then(() => {
        const remotePath = this.options.host + '/' + this.options.target;
        console.log(`jdf upload [${remotePath}] success!`);
      })
      .catch((err) =>{
        console.log(err.message);
      });
  }

  /**
   * 内容上传函数
   * @param root
   * @param target
   * @param upPath
   */
  upload(root, target, upPath) {
    throw new Error(`upload() in BaseUploader is an abstract method`);
  }

  /**
   * 获取上传文件的信息，上传文件的类型和路径
   * @param upPath
   * @returns {*}
   */
  getUploadInfo(upPath) {
    upPath = upPath || '';
    const root = this.options.root;
    const projectPath = this.options.projectPath;
    const absUpPath = path.resolve(root, projectPath, upPath);
    const stat = fs.statSync(absUpPath);
    upPath = base.pathJoin(path.join(projectPath, upPath));
    if (stat.isFile()) {
      return {
        type:'file',
        path: upPath,
        glob: upPath
      }
    }
    if (stat.isDirectory()) {
      upPath = upPath.slice(-1) == '/' ? upPath : upPath + '/';
      return {
        type: 'dir',
        path: upPath,
        glob: upPath + '**'
      }
    }
  }

  static create(type, options) {
    const uploader = require(`./${type}`);
    return new uploader(options);
  }
}
