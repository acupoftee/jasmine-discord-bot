let Rx = require('rx');
let Collection = require('discord.js').Collection;
let ConfigAction = require('nix-core/lib/models/config-action');

let StreamingService = require('../services/streaming-service');

describe('!config streaming removeLiveRole', function () {
  beforeEach(function () {
    this.role = { id: 'role-00001', name: 'testRole' };

    this.streamingService = new StreamingService();

    this.removeLiveRole = new ConfigAction(require('./remove-live-role'));
    this.removeLiveRole.streamingService = this.streamingService;
  });

  describe('properties', function () {
    it('has the correct name', function () {
      expect(this.removeLiveRole.name).to.eq('removeLiveRole');
    });

    it('has no inputs', function () {
      expect(this.removeLiveRole.inputs).to.be.empty;
    });
  });

  describe('#run', function () {
    beforeEach(function () {
      this.guild = {
        id: 'guild-00001',
        roles: new Collection(),
      };

      this.context = {
        inputs: {},
        guild: this.guild,
      };

      sinon.stub(this.streamingService, 'removeLiveRole').returns(Rx.Observable.of(this.role));
    });

    it('removes the live role from the guild', function (done) {
      expect(this.removeLiveRole.run(this.context))
        .and.complete(() => {
          expect(this.streamingService.removeLiveRole).to.have.been.calledWith(this.guild);
          done();
        });
    });

    it('returns a success message', function (done) {
      expect(this.removeLiveRole.run(this.context))
        .to.emit([ { status: 200, content: `Live streamers will no longer receive a role` } ])
        .and.complete(done);
    });
  });
});
