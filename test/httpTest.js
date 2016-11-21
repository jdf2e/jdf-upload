'use strict';

const chai = require('chai');
const sinon = require('sinon');
const path = require('path');
const Base = require('../src/baseUploader');
const utils = require('./utils');
const request = require('request');
const base = require('jdf-file').base;

chai.should();
chai.use(require('chai-properties'));

describe('src/http', () => {
  describe('upload()', () => {
    let post, props;
    const config = utils.defaultConfig('http');
    const uploader = Base.create('http', config);

    beforeEach(()=>{
      props = {};
      post = sinon.stub(request, "post", function(obj, callback) {
        props.obj = obj;
        props.callback=callback;
        callback(null, {
          statusCode:200
        });
      });
    });

    afterEach(() => {
      request.post.restore();
    });

    it('上传根目录下的所有文件', () => {
      // http只会上传所有的文件，而且上传目录是服务器的绝对路径
      return uploader.startUpload().then(function() {
        props.obj.should.have.property('url', 'http://192.168.153.93:3000/');
        props.obj.should.have.property('formData');
        // 验证formData
        const files = [
          'config.json',
          'css/style.css',
          'js/style.js',
          'widget/about/i/i-contactus.png',
          'widget/about/i/i-intro.png',
          'widget/about/about.css',
          // 'widget/about/about.vm',// 生成的时候没有模板文件
          'widget/about/component.json',
        ]

        const pair = {};
        files.forEach(item => {
          const local = path.resolve(config.root, config.projectPath, item);
          const remote = base.pathJoin(config.rootPrefix, config.target, config.projectPath, item);
          pair[remote] = local;
        });

        // 对比所有的key-value和count
        let count = 0;
        const formData = props.obj.formData;
        for(let p in formData) {
          count++;
        }
        count.should.equal(files.length);

        for(let p in pair) {
          formData.should.have.property(p);
          formData[p].should.have.property('path', pair[p]);
        }
      });
    })

    it('上传单个文件', () => {
      // http只会上传所有的文件，而且上传目录是服务器的绝对路径
      return uploader.startUpload('js/style.js').then(function() {
        props.obj.should.have.property('url', 'http://192.168.153.93:3000/');
        props.obj.should.have.property('formData');
        // 验证formData
        const files = [
          'js/style.js',
        ]

        const pair = {};
        files.forEach(item => {
          const local = path.resolve(config.root, config.projectPath, item);
          const remote = base.pathJoin(config.rootPrefix, config.target, config.projectPath, item);
          pair[remote] = local;
        });

        // 对比所有的key-value和count
        let count = 0;
        const formData = props.obj.formData;
        for(let p in formData) {
          count++;
        }
        count.should.equal(files.length);

        for(let p in pair) {
          formData.should.have.property(p);
          formData[p].should.have.property('path', pair[p]);
        }
      });
    })
  });
});
