'use strict';

const chai = require('chai');
const path = require('path');
const Base = require('../src/baseUploader');
const utils = require('./utils');
const Ftp = require('../src/ftp');
const Scp = require('../src/scp');
const Http = require('../src/http');

chai.should();
chai.use(require('chai-properties'));

describe('src/baseUploader',() => {
  describe('create()', () => {
    it('初始化正确的组件类型', () => {
      let instance = Base.create('ftp',utils.defaultConfig('ftp'));
      instance.should.be.an.instanceOf(Ftp);

      instance = Base.create('http',utils.defaultConfig('http'));
      instance.should.be.an.instanceOf(Http);

      instance = Base.create('scp',utils.defaultConfig('scp'));
      instance.should.be.an.instanceOf(Scp);
    });
  });

  describe('getUploadInfo(upPath)', () => {
    const instance = Base.create('ftp',utils.defaultConfig('ftp'));

    it('默认路径，返回改路径对应的信息', () => {
      const info = instance.getUploadInfo();
      info.should.have.properties({
        type: 'dir',
        path: 'product/index/1.0.0/',
        glob: `product/index/1.0.0/**`,
      })
    });

    describe('给定文件的相对路径，返回信息', () => {
      const result = (info) => {
        info.should.have.properties({
          type: 'file',
          path: 'product/index/1.0.0/js/style.js',
          glob: `product/index/1.0.0/js/style.js`,
        });
      }
      it(`带'./'前缀`, () => {
        const info = instance.getUploadInfo('./js/style.js');
        result(info);
      });

      it(`不带'./'前缀`, () => {
        const info = instance.getUploadInfo('js/style.js');
        result(info);
      });
    });

    describe('给定文件夹的不同相对路径，返回信息', () => {
      const result = (info) => {
        info.should.have.properties({
          type: 'dir',
          path: 'product/index/1.0.0/widget/',
          glob: `product/index/1.0.0/widget/**`,
        })
      };

      it(`带'./'前缀`, () => {
        const info = instance.getUploadInfo('./widget/');
        result(info);
      });

      it(`不带'./'前缀`, () => {
        const info = instance.getUploadInfo('./widget');
        result(info);
      });

      it(`带'/'后缀`, () => {
        const info = instance.getUploadInfo('widget/');
        result(info);
      });

      it(`不带'/'后缀`, () => {
        const info = instance.getUploadInfo('widget');
        result(info);
      });
    })
  });
});
