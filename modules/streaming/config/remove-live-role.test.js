const Rx = require('rx');
const Collection = require('discord.js').Collection;
const ConfigAction = require('nix-core/lib/models/config-action');

const StreamingService = require('../services/streaming-service');

describe('!config streaming removeLiveRole', function () {
  beforeEach(function () {
    this.role = { id: 'role-00001', name: 'testRole' };
    this.nix = createNixStub();

    this.streamingService = sinon.createStubInstance(StreamingService);
    this.nix.stubService('streaming', 'StreamingService', this.streamingService);

    this.removeLiveRole = new ConfigAction(require('./remove-live-role'));
    this.removeLiveRole.nix = this.nix
  });

  describe('properties', function () {
    it('has the correct name', function () {
      expect(this.removeLiveRole.name).to.eq('removeLiveRole');
    });

    it('has no inputs', function () {
      expect(this.removeLiveRole.inputs).to.be.empty;
    });
  });

  describe('#configureAction', function () {
    it('gets ModuleService from Nix', function () {
      this.removeLiveRole.configureAction();
      expect(this.removeLiveRole.streamingService).to.eq(this.streamingService);
    });
  });

  describe('#run', function () {
    beforeEach(function () {
      this.removeLiveRole.configureAction();

      this.guild = {
        id: 'guild-00001',
        roles: new Collection(),
      };

      this.context = {
        inputs: {},
        guild: this.guild,
      };

      this.streamingService.removeLiveRole.returns(Rx.Observable.of(this.role));
    });

    it('removes the live role from the guild', function (done) {
      expect(this.removeLiveRole.run(this.context))
        .and.complete(done, () => {
          expect(this.streamingService.removeLiveRole).to.have.been.calledWith(this.guild);
        });
    });

    it('returns a success message', function (done) {
      expect(this.removeLiveRole.run(this.context))
        .to.emit([ { status: 200, content: `Live streamers will no longer receive a role` } ])
        .and.complete(done);
    });
  });
});
