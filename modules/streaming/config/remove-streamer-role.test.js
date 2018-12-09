const Rx = require('rx');
const Collection = require('discord.js').Collection;
const ConfigAction = require('nix-core/lib/models/config-action');

const StreamingService = require('../services/streaming-service');
const { RoleNotFoundError } = require('../lib/errors');

describe('!config streaming removeStreamerRole', function () {
  beforeEach(function () {
    this.role = { id: 'role-00001', name: 'testRole' };
    this.nix = createNixStub();

    this.streamingService = sinon.createStubInstance(StreamingService);
    this.nix.stubService('streaming', 'StreamingService', this.streamingService);

    this.removeStreamerRole = new ConfigAction(require('./remove-streamer-role'));
    this.removeStreamerRole.nix = this.nix;
  });

  describe('properties', function () {
    it('has the correct name', function () {
      expect(this.removeStreamerRole.name).to.eq('removeStreamerRole');
    });

    it('has no inputs', function () {
      expect(this.removeStreamerRole.inputs).to.be.empty;
    });
  });

  describe('#configureAction', function () {
    it('gets ModuleService from Nix', function () {
      this.removeStreamerRole.configureAction();
      expect(this.removeStreamerRole.streamingService).to.eq(this.streamingService);
    });
  });

  describe('#run', function () {
    beforeEach(function () {
      this.removeStreamerRole.configureAction();

      this.guild = {
        id: 'guild-00001',
        roles: new Collection(),
      };

      this.context = {
        inputs: {},
        guild: this.guild,
      };

      this.streamingService.removeStreamerRole.returns(Rx.Observable.of(this.role));
    });

    it('removes the streamer role from the guild', function (done) {
      expect(this.removeStreamerRole.run(this.context))
        .and.complete(() => {
        expect(this.streamingService.removeStreamerRole).to.have.been.calledWith(this.guild);
        done();
      });
    });

    it('returns a success message', function (done) {
      expect(this.removeStreamerRole.run(this.context))
        .to.emit([ {
          status: 200,
          content: `I will no longer limit adding the live role to users with the role ${this.role.name}`
        } ])
        .and.complete(done);
    });

    context('when there was no previous streamer role', function() {
      beforeEach(function () {
        this.streamingService.removeStreamerRole.returns(Rx.Observable.throw(new RoleNotFoundError('The role could not be found')));
      });

      it('gives a user readable error', function (done) {
        expect(this.removeStreamerRole.run(this.context))
          .to.emit([ {
            status: 400,
            content: `No streamer role was set.`
          } ])
          .and.complete(done);
      });
    });
  });
});
