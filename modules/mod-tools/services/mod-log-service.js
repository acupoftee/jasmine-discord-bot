const util = require('util');
const Rx = require('rx');
const Discord = require('discord.js');

const {DATAKEYS} = require('../utility');

class ModLogService {
  constructor(nix) {
    this.nix = nix;
  }

  onNixListen() {
    this.nix.streams.guildMemberAdd$
      .do((member) => this.nix.logger.debug(`User joined: ${member.displayName}`))
      .flatMap((member) => this.addUserJoinedEntry(member))
      .subscribe();

    this.nix.streams.guildMemberRemove$
      .do((member) => this.nix.logger.debug(`User left: ${member.displayName}`))
      .flatMap((member) => this.addUserLeftEntry(member))
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

  addWarnEntry(guild, user, warnedBy, reason) {
    let modLogEmbed = new Discord.MessageEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} warned`, user.avatarURL())
      .setColor(Discord.Constants.Colors.DARK_GOLD)
      .setDescription(`User ID: ${user.id}`)
      .addField('Warned By', warnedBy)
      .addField('Reason', reason || '`none given`')
      .setTimestamp();

    return this.addAuditEntry(guild, modLogEmbed);
  }

  addBanEntry(guild, user, bannedBy, reason) {
    let prefix = this.nix.commandService.getPrefix(guild.id);
    let unbanCmd = `${prefix}unban ${user.id}`;

    let modLogEmbed = new Discord.MessageEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} banned`, user.avatarURL())
      .setColor(Discord.Constants.Colors.DARK_RED)
      .setDescription(`User ID: ${user.id}`)
      .addField('Banned By', bannedBy)
      .addField('Reason', reason || '`none given`')
      .addField('Unban command', '```' + unbanCmd + '```')
      .setTimestamp();

    return this.addAuditEntry(guild, modLogEmbed);
  }

  addUnbanEntry(guild, user, unbannedBy) {
    let modLogEmbed = new Discord.MessageEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} unbanned`, user.avatarURL())
      .setColor(Discord.Constants.Colors.DARK_GREEN)
      .setDescription(`User ID: ${user.id}`)
      .addField('Unbanned By', unbannedBy)
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
