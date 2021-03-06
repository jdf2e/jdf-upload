'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const path = require('path');
const Base = require('../src/baseUploader');
const utils = require('./utils');
const base = require('jdf-utils').base;
const scp2 = require('scp2');

chai.should();
chai.use(sinonChai);
chai.use(require('chai-properties'));

describe('src/scp', () => {
  describe.skip('upload()', () => {
    const config = utils.defaultConfig('scp');
    const uploader = Base.create('scp', config);

    let scpFake;

    beforeEach(() => {
      scpFake = sinon.stub(scp2, 'scp', function(path, options, client, callback) {
        callback(null);
      });
    });

    afterEach(() => {
      scp2.scp.restore();
    });

    it('上传单个文件夹', () => {
      return uploader.startUpload('widget').then(() => {
        const localPath = path.resolve(config.root, config.projectPath, 'widget');

        scpFake.calledOnce.should.be.true;
        scpFake.should.calledWith(localPath, {
          host: config.host,
          username: config.user,
          password: config.password,
          port: config.port,
          path: base.pathJoin(config.rootPrefix, config.target, config.projectPath, 'widget', '/')
        });
      });
    });

    it('上传单个文件', () => {
      return uploader.startUpload('widget/about/about.css').then(() => {
        const localPath = path.resolve(config.root, config.projectPath, 'widget/about/about.css');

        scpFake.calledOnce.should.be.true;
        scpFake.should.calledWith(localPath, {
          host: config.host,
          username: config.user,
          password: config.password,
          port: config.port,
          path: base.pathJoin(config.rootPrefix, config.target, config.projectPath, 'widget/about/about.css')
        });
      });
    });

    it('上传多个文件和文件夹', () => {
      const uploadFiles = ['widget/about/', 'js/style.js', 'css/style.css'];
      return uploader.startUpload(uploadFiles).then(() => {
        scpFake.calledThrice.should.be.true;

        uploadFiles.forEach(p => {
          const localPath = path.resolve(config.root, config.projectPath, p);

          scpFake.should.calledWith(localPath, {
            host: config.host,
            username: config.user,
            password: config.password,
            port: config.port,
            path: base.pathJoin(config.rootPrefix, config.target, config.projectPath, p)
          });
        })
      });
    });
  });
});
