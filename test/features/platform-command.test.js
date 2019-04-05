const Rx = require('rx');
const Collection = require('discord.js').Collection;

const platforms = require('./../../plugins/ow-info/data/platforms');

describe('Feature: !platform', function () {
  beforeEach(function (done) {
    this.jasmine = stubJasmine();

    this.guild = {
      id: '00001',
      name: 'TestGuild',
      roles: new Collection(),
    };

    this.user = {
      id: '00001',
      username: 'TestUser',
    };

    this.member = {
      id: this.user.id,
      user: this.user,
      setNickname: sinon.fake.resolves({}),
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
      content: '!platform',
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

  context('when the platform arg is missing', function() {
    beforeEach(function () {
      this.message.content = `!platform`;
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

  platforms.forEach(({name, tag, alias}) => {
    context(`when the platform is ${name}`, function () {
      beforeEach(function () {
        this.message.content = `!platform ${name}`;
      });

      it(`responds with a success message`, function (done) {
        this.jasmine.discord.emit('message', this.message);
        this.jasmine.shutdown()
          .map(() => {
            expect(this.message.reply).to.have.been.calledWith(
              `I've updated your platform to ${name}`,
            );
          })
          .subscribe(() => done(), (error) => done(error));
      });

      it(`adds the tag [${tag}] to the username`, function (done) {
        this.jasmine.discord.emit('message', this.message);
        this.jasmine.shutdown()
          .map(() => {
            expect(this.member.setNickname).to.have.been.calledWith(
              `TestUser [${tag}]`,
            );
          })
          .subscribe(() => done(), (error) => done(error));
      });

      alias.forEach((alias) => {
        context(`when the platform is given as ${alias}`, function () {
          beforeEach(function () {
            this.message.content = `!platform ${alias}`;
          });

          it(`sets the platform tag to [${tag}]`, function (done) {
            this.jasmine.discord.emit('message', this.message);
            this.jasmine.shutdown()
              .map(() => {
                expect(this.member.setNickname).to.have.been.calledWith(
                  `TestUser [${tag}]`,
                );
              })
              .subscribe(() => done(), (error) => done(error));
          });
        });
      });

      context('when the user has a nickname', function() {
        beforeEach(function () {
          this.member.nickname = "UserNickname";
        });

        it(`adds the tag [${tag}] to the nickname`, function (done) {
          this.jasmine.discord.emit('message', this.message);
          this.jasmine.shutdown()
            .map(() => {
              expect(this.member.setNickname).to.have.been.calledWith(
                `UserNickname [${tag}]`,
              );
            })
            .subscribe(() => done(), (error) => done(error));
        });
      });
    });
  });

  context('when the user has a tag', function () {
    beforeEach(function () {
      this.message.content = `!platform PC`;
      this.member.nickname = "UserNickname [NULL]";
    });

    it(`replaces the tag`, function (done) {
      this.jasmine.discord.emit('message', this.message);
      this.jasmine.shutdown()
        .map(() => {
          expect(this.member.setNickname).to.have.been.calledWith(
            `UserNickname [PC]`,
          );
        })
        .subscribe(() => done(), (error) => done(error));
    });
  });
});
