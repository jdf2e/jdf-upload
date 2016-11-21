'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const path = require('path');
const Base = require('../src/baseUploader');
const utils = require('./utils');
const base = require('jdf-file').base;

chai.should();
chai.use(require('chai-properties'));
chai.use(sinonChai);

describe('src/ftp', () => {
  const config = utils.defaultConfig('ftp');
  const uploader = Base.create('ftp', config);

  describe('getFiles()', () => {
    it('返回某个目录下要上传的文件信息', () => {
      // ftp的文件信息包含文件和文件夹
      const upFiles = uploader.getFiles(config.root, config.target, 'widget');
      const data = [
        'widget/',
        'widget/about/',
        'widget/about/i/',
        'widget/about/i/i-contactus.png',
        'widget/about/i/i-intro.png',
        'widget/about/about.css',
        'widget/about/component.json'
      ].sort().map(item => {
        return {
          source: path.resolve(config.root, config.projectPath, item),
          target: base.pathJoin(config.target, config.projectPath, item),
          type: (item.slice(-1) === '/' ? 'dir' : 'file')
        }
      });
      upFiles.should.eql(data);
    });
  });

  describe('upload()', () => {
    let applyed = false;
    // fake 几个需要的函数
    let connectFake, mkdirFake, putFake;

    beforeEach(()=> {
      connectFake = sinon.stub(uploader.client, 'connect', function () {
        if (!applyed) {
          uploader.client.emit('ready');
          applyed = true;
        }
        uploader.client.connected = true;
      });

      mkdirFake = sinon.stub(uploader.client, 'mkdir', function (source, force, callback) {
        // console.log(source);
        callback(null);
      });

      putFake = sinon.stub(uploader.client, 'put', function (source, target, callback) {
        // console.log(source);
        callback(null);
      });
    });

    afterEach(() => {
      connectFake.restore();
      mkdirFake.restore();
      putFake.restore();
      uploader.client.connected = false;
      applyed = false;
    });

    describe('上传文件夹', () => {
      const files = [
        'product/index/1.0.0/config.json',
        'product/index/1.0.0/css/style.css',
        'product/index/1.0.0/js/style.js',
        'product/index/1.0.0/widget/about/about.css',
        'product/index/1.0.0/widget/about/component.json',
        'product/index/1.0.0/widget/about/i/i-contactus.png',
        'product/index/1.0.0/widget/about/i/i-intro.png',
      ].sort(); // node-glob默认都是排序的

      const dirs = [
        'product/index/1.0.0/',
        'product/index/1.0.0/css/',
        'product/index/1.0.0/js/',
        'product/index/1.0.0/widget/',
        'product/index/1.0.0/widget/about/',
        'product/index/1.0.0/widget/about/i/',
      ].sort();

      it('计算所有上传的子文件夹', () => {
        return uploader.startUpload().then(function () {
          mkdirFake.callCount.should.equal(dirs.length);

          dirs.forEach((dir,index) => {
            const serverPath = base.pathJoin(config.target, dir);
            const call = mkdirFake.getCall(index);
            call.args[0].should.eql(serverPath);
          })
        });
      });

      it('计算所有上传的文件', () => {
        return uploader.startUpload().then(function () {
          putFake.callCount.should.equal(files.length);

          files.forEach((file,index) => {
            const localPath = path.resolve(config.root, file);
            const serverPath = base.pathJoin(config.target, file);
            const call = putFake.getCall(index);
            call.args[0].should.eql(localPath);
            call.args[1].should.eql(serverPath);
          })
        });
      });
    });

    describe('上传单个文件', () => {
      const files = [
        'product/index/1.0.0/js/style.js',
      ].sort(); // node-glob默认都是排序的

      const dirs = [
        'product/index/1.0.0/js/',
      ].sort();

      it('计算所有上传的子文件夹', () => {
        return uploader.startUpload('./js/style.js').then(function () {
          mkdirFake.callCount.should.equal(dirs.length);

          dirs.forEach((dir,index) => {
            const serverPath = base.pathJoin(config.target, dir);
            const call = mkdirFake.getCall(index);
            call.args[0].should.eql(serverPath);
          })
        });
      });

      it('计算所有上传的文件', () => {
        return uploader.startUpload('./js/style.js').then(function () {
          putFake.callCount.should.equal(files.length);

          files.forEach((file,index) => {
            const localPath = path.resolve(config.root, file);
            const serverPath = base.pathJoin(config.target, file);
            const call = putFake.getCall(index);
            call.args[0].should.eql(localPath);
            call.args[1].should.eql(serverPath);
          })
        });
      });
    })
  });
});
