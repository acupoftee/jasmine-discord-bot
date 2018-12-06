const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const chaiSubset = require("chai-subset");

const observableMatchers = require('./observable-matchers');

chai.use(sinonChai);
chai.use(chaiSubset);
chai.use(observableMatchers);

global.sinon = sinon;
global.expect = chai.expect;
