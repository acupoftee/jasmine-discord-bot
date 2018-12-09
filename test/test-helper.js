const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const chaiSubset = require("chai-subset");
const NixCore = require('nix-core');

const observableMatchers = require('./observable-matchers');

chai.use(sinonChai);
chai.use(chaiSubset);
chai.use(observableMatchers);

global.sinon = sinon;
global.expect = chai.expect;

global.createNixStub = () => {
  let nix = new NixCore({
    ownerUserId: 'user-00001',
    loginToken: 'example-token'
  });

  sinon.stub(nix, 'handleError').callsFake((error) => { throw error });

  return nix;
};
