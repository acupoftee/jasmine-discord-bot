const Rx = require('rx');
const Discord = require('discord.js');

const AuditLogActions = Discord.GuildAuditLogs.Actions;

const {
  DATAKEYS,
  NET_MOD_LOG_TOKEN,
} = require('../utility');

class NetModLogService {
  constructor(nix) {
    this.nix = nix;
  }

  onNixListen() {
    this.nix.logger.debug('Adding listener for netModLog guildBanAdd$ events');
    this.nix.streams
      .guildBanAdd$
      .flatMap(([guild, user]) => {
        let modLogService = this.nix.getService('modTools', 'ModLogService');

        return modLogService
          .findReasonAuditLog(guild, user, {type: AuditLogActions.MEMBER_BAN_ADD})
          .catch((error) => {
            switch (error.name) {
              case "TargetMatchError":
                return Rx.Observable.of({
                  executor: {id: null},
                  reason: `ERROR: Unable to find matching log entry`
                });
              case "AuditLogReadError":
                return Rx.Observable.of({
                  executor: {id: null},
                  reason: `ERROR: ${error.message}`
                });
              default:
                return Rx.Observable.throw(error);
            }
          })
          .map((log) => [guild, user, log]);
      })
      .map(([guild, user, log]) => {
        if (log.executor.id === this.nix.discord.user.id) {
          //if the ban was by Jasmine, strip the moderator from the reason
          log = {
            ...log,
            reason: log.reason.replace(/\| Banned.*$/, '')
          };
        }
        return [guild, user, log];
      })
      .do(([guild, user, log]) => this.nix.logger.debug(`NetModLog: User ${user.tag} banned in ${guild.id} for reason: ${log.reason}`))
      .flatMap(([guild, user, log]) => this.addBanEntry(guild, user, log.reason))
      .catch((error) => {
        this.nix.logger.error(error);
        return Rx.Observable.throw(error);
      })
      .subscribe();

    this.nix.logger.debug('Adding listener for netModLog guildBanRemove$ events');
    this.nix.streams
      .guildBanRemove$
      .do(([guild, user]) => this.nix.logger.debug(`NetModLog: User ${user.tag} unbanned in ${guild.id}`))
      .flatMap(([guild, user]) => this.addUnbanEntry(guild, user))
      .catch((error) => {
        this.nix.logger.error(error);
        return Rx.Observable.throw(error);
      })
      .subscribe();

    return Rx.Observable.of(true);
  }

  addBanEntry(guild, user, reason) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} banned from ${guild.name}`, user.avatarURL)
      .setColor(Discord.Constants.Colors.DARK_RED)
      .setDescription(`User ID: ${user.id}\nReason: ${reason || '`None`'}`)
      .setTimestamp();

    return this.addAuditEntry(guild, modLogEmbed);
  }

  addUnbanEntry(guild, user) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} unbanned from ${guild.name}`, user.avatarURL)
      .setColor(Discord.Constants.Colors.DARK_GREEN)
      .setDescription(`User ID: ${user.id}`)
      .setTimestamp();

    return this.addAuditEntry(guild, modLogEmbed);
  }

  addAuditEntry(fromGuild, embed) {
    this.nix.logger.debug(`Adding network mod log entry`);

    return Rx.Observable.from(this.nix.discord.guilds.array())
      .flatMap((netGuild) =>
        this.nix.dataService
          .getGuildData(netGuild.id, DATAKEYS.NET_MOD_LOG_TOKEN)
          .filter((token) => token === NET_MOD_LOG_TOKEN)
          .map(netGuild)
      )
      .flatMap((netGuild) =>
        this.nix.dataService
          .getGuildData(netGuild.id, DATAKEYS.NET_MOD_LOG)
          .map((channelId) => netGuild.channels.find("id", channelId))
      )
      .filter((channel) => channel !== null)
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

    let canViewAuditLog = guild.member(this.nix.discord.user).hasPermission(Discord.Permissions.FLAGS.VIEW_AUDIT_LOG);
    if (!canViewAuditLog) {
      return Rx.Observable.from([
        {
          executor: { id: null },
          reason: 'ERROR: Unable to view audit log.',
        },
      ]);
    }

    return Rx.Observable
      .fromPromise(guild.fetchAuditLogs(filter))
      .flatMap((logs) => Rx.Observable.from(logs.entries.array()));
  }
}

module.exports = NetModLogService;
