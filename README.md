# jdf-upload
jdf上传模块，包含ftp scp 和http

## How
``` js
var upload = require('jdf-upload');
upload(dir, options, jdf);
```

其中

* dir是jdf upload命令对应的上传文件路径，可以为空
* options是 命令行其他的参数
* jdf是jdf对象的引用