const Rx = require('rx');
const NixDataMemory = require('nix-data-memory');

const StreamingService = require('./streaming-service');
const DATAKEYS = require('../lib/datakeys');
const { RoleNotFoundError } = require('../lib/errors');

describe('StreamingService', function () {
  beforeEach(function () {
    this.dataSource = new NixDataMemory();
    this.presenceUpdate$ = new Rx.Subject();

    this.nix = createNixStub();
    this.nix.streams = { presenceUpdate$: this.presenceUpdate$ };

    this.streamingService = new StreamingService(this.nix);
  });

  afterEach(function () {
    this.presenceUpdate$.onCompleted();
  });

  describe('onNixListen', function () {
    it('subscribes to the presence update event stream', function () {
      this.streamingService.onNixListen();
      expect(this.presenceUpdate$.observers.length).to.eq(1);
    });
  });

  describe('on presence update', function () {
    beforeEach(function () {
      this.streamingService.onNixListen();
      this.moduleService = this.nix.getService('core', 'moduleService');

      this.guild = { id: "guild-00001" };

      this.oldMember = { name: "oldMember", guild: this.guild };
      this.newMember = { name: "newMember", guild: this.guild };

      this.eventPayload = [ this.oldMember, this.newMember ];

      this.streamingService.moduleService = this.moduleService;
    });

    context('when the module is disabled', function () {
      beforeEach(function () {
        this.streamingService.moduleService.filterModuleEnabled = () => Rx.Observable.empty();
      });

      it('does not call #handlePresenceUpdate', function (done) {
        sinon.stub(this.streamingService, 'handlePresenceUpdate').returns(Rx.Observable.of(''));

        expect(this.presenceUpdate$)
          .to.complete(() => {
          expect(this.streamingService.handlePresenceUpdate).not.to.have.been.called;
          done();
        });

        this.presenceUpdate$.onNext(this.eventPayload);
        this.presenceUpdate$.onCompleted();
      });
    });

    context('when the module is enabled', function () {
      beforeEach(function () {
        this.streamingService.moduleService
          .isModuleEnabled = (guildId, moduleName) => {
            if (guildId === this.guild.id && moduleName === 'streaming') {
              return Rx.Observable.of(true);
            } else {
              return Rx.Observable.of(false);
            }
          };
      });

      it('calls #handlePresenceUpdate', function (done) {
        sinon.stub(this.streamingService, 'handlePresenceUpdate').returns(Rx.Observable.of(''));

        expect(this.presenceUpdate$)
          .to.complete(() => {
          expect(this.streamingService.handlePresenceUpdate).to.have.been.called;
          done();
        });

        this.presenceUpdate$.onNext(this.eventPayload);
        this.presenceUpdate$.onCompleted();
      });

      it('passes the new and old members to #handlePresenceUpdate', function (done) {
        sinon.stub(this.streamingService, 'handlePresenceUpdate').returns(Rx.Observable.of(''));

        expect(this.presenceUpdate$)
          .to.complete(() => {
          expect(this.streamingService.handlePresenceUpdate).to.have.been.calledWith(this.oldMember, this.newMember);
          done();
        });

        this.presenceUpdate$.onNext(this.eventPayload);
        this.presenceUpdate$.onCompleted();
      });
    });
  });

  describe('#handlePresenceUpdate', function () {
    beforeEach(function () {
      this.guild = {
        id: 'testGuild',
        roles: new Map(),
      };

      this.oldMember = {
        name: "oldMember",
        guild: this.guild,
        presence: {},
        roles: new Map(),
      };

      this.newMember = {
        name: "newMember",
        guild: this.guild,
        presence: {},
        roles: new Map(),

        addRole: sinon.fake.resolves(''),
        removeRole: sinon.fake.resolves(''),
      };
    });

    context('when there no role to assign', function () {
      beforeEach(function (done) {
        this.nix.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, null)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('does not raise an error', function (done) {
        expect(this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember))
          .to.complete(done);
      });
    });

    context('when there is a role to assign', function () {
      beforeEach(function (done) {
        this.role = { id: 'role-00001', name: 'test-role' };
        this.guild.roles.set(this.role.id, this.role);
        this.nix.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, this.role.id)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('calls #memberIsStreaming', function (done) {
        this.streamingService.memberIsStreaming = sinon.fake();
        expect(this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember))
          .to.complete(done, () => {
          expect(this.streamingService.memberIsStreaming).to.have.been.calledWith(this.newMember);
        });
      });

      context('when the new user is live', function () {
        beforeEach(function () {
          this.newMember.presence.game = {
            streaming: true,
          };
        });

        context('when the user is missing the role', function () {
          beforeEach(function () {
            this.newMember.roles.delete(this.role.id);
          });

          it('assigns the role to the member', function (done) {
            expect(this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember))
              .to.complete(() => {
              expect(this.newMember.addRole).to.have.been.calledWith(this.role);
              done();
            });
          });
        });

        context('when the user already has the role', function () {
          beforeEach(function () {
            this.newMember.roles.set(this.role.id, this.role);
          });

          it('does not assign the role to the member', function (done) {
            expect(this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember))
              .to.complete(() => {
              expect(this.newMember.addRole).not.to.have.been.called;
              done();
            });
          });
        });
      });

      context('when the new user is offline', function () {
        beforeEach(function () {
          this.newMember.presence.game = {
            streaming: false,
          };
        });

        context('when the user is missing the role', function () {
          beforeEach(function () {
            delete this.newMember.roles[this.role.id];
          });

          it('does not try to remove the role', function (done) {
            expect(this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember))
              .to.complete(() => {
              expect(this.newMember.removeRole).not.to.have.been.called;
              done();
            });
          });
        });

        context('when the user has the role', function () {
          beforeEach(function () {
            this.newMember.roles.set(this.role.id, this.role);
          });

          it('removes the role', function (done) {
            expect(this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember))
              .to.complete(() => {
              expect(this.newMember.removeRole).to.have.been.calledWith(this.role);
              done();
            });
          });
        });
      });
    });
  });

  describe('#getLiveRole', function () {
    beforeEach(function () {
      this.role = { id: 'role-00001', name: 'test-role' };

      this.roles = new Map();
      this.roles.set(this.role.id, this.role);

      this.guild = {
        id: 'guild-00001',
        roles: this.roles,
      };
    });

    context('when there is a role set', function () {
      beforeEach(function (done) {
        this.nix.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, this.role.id)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('returns the role to assign', function (done) {
        expect(this.streamingService.getLiveRole(this.guild))
          .to.emit([ this.role ])
          .and.complete(done);
      });
    });

    context('when there is no role set', function () {
      beforeEach(function (done) {
        this.nix.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, null)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('returns undefined', function (done) {
        expect(this.streamingService.getLiveRole(this.guild))
          .to.emitLength(1).and.emit([ undefined ])
          .and.complete(done);
      });
    });
  });

  describe('#setLiveRole', function () {
    beforeEach(function () {
      this.guild = {
        id: 'guild-00001',
        roles: new Map(),
      };
    });

    context('when passed a role', function () {
      beforeEach(function () {
        this.role = { id: 'role-00001', name: 'test-role' };
        this.guild.roles.set(this.role.id, this.role);
      });

      it('saves the role id', function (done) {
        sinon.spy(this.nix, 'setGuildData');

        expect(this.streamingService.setLiveRole(this.guild, this.role))
          .to.complete(done, () => {
            expect(this.nix.setGuildData).to.have.been.calledWith(this.guild.id, DATAKEYS.LIVE_ROLE, this.role.id);
          });
      });

      it('returns the saved role', function (done) {
        expect(this.streamingService.setLiveRole(this.guild, this.role))
          .to.emit([ this.role ])
          .and.complete(done);
      });
    });

    context('when passed null', function () {
      it('saves null', function (done) {
        sinon.spy(this.nix, 'setGuildData');

        expect(this.streamingService.setLiveRole(this.guild, null))
          .to.complete(done, () => {
            expect(this.nix.setGuildData).to.have.been.calledWith(this.guild.id, DATAKEYS.LIVE_ROLE, null);
          });
      });

      it('returns undefined', function (done) {
        expect(this.streamingService.setLiveRole(this.guild, null))
          .to.emit([ undefined ])
          .and.complete(done);
      });
    });
  });

  describe('#removeLiveRole', function () {
    beforeEach(function () {
      this.guild = {
        id: 'guild-00001',
        roles: new Map(),
      };
    });

    it('sets the live role to null', function (done) {
      sinon.spy(this.nix, 'setGuildData');

      expect(this.streamingService.removeLiveRole(this.guild))
        .to.complete(done, () => {
          expect(this.nix.setGuildData).to.have.been.calledWith(this.guild.id, DATAKEYS.LIVE_ROLE, null);
        });
    });

    context('when a previous role was set', function() {
      beforeEach(function (done) {
        this.role = { id: 'role-00001', name: 'test-role' };
        this.guild.roles.set(this.role.id, this.role);

        this.nix.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, this.role.id)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('returns the previously set role', function (done) {
        expect(this.streamingService.removeLiveRole(this.guild))
          .to.emit([ this.role ])
          .and.complete(done);
      });
    });

    context('when a previous role was set, but no longer exists', function () {
      beforeEach(function (done) {
        this.nix.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, 'role-00001')
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('returns the previously set role', function (done) {
        expect(this.streamingService.removeLiveRole(this.guild))
          .to.emit([ undefined ])
          .and.complete(done);
      });
    });

    context('when a previous role was not set', function () {
      beforeEach(function (done) {
        this.nix.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, null)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('returns undefined', function (done) {
        expect(this.streamingService.removeLiveRole(this.guild))
          .to.emit([ undefined ])
          .and.complete(done);
      });
    });
  });

  describe('#memberIsStreaming', function () {
    beforeEach(function () {
      this.member = {
        presence: {},
      };
    });

    context('when the member is not playing a game', function () {
      beforeEach(function () {
        delete this.member.presence.game;
      });

      it('returns false', function () {
        expect(this.streamingService.memberIsStreaming(this.member)).to.eq(false);
      });
    });

    context('when the member is playing a game, but not streaming', function () {
      beforeEach(function () {
        this.member.presence.game = {
          streaming: false,
        };
      });

      it('returns false', function () {
        expect(this.streamingService.memberIsStreaming(this.member)).to.eq(false);
      });
    });

    context('when the member is streaming', function () {
      beforeEach(function () {
        this.member.presence.game = {
          streaming: true,
        };
      });

      it('returns true', function () {
        expect(this.streamingService.memberIsStreaming(this.member)).to.eq(true);
      });
    });
  });

  describe('#getStreamerRole', function () {
    beforeEach(function () {
      this.role = { id: 'role-00001', name: 'test-role' };

      this.roles = new Map();
      this.roles.set(this.role.id, this.role);

      this.guild = {
        id: 'guild-00001',
        roles: this.roles,
      };
    });

    context('when there is a role set', function () {
      beforeEach(function (done) {
        this.nix.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, this.role.id)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('returns the role to assign', function (done) {
        expect(this.streamingService.getStreamerRole(this.guild))
          .to.emit([ this.role ])
          .and.complete(done);
      });
    });

    context('when there is no role set', function () {
      beforeEach(function (done) {
        this.nix.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, null)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('returns undefined', function (done) {
        expect(this.streamingService.getStreamerRole(this.guild))
          .to.emitLength(1).and.emit([ undefined ])
          .and.complete(done);
      });
    });
  });

  describe('#setStreamerRole', function () {
    beforeEach(function () {
      this.guild = {
        id: 'guild-00001',
        roles: new Map(),
      };
    });

    context('when passed a role', function () {
      beforeEach(function () {
        this.role = { id: 'role-00001', name: 'test-role' };
        this.guild.roles.set(this.role.id, this.role);
      });

      it('saves the role id', function (done) {
        sinon.spy(this.nix, 'setGuildData');

        expect(this.streamingService.setStreamerRole(this.guild, this.role))
          .to.complete(done, () => {
          expect(this.nix.setGuildData).to.have.been.calledWith(this.guild.id, DATAKEYS.STREAMER_ROLE, this.role.id);
        });
      });

      it('returns the saved role', function (done) {
        expect(this.streamingService.setStreamerRole(this.guild, this.role))
          .to.emit([ this.role ])
          .and.complete(done);
      });
    });

    context('when passed null', function () {
      it('saves null', function (done) {
        sinon.spy(this.nix, 'setGuildData');

        expect(this.streamingService.setStreamerRole(this.guild, null))
          .to.complete(done, () => {
          expect(this.nix.setGuildData).to.have.been.calledWith(this.guild.id, DATAKEYS.STREAMER_ROLE, null);
        });
      });

      it('returns undefined', function (done) {
        expect(this.streamingService.setStreamerRole(this.guild, null))
          .to.emit([ undefined ])
          .and.complete(done);
      });
    });
  });

  describe('#removeStreamerRole', function () {
    beforeEach(function () {
      this.guild = {
        id: 'guild-00001',
        roles: new Map(),
      };
    });

    context('when a previous role was set', function () {
      beforeEach(function (done) {
        this.role = { id: 'role-00001', name: 'test-role' };
        this.guild.roles.set(this.role.id, this.role);

        this.nix.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, this.role.id)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('sets the live role to null', function (done) {
        sinon.spy(this.nix, 'setGuildData');

        expect(this.streamingService.removeStreamerRole(this.guild))
          .to.complete(done, () => {
          expect(this.nix.setGuildData).to.have.been.calledWith(this.guild.id, DATAKEYS.STREAMER_ROLE, null);
        });
      });

      it('returns the previously set role', function (done) {
        expect(this.streamingService.removeStreamerRole(this.guild))
          .to.emit([ this.role ])
          .and.complete(done);
      });
    });

    context('when a previous role was set, but no longer exists', function () {
      beforeEach(function (done) {
        this.nix.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, 'role-00001')
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('throws a RoleNotFoundError', function (done) {
        expect(this.streamingService.removeStreamerRole(this.guild))
          .to.throw(RoleNotFoundError)
          .and.close(done);
      });
    });

    context('when a previous role was not set', function () {
      beforeEach(function (done) {
        this.nix.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, null)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('throws a RoleNotFoundError', function (done) {
        expect(this.streamingService.removeStreamerRole(this.guild))
          .to.throw(RoleNotFoundError)
          .and.close(done);
      });
    });
  });
});
