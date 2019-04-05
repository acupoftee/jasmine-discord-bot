const Rx = require('rx');
const Collection = require('discord.js').Collection;

describe('Feature: !region', function () {
  beforeEach(function (done) {
    this.jasmine = stubJasmine();

    this.guild = {
      id: '00001',
      name: 'TestGuild',
      roles: new Collection(),
    };

    this.user = {
      id: '00001',
    };

    this.member = {
      id: this.user.id,
      guild: this.guild,
      removeRoles: sinon.fake.resolves({}),
      addRole: sinon.fake.resolves({}),
      roles: new Collection(),
    };

    this.channel = {
      type: 'text',
      guild: this.guild,
      send: sinon.fake.resolves({}),
      permissionsFor: sinon.fake.returns({
        has: () => true,
      }),
    };

    this.message = {
      content: '!region test',
      channel: this.channel,
      guild: this.guild,
      member: this.member,
      author: this.user,
      reply: sinon.fake.resolves({}),
    };

    this.jasmine
      .listen(
        () => {},
        (error) => done(error),
      )
      .flatMap(() => {
        let moduleService = this.jasmine.getService('core', 'ModuleService');
        let commandService = this.jasmine.getService('core', 'CommandService');

        commandService.handleCmdError = (error) => Rx.Observable.throw(error);

        return Rx.Observable.of('')
          .flatMap(() => this.jasmine.onNixJoinGuild(this.guild))
          .flatMap(() => moduleService.enableModule(this.guild.id, 'ow-info'));
      })
      .subscribe(
        () => done(),
        (error) => done(error),
      );
  });

  afterEach(function (done) {
    if (this.jasmine.listening) {
      this.jasmine.shutdown(() => done(), (error) => done(error));
    } else {
      done();
    }
  });

  context('when the region arg is missing', function () {
    beforeEach(function () {
      this.message.content = `!region`;
    });

    it('responds with an error message', function (done) {
      this.jasmine.discord.emit('message', this.message);
      this.jasmine.shutdown()
        .map(() => {
          expect(this.channel.send).to.have.been.calledWith(
            `I'm sorry, but I'm missing some information for that command:`,
          );
        })
        .subscribe(() => done(), (error) => done(error));
    });
  });

  context('when the region is mapped to a role', function () {
    beforeEach(function (done) {
      this.role = {
        id: 'role-0001',
      };

      this.guild.roles.set(this.role.id, this.role);

      let regionService = this.jasmine.getService('ow-info', 'RegionService');
      regionService.mapRegion(this.guild, 'test', this.role)
        .subscribe(() => done(), (error) => done(error));
    });

    it('adds the role to the user', function (done) {
      this.jasmine.discord.emit('message', this.message);
      this.jasmine.shutdown()
        .map(() => {
          expect(this.message.reply).to.have.been.calledWith(
            'I\'ve updated your region to test',
          );
          expect(this.member.addRole).to.have.been.calledWith(
            this.role,
          );
        })
        .subscribe(() => done(), (error) => done(error));
    });
  });

  context('when the region is not mapped to a role', function () {
    it('returns an error message', function (done) {
      this.jasmine.discord.emit('message', this.message);
      this.jasmine.shutdown()
        .do(() => expect(this.channel.send).to.have.been.calledWith(
          'I\'m sorry, but \'test\' is not an available region.',
        ))
        .do(() => expect(this.member.addRole).not.to.have.been.called)
        .subscribe(() => done(), (error) => done(error));
    });
  });
});
