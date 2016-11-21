'use strict';

const path = require('path');
const fs = require('fs');
const glob = require('glob');
const fsPath = require('fs-path');
const FTP = require('./node-ftp/connection');
const Base = require('./baseUploader');
const base = require('jdf-file').base;

module.exports = class Ftp extends Base {
  constructor(options) {
    // host user password 必须提供
    super(options);
    this.client = new FTP();
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.client.connected) {
        resolve();
      } else {
        this.client
          .on('ready', resolve)
          .on('error', (err) => {
            this.client.end();
            reject(err);
          });
        this.client.connect(this.options);
      }
    });
  }

  mkdir(source) {
    return new Promise((resolve, reject) => {
      if (typeof source === 'undefined') {
        this.client.end();
        reject(new Error('jdf error [ftp.mkdir] source is not exists'));
      } else {
        this.connect()
          .then(() => {
            this.client.mkdir(source, true, (err) => {
              if (err) {
                this.client.end();
                reject(err);
              } else {
                resolve();
              }
            });
          });
      }
    });
  }

  get(source, target) {
    return new Promise((resolve, reject) => {
      this.connect()
        .then(() => {
          this.client.get(source, (err, stream) => {
            if (err) {
              this.client.end();
              reject(new Error(`[ftp.get] - ${target} - ${err.message}`));
            } else {
              stream.pipe(fs.createWriteStream(target));
              stream.once('end', () => {
                resolve();
              });
            }
          });
        });
    });
  }

  put(source, target) {
    return new Promise((resolve, reject) => {
      this.client.put(source, target, (err) => {
        if (err) {
          this.client.end();
          reject(new Error(`jdf error [ftp.put] - ${target} - ${err}`));
        } else {
          resolve();
        }
      });
    });
  }

  list(source) {
    if (typeof source === 'undefined') {
      source = './';
    }

    return new Promise((resolve, reject) => {
      this.connect()
        .then(() => {
          this.client.list(source, (err, list) => {
            if (err) {
              this.client.end();
              reject(err);
            } else {
              if (list && list.length > 0) {// eslint-disable-line
                const filesList = [];
                list.forEach((data) => {
                  let fileType = '';
                  if (data.type === '-') {
                    fileType = 'file';
                  } else if (data.type === 'd') {
                    fileType = 'dir';
                  }

                  filesList.push({
                    name: data.name,
                    type: fileType,
                  })
                });
                resolve(filesList);
              } else {
                this.client.end();
                reject(new Error(`'${source}' is not exists`));
              }
            }
          });
        })
    })
  }

  download(source, target) {
    return new Promise((resolve, reject) => {
      this.list(source)
        .then((data) => {
          if (data instanceof Error) {
            reject(data);
          } else {
            fsPath.mkdirSync(target); // 先创建本地的文件夹，再下载
            let serverNum = 0;
            let localNum = 0;

            data.filter(item => item.type === 'file')
              .reduce((prev, item) => {
                return prev.then(() => {
                  serverNum += 1;
                  const sourcePut = base.joinPath(source, item.name);
                  const targetPut = base.joinPath(target, item.name);

                  return this.get(sourcePut, targetPut, () => {
                    localNum += 1;
                  });
                });
              }, Promise.resolve())
              .then(function() {
                this.client.end();
                if (serverNum === localNum) {
                  resolve();
                }
              });
          }
        });
    });
  }

  upload(root, target, upPath) {
    const files = this.getFiles(root, target, upPath);
    // files.forEach(function(file) {
    //     console.log(file.source, file.target);
    // });return;
    // 远程先创建文件夹，再创建文件
    return new Promise((resolve) => {
      this.connect()
        .then(() => {
          return files.reduce((prev, info) => {
            return prev.then(() => {
              // console.log(info.target);
              if (info.type === 'dir') {
                return this.mkdir(info.target);
              }
              return this.put(info.source, info.target);
            })
          }, Promise.resolve()).then(() => {
            this.client.end();
            resolve();
          });
        });
    });
  }

  /**
   * 遍历本地文件，获取所有的文件和文件夹，类似walk的功能
   * @param root
   * @param target
   * @param upPath
   */
  getFiles(root, target, upPath) {
    const uploadInfo = this.getUploadInfo(upPath);
    const files = glob.sync(uploadInfo.glob, {
      cwd: root,
      mark: true,
    });

    // 如果只上传一个文件，那么增加他的父文件夹，确保node-ftp先创建文件夹再创建文件
    if (files.length === 1) {
      const stat = fs.statSync(path.resolve(root, files[0]));
      if (stat.isFile()) {
        files.unshift(`${path.dirname(files[0])}/`);
      }
    }
    return files.map((file) => {
      const subSourcePath = path.resolve(root, file);
      const subTargetPath = base.pathJoin(target, file);
      const type = fs.statSync(subSourcePath).isDirectory() ? 'dir' : 'file';
      return {
        source: subSourcePath,
        target: subTargetPath,
        type: type,
      };
    });
  }
}
