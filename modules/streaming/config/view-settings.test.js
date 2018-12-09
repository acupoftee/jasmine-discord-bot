const Rx = require('rx');
const Collection = require('discord.js').Collection;
const ConfigAction = require('nix-core/lib/models/config-action');

const StreamingService = require('../services/streaming-service');

describe('!config streaming viewSettings', function () {
  beforeEach(function () {
    this.nix = createNixStub();

    this.streamingService = new StreamingService(this.nix);
    this.nix.stubService('streaming', 'StreamingService', this.streamingService);

    this.viewSettings = new ConfigAction(require('./view-settings'));
    this.viewSettings.nix = this.nix;
  });

  describe('properties', function () {
    it('has the correct name', function () {
      expect(this.viewSettings.name).to.eq('viewSettings');
    });

    it('has no inputs', function () {
      expect(this.viewSettings.inputs).to.be.empty;
    });
  });

  describe('#configureAction', function () {
    it('gets ModuleService from Nix', function () {
      this.viewSettings.configureAction();
      expect(this.viewSettings.streamingService).to.eq(this.streamingService);
    });
  });

  describe('#run', function () {
    beforeEach(function () {
      this.viewSettings.configureAction();

      this.guild = {
        id: 'guild-00001',
        roles: new Collection(),
      };

      this.context = {
        inputs: {},
        guild: this.guild,
      };
    });

    context('when no live role is set', function () {
      beforeEach(function () {
        sinon.stub(this.streamingService, 'getLiveRole').returns(Rx.Observable.from([undefined]));
      });

      it('Says the live role is not set', function (done) {
        let stream = this.viewSettings
          .run(this.context)
          .map((response) => {
            expect(response.embed.fields).to.containSubset([
              { name: "Live Role:", value: "[Not set]" }
            ])
          });

        expect(stream).to.complete(done);
      });
    });

    context('when a live role is set', function () {
      beforeEach(function () {
        this.role = { id: 'role-00001', name: 'liveRole' };
        sinon.stub(this.streamingService, 'getLiveRole').returns(Rx.Observable.from([ this.role ]));
      });

      it('Says the live role is not set', function (done) {
        let stream = this.viewSettings
          .run(this.context)
          .map((response) => response.embed)
          .map((embed) => {
            expect(embed.fields).to.containSubset([
              { name: "Live Role:", value: "liveRole" }
            ])
          });

        expect(stream).to.complete(done);
      });
    });

    context('when no streamer role is set', function () {
      beforeEach(function () {
        sinon.stub(this.streamingService, 'getStreamerRole').returns(Rx.Observable.from([undefined]));
      });

      it('Says the live role is not set', function (done) {
        let stream = this.viewSettings
          .run(this.context)
          .map((response) => {
            expect(response.embed.fields).to.containSubset([
              { name: "Streamer Role:", value: "[Not set]" }
            ])
          });

        expect(stream).to.complete(done);
      });
    });

    context('when a streamer role is set', function () {
      beforeEach(function () {
        this.role = { id: 'role-00001', name: 'streamerRole' };
        sinon.stub(this.streamingService, 'getStreamerRole').returns(Rx.Observable.from([ this.role ]));
      });

      it('Says the live role is not set', function (done) {
        let stream = this.viewSettings
          .run(this.context)
          .map((response) => response.embed)
          .map((embed) => {
            expect(embed.fields).to.containSubset([
              { name: "Streamer Role:", value: "streamerRole" }
            ])
          });

        expect(stream).to.complete(done);
      });
    });
  });
});
