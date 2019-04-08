const Rx = require('rx');
const Collection = require('discord.js').Collection;
const ConfigAction = require('nix-core/lib/models/config-action');

const StreamingService = require('../../../../plugins/streaming/services/streaming-service');

describe('!config streaming setStreamerRole', function () {
  beforeEach(function () {
    this.jasmine = stubJasmine();

    this.streamingService = sinon.createStubInstance(StreamingService);
    this.jasmine.stubService('streaming', 'StreamingService', this.streamingService);

    this.setStreamerRole = new ConfigAction(require('../../../../plugins/streaming/config/set-streamer-role'));
    this.setStreamerRole.nix = this.jasmine;
  });

  describe('properties', function () {
    it('has the correct name', function () {
      expect(this.setStreamerRole.name).to.eq('setStreamerRole');
    });

    it('has a required rule input', function () {
      expect(this.setStreamerRole.inputs).to.containSubset([ { name: 'role', required: true } ]);
    });
  });

  describe('#configureAction', function () {
    it('gets ModuleService from Nix', function () {
      this.setStreamerRole.configureAction();
      expect(this.setStreamerRole.streamingService).to.eq(this.streamingService);
    });
  });

  describe('#run', function () {
    beforeEach(function () {
      this.setStreamerRole.configureAction();

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
        expect(this.setStreamerRole.run(this.context))
          .to.emit([ { status: 400, content: `A role to watch is required` } ])
          .and.complete(done);
      });
    });

    context('when the role can not be found', function () {
      beforeEach(function () {
        this.context.inputs.role = "role-not-found";
      });

      it('returns a user readable error', function (done) {
        expect(this.setStreamerRole.run(this.context))
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
      }).forEach(([ inputType, value ]) => {
        context(`when a role is given as ${inputType}`, function () {
          beforeEach(function () {
            this.context.inputs.role = value;
            this.streamingService.setStreamerRole.returns(Rx.Observable.of(this.role));
          });

          it('sets the live role to the correct role', function (done) {
            expect(this.setStreamerRole.run(this.context))
              .and.complete(() => {
                expect(this.streamingService.setStreamerRole).to.have.been.calledWith(this.guild, this.role);
                done();
              });
          });

          it('returns a success message', function (done) {
            expect(this.setStreamerRole.run(this.context))
              .to.emit([ {
                status: 200,
                content: `I will now only give the live role to users with the ${this.role.name} role`,
              } ])
              .and.complete(done);
          });
        });
      });
    });
  });
});
