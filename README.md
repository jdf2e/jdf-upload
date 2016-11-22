# jdf-upload
jdf上传模块，包含ftp scp 和http

[![Build Status](https://travis-ci.org/jdf2e/jdf-upload.svg?branch=master)](https://travis-ci.org/jdf2e/jdf-upload)

## How
``` js
const upload = require('jdf-upload');
upload(dir, options, jdf);
```

其中

* dir是jdf upload命令对应的上传文件路径，可以为空，默认就是项目编译路径，假设config.json中projectPath为'product/alla/1.0.0'，上传路径如果是'./widget'的话，就是把编译路径下'product/alla/1.0.0/widget/'下面所有的文件都上传上去，文件的话也是类似，要搞清楚上传对应的关系：
    * http对应关系为: config.outputDirName + config.projectPath + 上传路径 --> config.rootPrefix + config.target + config.projectPath + 上传路径
    * scp对应关系为：同上
    * ftp对应关系为: config.outputDirName + config.projectPath + 上传路径 --> config.target + config.projectPath + 上传路径（不包含config.rootPrefix，因为vsftp直接建的虚拟目录，ftp用户的home直接定位到了config.rootPrefix的位置）
* options是 命令行其他的参数
* jdf是jdf对象的引用
