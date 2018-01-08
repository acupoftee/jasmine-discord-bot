const util = require('util');
const Rx = require('rx');
const Discord = require('discord.js');

const {DATAKEYS} = require('../utility');

class ModLogService {
  constructor(nix) {
    this.nix = nix;
  }

  onNixListen() {
    this.nix.logger.debug('Adding listener for guildMemberAdd$ events');
    this.nix.streams.guildMemberAdd$
      .do((member) => this.nix.logger.debug(`User joined: ${member.displayName}`))
      .flatMap((member) => this.addUserJoinedEntry(member))
      .subscribe();

    this.nix.logger.debug('Adding listener for guildMemberRemove$ events');
    this.nix.streams.guildMemberRemove$
      .do((member) => this.nix.logger.debug(`User left: ${member.displayName}`))
      .flatMap((member) => this.addUserLeftEntry(member))
      .subscribe();

    this.nix.logger.debug('Adding listener for guildBanAdd$ events');
    this.nix.streams.guildBanAdd$
      .do(([guild, user]) => this.nix.logger.debug(`User banned: ${user.tag}`))
      .flatMap(([guild, user]) => this.addBanEntry(guild, user))
      .catch((error) => {
        console.log(error);
        return Rx.Observable.throw(error);
      })
      .subscribe();

    return Rx.Observable.of(true);
  }

  addUserJoinedEntry(member) {
    let modLogEmbed = new Discord.MessageEmbed();
    modLogEmbed
      .setAuthor(`${member.displayName} joined`, member.user.avatarURL())
      .setColor(Discord.Constants.Colors.GREEN)
      .setDescription(`User ID: ${member.id}`)
      .setTimestamp();

    return this.addAuditEntry(member.guild, modLogEmbed);
  }

  addUserLeftEntry(member) {
    let modLogEmbed = new Discord.MessageEmbed();
    modLogEmbed
      .setAuthor(`${member.displayName} left`, member.user.avatarURL())
      .setColor(Discord.Constants.Colors.GREY)
      .setDescription(`User ID: ${member.id}`)
      .setTimestamp();

    return this.addAuditEntry(member.guild, modLogEmbed);
  }

  addWarnEntry(guild, user) {
    let modLogEmbed = new Discord.MessageEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} warned`, user.avatarURL())
      .setColor(Discord.Constants.Colors.DARK_GOLD)
      .setDescription(`User ID: ${user.id}`)
      .setTimestamp();

    return this.addAuditEntry(guild, modLogEmbed);
  }

  addBanEntry(guild, user) {
    let modLogEmbed = new Discord.MessageEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} banned`, user.avatarURL())
      .setColor(Discord.Constants.Colors.DARK_RED)
      .setDescription(`User ID: ${user.id}`)
      .setTimestamp();

    return this.addAuditEntry(guild, modLogEmbed);
  }

  addUnbanEntry(guild, user) {
    let modLogEmbed = new Discord.MessageEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} unbanned`, user.avatarURL())
      .setColor(Discord.Constants.Colors.DARK_GREEN)
      .setDescription(`User ID: ${user.id}`)
      .setTimestamp();

    return this.addAuditEntry(guild, modLogEmbed);
  }

  addAuditEntry(guild, embed) {
    this.nix.logger.debug(`Adding audit entry: ${util.inspect(embed)}`);

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
}

module.exports = ModLogService;
