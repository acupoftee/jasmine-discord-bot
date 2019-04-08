const chai = require('chai');
const chaiSubset = require('chai-subset');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const Jasmine = require('../jasmine');
const observableMatchers = require('./observable-matchers');

chai.use(sinonChai);
chai.use(chaiSubset);
chai.use(observableMatchers);

global.sinon = sinon;
global.expect = chai.expect;

function stubJasmine(config = {}) {
  let jasmine = new Jasmine({
    ownerUserId: 'user-00001',
    loginToken: 'example-token',

    logger: {silent: true},
    dataSource: {type: 'memory'},

    ...config,
  });

  jasmine.stubService = (moduleName, serviceName, service) => {
    let serviceKey = `${moduleName}.${serviceName}`.toLowerCase();
    jasmine.servicesManager._services[serviceKey] = service;
  };

  jasmine.discord.user = {
    id: jasmine.config.ownerUserId,
    send: sinon.fake.resolves(''),
    setPresence: sinon.fake.resolves({}),
  };

  sinon.stub(jasmine, 'handleError').callsFake((error) => {
    throw error;
  });
  sinon.stub(jasmine.discord, 'login').resolves({});

  jasmine.discord.login = () => {
    return new Promise((resolve) =>
      resolve(),
    );
  };

  jasmine.discord.fetchUser = (id) => {
    return new Promise((resolve) =>
      resolve({
        id,
        send: sinon.fake.resolves(''),
      }),
    );
  };

  jasmine.discord.destroy = () => {
    return new Promise((resolve) =>
      resolve(),
    );
  };

  return jasmine;
}

global.stubJasmine = stubJasmine;
