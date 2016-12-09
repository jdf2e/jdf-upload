'use strict';

const scp2 = require('scp2');
const Base = require('./baseUploader');
const path = require('path');
const base = require('jdf-utils').base;
const logger = require('jdf-log');

/**
 * sftp的方式，需要使用ssh账户和密码，配置对应的权限，特别是nginx的目录权限
 */
module.exports = class Scp extends Base {
  constructor(options) {
    super(options);
    // 此处参考源代码https://github.com/spmjs/node-scp2/blob/master/lib/scp.js 的最后，把client对象传递进去
    // 源代码内已经注册error事件到scp函数的callback中，这里注册监听write方法可以获取哪些文件被写入了
    this.client = new scp2.Client();
    this.client.on('write', (obj) => {
      logger.verbose(`file source:${obj.source} target:${obj.destination}`);
    });
    this.client.on('mkdir', (obj) => {
      logger.verbose(`mkdir: ${obj}`);
    });
    logger.debug('sftp mode used');
  }

  upload(root, target, upPath) {
    const uploadInfo = this.getUploadInfo(upPath);
    return Promise.all(uploadInfo.map(groupInfo => this.uploadGroup(groupInfo)))
      .then(() => {
        this.client.close();
      });
    // return new Promise((resolve, reject) => {
    //   // scp2直接支持文件到文件和目录到目录的复制
    //   scp2.scp(path.resolve(root, uploadInfo.path), {
    //     host: this.options.host,
    //     username: this.options.user,
    //     password: this.options.password,
    //     port: this.options.port,
    //     path: base.pathJoin(this.options.rootPrefix, target, uploadInfo.path),
    //   }, this.client, (err) => {
    //     if (err) {
    //       reject(err);
    //     } else {
    //       this.client.close();
    //       resolve()
    //     }
    //   })
    // })
  }

  /**
   * 单独上传一组文件，由于scp2支持的紧紧是file->file dir->dir的方式，无法上传一组无序的文件列表，
   * 所以需要把文件分组上传，每次上传一组，分组根据用户输入的文件组来决定，
   * 比如，用户输入jdf u js/style.js widget，那么js/style.js上传一次和widget/**上传一次
   * @param groupInfo
   */
  uploadGroup(groupInfo) {
    return new Promise((resolve, reject) => {
      // scp2直接支持文件到文件和目录到目录的复制
      scp2.scp(path.resolve(this.options.root, groupInfo.path), {
        host: this.options.host,
        username: this.options.user,
        password: this.options.password,
        port: this.options.port,
        path: base.pathJoin(this.options.rootPrefix, this.options.target, groupInfo.path),
      }, this.client, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve()
        }
      })
    })
  }
}
