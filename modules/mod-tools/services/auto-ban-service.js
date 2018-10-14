const Rx = require('rx');

const Service = require('nix-core').Service;

const {DATAKEYS} = require('../utility');

class AutoBanService extends Service {
  configureService() {
    this.dataService = this.nix.getService('core', 'dataService');
  }

  onNixListen() {
    this.nix.streams.guildMemberAdd$
      .flatMap((member) => this.doAutoBans(member))
      .catch((error) => {
        this.nix.handleError(error, [
          {name: "Service", value: "AutoBanService"},
          {name: "Hook", value: "guildMemberAdd$"},
        ]);
        return Rx.Observable.empty();
      })
      .subscribe();

    this.nix.streams.guildMemberUpdate$
      .flatMap(([oldMember, newMember]) => this.doAutoBans(newMember))
      .catch((error) => {
        this.nix.handleError(error, [
          {name: "Service", value: "AutoBanService"},
          {name: "Hook", value: "guildMemberUpdate$"},
        ]);
        return Rx.Observable.empty();
      })
      .subscribe();
  }
  
  doAutoBans(member) {
    return Rx.Observable
      .of('')
      .flatMap(() => this.isAutoBanEnabled(member.guild).filter(Boolean))
      .do(() => this.nix.logger.info(`Checking if ${member.user.tag} should be auto banned...`))
      .flatMap(() =>
        Rx.Observable
          .merge([
            Rx.Observable.of('')
              .flatMap(() => this.isAutoBanUsernameWithLinksEnabled(member.guild).filter(Boolean))
              .flatMap(() => this.memberHasUsernameWithLink(member).filter(Boolean))
              .map(() => "Username contains a link"),
          ])
      )
      .filter((reason) => reason)
      .take(1)
      .do((reason) => this.nix.logger.info(`Auto banning ${member.user.tag}; reason: ${reason}`))
      .flatMap((reason) =>
        member.guild.ban(member, {
          days: 1,
          reason: `Jasmine AutoBan: ${reason}`,
        })
      )
  }

  isAutoBanEnabled(guild) {
    return this.dataService
      .getGuildData(guild.id, DATAKEYS.AUTO_BAN_ENABLED)
  }

  isAutoBanUsernameWithLinksEnabled(guild) {
    return this.dataService
      .getGuildData(guild.id, DATAKEYS.AUTO_BAN_USERNAME_HAS_LINK)
  }

  memberHasUsernameWithLink(member) {
    let usernameWithLinkRegex = /discord\.gg[\/\\]/;

    return Rx.Observable
      .of('')
      .map(() => {
        this.nix.logger.debug(`${member.user.tag} has username: ${member.user.username}`);

        let usernameHasLink = !!member.user.username.match(usernameWithLinkRegex);
        let nicknameHasLink = false;

        if (member.nickname) {
          this.nix.logger.debug(`${member.user.tag} has nickname: ${member.nickname}`);
          nicknameHasLink = !!member.nickname.match(usernameWithLinkRegex);
        }

        let hasLink = usernameHasLink || nicknameHasLink;
        this.nix.logger.info(`${member.user.tag} has link in username: ${hasLink}`);

        return hasLink
      })
  }

}

module.exports = AutoBanService;
