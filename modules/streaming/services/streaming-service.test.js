const Rx = require('rx');
const NixDataMemory = require('nix-data-memory');

const StreamingService = require('./streaming-service');
const DATAKEYS = require('../datakeys');
const errors = require('../errors');

describe('StreamingService', function () {
  beforeEach(function () {
    this.dataSource = new NixDataMemory();
    this.presenceUpdate$ = new Rx.Subject();

    this.nix = {
      getGuildData: (guildId, keyword) => this.dataSource.getData('guild', guildId, keyword),
      setGuildData: (guildId, keyword, data) => this.dataSource.setData('guild', guildId, keyword, data),
      streams: { presenceUpdate$: this.presenceUpdate$ },
      handleError: (error, extraFields) => { throw error; }
    };

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

      this.eventPayload = [this.oldMember, this.newMember];
    });

    it('calls #handlePresenceUpdate', function (done) {
      sinon.stub(this.streamingService, 'handlePresenceUpdate').returns(Rx.Observable.of(''));

      this.presenceUpdate$.subscribe(() => {}, (error) => done(error), () => {
        expect(this.streamingService.handlePresenceUpdate).to.have.been.called;
        done();
      });

      this.presenceUpdate$.onNext(this.eventPayload);
      this.presenceUpdate$.onCompleted();
    });

    it('passes the new and old members to #handlePresenceUpdate', function (done) {
      sinon.stub(this.streamingService, 'handlePresenceUpdate').returns(Rx.Observable.of(''));

      this.presenceUpdate$.subscribe(() => {}, (error) => done(error), () => {
        expect(this.streamingService.handlePresenceUpdate).to.have.been.calledWith(this.oldMember, this.newMember);
        done();
      });

      this.presenceUpdate$.onNext(this.eventPayload);
      this.presenceUpdate$.onCompleted();
    });
  });

  describe('#handlePresenceUpdate', function () {
    beforeEach(function () {
      this.guild = {id: 'testGuild'};

      this.oldMember = {
        name: "oldMember",
        guild: this.guild,
        presence: {}
      };

      this.newMember = {
        name: "newMember",
        guild: this.guild,
        presence: {},
        addRole: sinon.fake.resolves(''),
      };
    });

    context('when the user goes live', function () {
      beforeEach(function () {
        this.newMember.presence.game = {
          streaming: true,
        };
      });

      context('when there no role to assign', function () {
        beforeEach(function (done) {
          this.nix.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, null)
            .subscribe(() => {
            }, (error) => done(error), () => done());
        });

        it('assigns the role to the member', function (done) {
          this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember)
            .subscribe(
              () => {},
              (error) => done(error),
              () => {
                expect(this.newMember.addRole).not.to.have.been.called;
                done()
              }
            );
        });
      });

      context('when there is a role to assign', function () {
        beforeEach(function (done) {
          this.role = {id: 'role-00001', name: 'test-role'};
          this.nix.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, this.role.id)
            .subscribe(() => {}, (error) => done(error), () => done());
        });

        it('assigns the role to the member', function (done) {
          this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember)
            .subscribe(
              () => {},
              (error) => done(error),
              () => {
                expect(this.newMember.addRole).to.have.been.calledWith(this.role.id);
                done()
              }
            );
        });
      });
    });
  });

  describe('#getLiveRoleId', function () {
    beforeEach(function () {
      this.role = { id: 'role-00001', name: 'test-role' };
      this.guild = { id: 'guild-00001' };
    });

    context('when there is a role set', function() {
      beforeEach(function (done) {
        this.nix.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, this.role.id)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('returns the roleId to assign', function (done) {
        this.streamingService.getLiveRoleId(this.guild)
          .subscribe(
            (roleId) => this.returnedValue = roleId,
            (error) => done(error),
            () => {
              expect(this.returnedValue).to.eq(this.role.id);
              done();
            }
          );
      });
    });

    context('when there is no role set', function () {
      beforeEach(function (done) {
        this.nix.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, null)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('returns null', function (done) {
        this.streamingService.getLiveRoleId(this.guild)
          .subscribe(
            (roleId) => this.returnedValue = roleId,
            (error) => done(error),
            () => {
              expect(this.returnedValue).to.be.null;
              done();
            }
          );
      });
    });
  });
});
