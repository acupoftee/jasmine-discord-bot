const Rx = require('rx');

const {MockMessage} = require('../mocks/discord-mocks');

describe('Feature: !region', function () {
  beforeEach(function (done) {
    this.jasmine = stubJasmine();

    this.message = new MockMessage();

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
          .flatMap(() => this.jasmine.onNixJoinGuild(this.message.guild))
          .flatMap(() => moduleService.enableModule(this.message.guild.id, 'ow-info'));
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
          expect(this.message.channel.send).to.have.been.calledWith(
            `I'm sorry, but I'm missing some information for that command:`,
          );
        })
        .subscribe(() => done(), (error) => done(error));
    });
  });

  context('when the region is mapped to a role', function () {
    beforeEach(function (done) {
      this.message.content = `!region test`;

      this.role = {
        id: 'role-0001',
      };

      this.message.guild.roles.set(this.role.id, this.role);

      let regionService = this.jasmine.getService('ow-info', 'RegionService');
      regionService.mapRegion(this.message.guild, 'test', this.role)
        .subscribe(() => done(), (error) => done(error));
    });

    it('adds the role to the user', function (done) {
      this.jasmine.discord.emit('message', this.message);
      this.jasmine.shutdown()
        .map(() => {
          expect(this.message.reply).to.have.been.calledWith(
            'I\'ve updated your region to test',
          );
          expect(this.message.member.addRole).to.have.been.calledWith(
            this.role,
          );
        })
        .subscribe(() => done(), (error) => done(error));
    });
  });

  context('when the region is not mapped to a role', function () {
    beforeEach(function () {
      this.message.content = `!region test`;
    });

    it('returns an error message', function (done) {
      this.jasmine.discord.emit('message', this.message);
      this.jasmine.shutdown()
        .do(() => expect(this.message.channel.send).to.have.been.calledWith(
          'I\'m sorry, but \'test\' is not an available region.',
        ))
        .do(() => expect(this.message.member.addRole).not.to.have.been.called)
        .subscribe(() => done(), (error) => done(error));
    });
  });
});
