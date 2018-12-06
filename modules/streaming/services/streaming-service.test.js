const Rx = require('rx');
const NixDataMemory = require('nix-data-memory');

const StreamingService = require('./streaming-service');
const DATAKEYS = require('../datakeys');

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

      this.oldMember = { name: "oldMember" };
      this.newMember = { name: "newMember" };

      this.eventPayload = [ this.oldMember, this.newMember ];
    });

    it('calls #handlePresenceUpdate', function (done) {
      sinon.stub(this.streamingService, 'handlePresenceUpdate').returns(Rx.Observable.of(''));

      this.presenceUpdate$.subscribe(
        () => {},
        (error) => done(error),
        () => {
          expect(this.streamingService.handlePresenceUpdate).to.have.been.called;
          done();
        },
      );

      this.presenceUpdate$.onNext(this.eventPayload);
      this.presenceUpdate$.onCompleted();
    });

    it('passes the new and old members to #handlePresenceUpdate', function (done) {
      sinon.stub(this.streamingService, 'handlePresenceUpdate').returns(Rx.Observable.of(''));

      this.presenceUpdate$.subscribe(
        () => {},
        (error) => done(error),
        () => {
          expect(this.streamingService.handlePresenceUpdate).to.have.been.calledWith(this.oldMember, this.newMember);
          done();
        },
      );

      this.presenceUpdate$.onNext(this.eventPayload);
      this.presenceUpdate$.onCompleted();
    });
  });

  describe('#handlePresenceUpdate', function () {
    beforeEach(function () {
      this.guild = { id: 'testGuild' };

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
        this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember)
          .subscribe(
            () => {},
            (error) => done(error),
            () => done(),
          );
      });
    });

    context('when there is a role to assign', function () {
      beforeEach(function (done) {
        this.role = { id: 'role-00001', name: 'test-role' };
        this.nix.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, this.role.id)
          .subscribe(() => {}, (error) => done(error), () => done());
      });


      context('when the new user is live', function () {
        beforeEach(function () {
          this.newMember.presence.game = {
            streaming: true,
          };
        });

        context('when the user is missing the role', function () {
          beforeEach(function () {
            delete this.newMember.roles[this.role.id];
          });

          it('assigns the role to the member', function (done) {
            this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember)
              .subscribe(
                () => {
                },
                (error) => done(error),
                () => {
                  expect(this.newMember.addRole).to.have.been.calledWith(this.role.id);
                  done();
                },
              );
          });
        });

        context('when the user already has the role', function () {
          beforeEach(function () {
            this.newMember.roles.set(this.role.id, this.role);
          });

          it('does not assign the role to the member', function (done) {
            this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember)
              .subscribe(
                () => {},
                (error) => done(error),
                () => {
                  expect(this.newMember.addRole).not.to.have.been.called;
                  done();
                },
              );
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
            this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember)
              .subscribe(
                () => {},
                (error) => done(error),
                () => {
                  expect(this.newMember.removeRole).not.to.have.been.called;
                  done();
                },
              );
          });
        });

        context('when the user has the role', function () {
          beforeEach(function () {
            this.newMember.roles.set(this.role.id, this.role);
          });

          it('removes the role', function (done) {
            this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember)
              .subscribe(
                () => {},
                (error) => done(error),
                () => {
                  expect(this.newMember.removeRole).to.have.been.calledWith(this.role.id);
                  done();
                },
              );
          });
        });
      });
    });
  });

  describe('#getLiveRoleId', function () {
    beforeEach(function () {
      this.role = { id: 'role-00001', name: 'test-role' };
      this.guild = { id: 'guild-00001' };
    });

    context('when there is a role set', function () {
      beforeEach(function (done) {
        this.nix.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, this.role.id)
          .subscribe(() => {
          }, (error) => done(error), () => done());
      });

      it('returns the roleId to assign', function (done) {
        this.streamingService.getLiveRoleId(this.guild)
          .subscribe(
            (roleId) => this.returnedValue = roleId,
            (error) => done(error),
            () => {
              expect(this.returnedValue).to.eq(this.role.id);
              done();
            },
          );
      });
    });

    context('when there is no role set', function () {
      beforeEach(function (done) {
        this.nix.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, null)
          .subscribe(() => {
          }, (error) => done(error), () => done());
      });

      it('returns null', function (done) {
        this.streamingService.getLiveRoleId(this.guild)
          .subscribe(
            (roleId) => this.returnedValue = roleId,
            (error) => done(error),
            () => {
              expect(this.returnedValue).to.be.null;
              done();
            },
          );
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
});
