const path = require('path');
const fs = require('fs');
const glob = require('glob');
const fsPath = require('fs-path');
const FTP = require('./node-ftp/connection');
const Base = require('./baseUploader');
const Q = require('q');

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
      if (typeof(source) == 'undefined') {
        this.client.end();
        reject(new Error('jdf error [ftp.mkdir] source is not exists'));
      }
      else {
        this.connect()
          .then(() => {
            this.client.mkdir(source, true, err => {
              if (err) {
                this.client.end();
                reject(err);
              }
              else {
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
          this.client.get(source, function (err, stream) {
            if (err) {
              this.client.end();
              reject(new Error('jdf error [ftp.get] - ' + target + ' - ' + err));
            } else {
              stream.pipe(fs.createWriteStream(target));
              resolve();
            }
          });
        });
    });
  }

  put(source, target) {
    return new Promise((resolve, reject) => {
      this.client.put(source, target, err => {
        if (err) {
          this.client.end();
          reject(new Error('jdf error [ftp.put] - ' + target + ' - ' + err));
        } else {
          resolve();
        }
      });
    });
  }

  list(source) {
    if (typeof(source) == 'undefined') {
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
              if (list && list.length > 0) {
                var filesList = [];
                list.forEach((data) => {
                  var fileType = '';
                  if (data.type == '-') {
                    fileType = 'file';
                  } else if (data.type == 'd') {
                    fileType = 'dir';
                  }

                  filesList.push({
                    name: data.name,
                    type: fileType
                  })
                });
                resolve(filesList);
              } else {
                this.client.end();
                reject(new Error('jdf warnning : "' + source + '" is not exists'));
              }
            }
          });
        })
    })
  }

  download(source, target) {
    return new Promise((resolve, reject) => {
      this.listMain(source)
        .then((data) => {
          if (data instanceof Error) {
            reject(data);
          } else {
            fsPath.mkdirSync(target); //先创建本地的文件夹，再下载
            let serverNum = 0, localNum = 0;

            data.filter((item) => item.type === 'file')
              .reduce((prev, item) => {
              return prev.then(() => {
                serverNum++;
                var sourcePut = source + '/' + item.name;
                var targetPut = target + '/' + item.name;

                return this.get(sourcePut, targetPut, function() {
                  localNum++;
                });
              });
            }, Q()).then(() => {
              this.client.end();
              if (serverNum == localNum) {
                resolve();
              }
            });
          }
        });
    });
  }

  upload(source, target) {
    var files = getFiles(source, target);
    // files.forEach(function(file) {
    //     console.log(file.source, file.target);
    // });return;
    //远程先创建文件夹，再创建文件
    return new Promise((resolve, reject) => {
      this.connect()
        .then(() => {
          return files.reduce((prev, info) => {
            return prev.then(() => {
              // console.log(info.target);
              if (info.type === 'dir') {
                return this.mkdir(info.target);
              }
              else {
                return this.put(info.source, info.target);
              }
            })
          }, Q()).then(() => {
            this.client.end();
            resolve();
          });
        });
    });
  }
}

/**
 * 遍历本地文件，获取所有的文件和文件夹，类似walk的功能
 * @param source
 * @param target
 * @param files
 */
function getFiles(source, target){
  const files = glob.sync('**/*', {
    cwd: source
  });

  return files.map((file) => {
    const subSourcePath = path.resolve(source, file);
    const subTargetPath = target + '/' + file; //服务器都是linux，或者ftp服务，所以此处路径直接拼接
    const type = fs.lstatSync(subSourcePath).isDirectory() ? 'dir' : 'file';
    return {
      source: subSourcePath,
      target: subTargetPath,
      type: type
    };
  });
}
