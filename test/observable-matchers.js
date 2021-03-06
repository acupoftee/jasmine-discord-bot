let Rx = require('rx');

module.exports = function (chai) {
  var Assertion = chai.Assertion;

  Assertion.addProperty('observable', function () {
    new Assertion(this._obj).to.be.an.instanceOf(Rx.Observable);
  });

  Assertion.addMethod('emitLength', function (length) {
    new Assertion(this._obj).to.be.observable;
    this._obj.count(() => true).subscribe((emittedLength) => new Assertion(emittedLength).to.eq(length));
  });

  Assertion.addMethod('emit', function (items) {
    new Assertion(this._obj).to.be.observable;
    this._obj.toArray().subscribe((emittedItems) => new Assertion(emittedItems).to.deep.equal(items));
  });

  Assertion.overwriteMethod('throw', function (_super) {
    return function(errorLike, errMsgMatcher, msg) {
      if (this._obj instanceof Rx.Observable) {
        this._obj
          .subscribe(
            () => {},
            (error) => { new Assertion(error).to.be.an.instanceOf(errorLike); },
            () => { throw new Error("Expected stream to throw an error."); });
      } else {
        return _super(errorLike, errMsgMatcher, msg);
      }
    };
  });

  Assertion.addMethod('close', function (done, callback) {
    new Assertion(this._obj).to.be.an.instanceOf(Rx.Observable);

    let onClose = () => {
      if (callback) { callback(); }
      done();
    };

    this._obj.subscribe(() => {}, onClose, onClose);
  });

  Assertion.addMethod('complete', function (done, callback) {
    new Assertion(this._obj).to.be.an.instanceOf(Rx.Observable);
    this._obj.subscribe(() => {}, (error) => done(error), () => {
      if (callback) { callback(); }
      done();
    });
  });
};
