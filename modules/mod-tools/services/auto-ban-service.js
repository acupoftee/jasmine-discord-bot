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
  }
  
  doAutoBans(member) {
    return Rx.Observable
      .of('')
      .flatMap(() => this.isAutoBanEnabled(member.guild).filter(Boolean))
      .do(() => this.nix.logger.debug(`Checking if ${member.user.tag} should be auto banned...`))
      .flatMap(() =>
        Rx.Observable
          .merge([
            Rx.Observable.of('')
              .flatMap(() => this.isAutoBanUsernameWithLinksEnabled(member.guild).filter(Boolean))
              .flatMap(() => this.memberHasUsernameWithLink(member).filter(Boolean))
              .do(() => this.nix.logger.debug(`${member.user.tag}'s username contains a link`))
              .map(() => "Username contains a link"),
          ])
      )
      .filter((reason) => reason)
      .take(1)
      .do((reason) => this.nix.logger.debug(`Auto banning ${member.user.tag}; reason: ${reason}`))
      .flatMap((reason) => member.guild.ban(member, `Jasmine AutoBan: ${reason}`))
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
    let usernameWithLinkRegex = /discord\.gg\//;

    return Rx.Observable
      .of('')
      .map(() => {
        let name = member.nickname ? member.nickname : member.user.username;
        return !!name.match(usernameWithLinkRegex);
      })
  }

}

module.exports = AutoBanService;
