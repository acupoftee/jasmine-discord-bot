const Rx = require('rx');
const Collection = require('discord.js').Collection;
const ConfigAction = require('nix-core/lib/models/config-action');

const StreamingService = require('../services/streaming-service');

describe('!config streaming setLiveRole', function () {
  beforeEach(function () {
    this.streamingService = new StreamingService();

    this.setLiveRole = new ConfigAction(require('./set-live-role'));
    this.setLiveRole.streamingService = this.streamingService;
  });

  describe('properties', function () {
    it('has the correct name', function () {
      expect(this.setLiveRole.name).to.eq('setLiveRole');
    });

    it('has a required rule input', function () {
      expect(this.setLiveRole.inputs).to.containSubset([{ name: 'role', required: true }]);
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
    });

    context('when role is missing', function () {
      beforeEach(function () {
        delete this.context.inputs.role;
      });

      it('returns a user readable error', function (done) {
        expect(this.setLiveRole.run(this.context))
          .to.emit([ { status: 400, content: `A role is to assign users is required` } ])
          .and.complete(done);
      });
    });

    context('when the role can not be found', function () {
      beforeEach(function () {
        this.context.inputs.role = "role-not-found";
      });

      it('returns a user readable error', function (done) {
        expect(this.setLiveRole.run(this.context))
          .to.emit([ { status: 400, content: `The role 'role-not-found' could not be found.` } ])
          .and.complete(done);
      });
    });

    context('when the role exists', function () {
      let roleId = '55500001';
      let roleName = 'testRole';

      beforeEach(function () {
        this.role = {
          id: roleId,
          name: roleName,
        };
        this.guild.roles.set(this.role.id, this.role);
      });

      Object.entries({
        'a mention': `<@${roleId}>`,
        'a mention (with &)': `<@&${roleId}>`,
        'an id': roleId,
        'a name': roleName,
      }).forEach(([inputType, value]) => {
        context(`when a role is given as ${inputType}`, function () {
          beforeEach(function () {
            this.context.inputs.role = value;
            sinon.stub(this.streamingService, 'setLiveRole').returns(Rx.Observable.of(this.role));
          });

          it('sets the live role to the correct role', function (done) {
            expect(this.setLiveRole.run(this.context))
              .and.complete(() => {
                expect(this.streamingService.setLiveRole).to.have.been.calledWith(this.guild, this.role);
                done();
              });
          });

          it('returns a success message', function (done) {
            expect(this.setLiveRole.run(this.context))
              .to.emit([ { status: 200, content: `Live streamers will now be given the ${this.role.name} role.` } ])
              .and.complete(done);
          });
        });
      });
    });
  });
});
