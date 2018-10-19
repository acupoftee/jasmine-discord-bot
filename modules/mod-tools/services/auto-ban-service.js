const Rx = require('rx');
const Service = require('nix-core').Service;

const {
  RuleNotFoundError,
} = require("../errors");
const {
  DATAKEYS,
  AUTO_BAN_RULES,
} = require('../utility');

class AutoBanService extends Service {
  configureService() {
    this.dataService = this.nix.getService('core', 'dataService');
  }

  onNixListen() {
    this.nix.streams.guildMemberAdd$
      .flatMap((member) =>
        this.doAutoBans(member)
          .catch((error) => {
            error.member = member;
            return Rx.Observable.throw(error);
          })
      )
      .catch((error) => {
        this.nix.handleError(error, [
          {name: "Service", value: "AutoBanService"},
          {name: "Hook", value: "guildMemberAdd$"},
          {name: "Member", value: error.member.toString()},
          {name: "Guild", value: error.member.guild.toString()},
        ]);
        return Rx.Observable.empty();
      })
      .subscribe();

    this.nix.streams.guildMemberUpdate$
      .flatMap(([oldMember, newMember]) =>
        this.doAutoBans(newMember)
          .catch((error) => {
            error.member = newMember;
            return Rx.Observable.throw(error);
          })
      )
      .catch((error) => {
        this.nix.handleError(error, [
          {name: "Service", value: "AutoBanService"},
          {name: "Hook", value: "guildMemberUpdate$"},
          {name: "Member", value: error.member.toString()},
          {name: "Guild", value: error.member.guild.toString()},
        ]);
        return Rx.Observable.empty();
      })
      .subscribe();
  }

  getAutoBanRule(rule) {
    let foundRule = Object.values(AUTO_BAN_RULES).find((r) => r.toLowerCase() === rule.toLowerCase());
    if (!foundRule) {
      return new RuleNotFoundError(rule);
    }
    return foundRule;
  }

  setAutoBansEnabled(guild, newValue) {
    return this.dataService
      .setGuildData(guild.id, DATAKEYS.AUTO_BAN_ENABLED, newValue)
  }

  setAutoBanRule(guild, rule, newValue) {
    rule = this.getAutoBanRule(rule);

    return this.dataService
      .setGuildData(guild.id, DATAKEYS.AUTO_BAN_RULE(rule), newValue)
      .map((enabled) => ([rule, enabled]))
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
              .flatMap(() => this.isAutoBanRuleEnabled(member.guild, AUTO_BAN_RULES.BAN_DISCORD_INVITE).filter(Boolean))
              .filter(() => this.memberHasDiscordInvite(member))
              .map(() => "Username contains or was changed to a Discord invite"),
            Rx.Observable.of('')
              .flatMap(() => this.isAutoBanRuleEnabled(member.guild, AUTO_BAN_RULES.BAN_TWITCH_LINK).filter(Boolean))
              .filter(() => this.memberHasTwitchLink(member))
              .map(() => "Username contains or was changed to a Twitch link"),
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

  isAutoBanRuleEnabled(guild, rule) {
    rule = this.getAutoBanRule(rule);

    return this.dataService
      .getGuildData(guild.id, DATAKEYS.AUTO_BAN_RULE(rule))
  }

  getRules(guild) {
    return Rx.Observable
      .from(Object.values(AUTO_BAN_RULES))
      .flatMap((rule) => this.isAutoBanRuleEnabled(guild, rule).map((enabled) => [rule, enabled]))
      .reduce((rules, [rule, enabled]) => {
        rules[rule] = enabled;
        return rules;
      }, {})
  }

  memberHasDiscordInvite(member) {
    return this.memberNameMatches(member, /discord\.gg[\/\\]/);
  }

  memberHasTwitchLink(member) {
    return this.memberNameMatches(member, /twitch\.tv[\/\\]/);
  }

  memberNameMatches(member, regex) {
    // check username
    let usernameHasLink = !!member.user.username.match(regex);

    // check nickname if there is one
    let nicknameHasLink = false;
    if (member.nickname) {
      nicknameHasLink = !!member.nickname.match(regex);
    }

    return usernameHasLink || nicknameHasLink;
  }
}

module.exports = AutoBanService;
