changelog

## 0.2.0

* 修复上传时配置参数抛异常的问题

## 0.1.8

* 增加入口多个参数的支持，现在可以jdf u a1.js foo/a2.js bar/zoo/a3.js

## 0.1.7

* 替换jdf-file为jdf-utils

## 0.1.6

* 替换日志模块，把原来的console.*替换到jdf-log上

## 0.1.5

* 增加travis和covercell

## 0.1.4

* 增加了三个模块的单元测试

## 0.1.3

* 增加了eslint代码验证

## 0.1.2
* ftp.js中的get方法可以在文件写入完毕后resolve，确保执行顺序
* 去掉了对q.js的依赖，全部用原生Promise

## 0.1.1
* 在upload中增加对文件路径的解析功能，现在upload可以脱离output独立运行，不过当前不拆分这两个命令，等output重构完再拆分

## 0.1.0
* 把jdf的upload功能拆分出来，并且支持ftp scp http三种方式上传
