const util = require('util');
const Rx = require('rx');

const {DATAKEYS} = require('../utility');

const Discord = require('discord.js');

class ModLogService {
  constructor(nix) {
    this.nix = nix;
  }

  onNixListen() {
    this.nix.streams.guildMemberAdd$
      .flatMap((guildMember) => {
        this.nix.logger.debug(`User joined: ${guildMember.displayName}`);

        let modLogEmbed = new Discord.RichEmbed();
        modLogEmbed
          .setAuthor(`${guildMember.displayName} joined`, guildMember.user.avatarURL())
          .setColor(Discord.Constants.Colors.GREEN)
          .setDescription(`User ID: ${guildMember.id}`)
          .setTimestamp();

        return this.addAuditEntry(guildMember.guild, modLogEmbed);
      })
      .catch((error) => console.error(error))
      .subscribe();

    this.nix.streams.guildMemberRemove$
      .flatMap((guildMember) => {
        this.nix.logger.debug(`User left: ${guildMember.displayName}`);

        let modLogEmbed = new Discord.RichEmbed();
        modLogEmbed
          .setAuthor(`${guildMember.displayName} left`, guildMember.user.avatarURL())
          .setColor(Discord.Constants.Colors.GREY)
          .setDescription(`User ID: ${guildMember.id}`)
          .setTimestamp();

        return this.addAuditEntry(guildMember.guild, modLogEmbed);
      })
      .catch((error) => console.error(error))
      .subscribe();

    return Rx.Observable.of(true);
  }

  addAuditEntry(guild, embed) {
    this.nix.logger.debug(`Adding audit entry: ${util.inspect(embed)}`);

    return this.nix.dataService
      .getGuildData(guild.id, DATAKEYS.MOD_LOG_CHANNEL)
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
