const util = require('util');
const Rx = require('rx');
const Discord = require('discord.js');

const {DATAKEYS} = require('../utility');

class ModLogService {
  constructor(nix) {
    this.nix = nix;
    this.justBanned = {};
  }

  onNixListen() {
    this.nix.logger.debug('Adding listener for guildMemberAdd$ events');
    this.nix.streams.guildMemberAdd$
      .do((member) => this.nix.logger.debug(`User joined: ${member.displayName}`))
      .flatMap((member) => this.addUserJoinedEntry(member))
      .subscribe();

    this.nix.logger.debug('Adding listener for guildMemberRemove$ events');
    this.nix.streams.guildMemberRemove$
      .flatMap((member) => {
        if (this.justBanned[`${member.id}:${member.guild.id}`]) {
          this.justBanned[`${user.id}:${guild.id}`] = false;
          return Rx.Observable.empty();
        }
        return Rx.Observable.of(member);
      })
      .do((member) => this.nix.logger.debug(`User left: ${member.displayName}`))
      .flatMap((member) => this.addUserLeftEntry(member))
      .subscribe();

    this.nix.logger.debug('Adding listener for guildBanAdd$ events');
    this.nix.streams.guildBanAdd$
      .do(([guild, user]) => this.nix.logger.debug(`User banned: ${user.tag}`))
      .do(([guild, user]) => this.justBanned[`${user.id}:${guild.id}`] = true)
      .flatMap(([guild, user]) => this.addBanEntry(guild, user))
      .catch((error) => {
        this.nix.logger.error(error);
        return Rx.Observable.throw(error);
      })
      .subscribe();

    this.nix.logger.debug('Adding listener for guildBanRemove$ events');
    this.nix.streams.guildBanRemove$
      .do(([guild, user]) => this.nix.logger.debug(`User unbanned: ${user.tag}`))
      .flatMap(([guild, user]) => this.addUnbanEntry(guild, user))
      .catch((error) => {
        this.nix.logger.error(error);
        return Rx.Observable.throw(error);
      })
      .subscribe();

    return Rx.Observable.of(true);
  }

  addUserJoinedEntry(member) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${member.displayName} joined`, member.user.avatarURL)
      .setColor(Discord.Constants.Colors.GREEN)
      .setDescription(`User ID: ${member.id}`)
      .setTimestamp();

    return this.addAuditEntry(member.guild, modLogEmbed);
  }

  addUserLeftEntry(member) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${member.displayName} left`, member.user.avatarURL)
      .setColor(Discord.Constants.Colors.GREY)
      .setDescription(`User ID: ${member.id}`)
      .setTimestamp();

    return this.addAuditEntry(member.guild, modLogEmbed);
  }

  addWarnEntry(guild, user) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} warned`, user.avatarURL)
      .setColor(Discord.Constants.Colors.DARK_GOLD)
      .setDescription(`User ID: ${user.id}`)
      .setTimestamp();

    return this.addAuditEntry(guild, modLogEmbed);
  }

  addBanEntry(guild, user) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} banned`, user.avatarURL)
      .setColor(Discord.Constants.Colors.DARK_RED)
      .setDescription(`User ID: ${user.id}`)
      .setTimestamp();

    return this.addAuditEntry(guild, modLogEmbed);
  }

  addUnbanEntry(guild, user) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} unbanned`, user.avatarURL)
      .setColor(Discord.Constants.Colors.DARK_GREEN)
      .setDescription(`User ID: ${user.id}`)
      .setTimestamp();

    return this.addAuditEntry(guild, modLogEmbed);
  }

  addAuditEntry(guild, embed) {
    this.nix.logger.debug(`Adding mod log entry`);

    return this.nix.dataService
      .getGuildData(guild.id, DATAKEYS.MOD_LOG_CHANNEL)
      .filter((channelId) => typeof channelId !== 'undefined')
      .map((channelId) => guild.channels.find("id", channelId))
      .filter((channel) => typeof channel !== 'undefined')
      .flatMap((channel) => channel.send({embed}))
      .catch((error) => {
        if (error.name === 'DiscordAPIError') {
          if (error.message === "Missing Access" || error.message === "Missing Permissions") {
            // Bot does not have permission to send messages, we can ignore.
            return Rx.Observable.empty();
          }
        }

        // Error was not handled, rethrow it
        return Rx.Observable.throw(error);
      })
      .map(true)
      .defaultIfEmpty(true);
  }

  getLatestAuditLogs(guild, options) {
    let filter = Object.assign({
      limit: 1,
    }, options);

    return Rx.Observable
      .fromPromise(guild.fetchAuditLogs(filter))
      .flatMap((logs) => Rx.Observable.from(logs.entries.array()));
  }
}

module.exports = ModLogService;
