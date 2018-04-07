const Rx = require('rx');
const Discord = require('discord.js');

const AuditLogActions = Discord.GuildAuditLogs.Actions;

const {
  ERRORS,
  LOG_TYPES,
} = require('../utility');

class ModLogService {
  constructor(nix) {
    this.nix = nix;
  }

  onNixListen() {
    this.nix.logger.debug('Adding listener for guildMemberAdd$ events');
    this.nix.streams
      .guildMemberAdd$
      .do((member) => this.nix.logger.debug(`User ${member.user.tag} joined ${member.guild.id}`))
      .flatMap((member) => this.addUserJoinedEntry(member))
      .subscribe();

    this.nix.logger.debug('Adding listener for guildMemberRemove$ events');
    this.nix.streams
      .guildMemberRemove$
      .flatMap((member) =>
        //filter out members who are banned
        Rx.Observable
          .fromPromise(member.guild.fetchBans())
          .map((bans) => bans.get(member.id))
          .filter((bannedUser) => !bannedUser)
          .map(member)
          .catch(() => Rx.Observable.of(member)) //Error occurred while trying to fetch bans, just continue anyway.
      )
      .do((member) => this.nix.logger.debug(`User ${member.user.tag} left ${member.guild.id}`))
      .flatMap((member) => this.addUserLeftEntry(member))
      .subscribe();

    this.nix.logger.debug('Adding listener for guildBanAdd$ events');
    this.nix.streams
      .guildBanAdd$
      .flatMap(([guild, user]) =>
        this.findReasonAuditLog(guild, user, { type: AuditLogActions.MEMBER_BAN_ADD })
          // Filter out bans by Jasmine, they have already been logged
          .filter((log) => log.executor.id !== this.nix.discord.user.id)
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
          // Add the log to the returned data
          .map((log) => [guild, user, log])
      )
      .do(([guild, user, log]) => this.nix.logger.debug(`ModLog: User ${user.tag} banned in ${guild.id} for reason: ${log.reason}`))
      .flatMap(([guild, user, log]) => this.addBanEntry(guild, user, log.reason, log.executor))
      .catch((error) => {
        this.nix.logger.error(error);
        return Rx.Observable.throw(error);
      })
      .subscribe();

    this.nix.logger.debug('Adding listener for guildBanRemove$ events');
    this.nix.streams
      .guildBanRemove$
      .flatMap(([guild, user]) =>
        this.findReasonAuditLog(guild, user, {type: AuditLogActions.MEMBER_BAN_REMOVE })
          // Filter out bans by Jasmine, they have already been logged
          .filter((log) => log.executor.id !== this.nix.discord.user.id)
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
          .map(() => [guild, user])
      )
      .do(([guild, user]) => this.nix.logger.debug(`ModLog: User ${user.tag} unbanned in ${guild.id}`))
      .flatMap(([guild, user, log]) => this.addUnbanEntry(guild, user, log.executor))
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
      .setColor(Discord.Constants.Colors.AQUA)
      .setDescription(`User ID: ${member.id}`)
      .setTimestamp();

    return this.addLogEntry(member.guild, modLogEmbed, "JoinLog");
  }

  addUserLeftEntry(member) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${member.displayName} left`, member.user.avatarURL)
      .setColor(Discord.Constants.Colors.GREY)
      .setDescription(`User ID: ${member.id}`)
      .setTimestamp();

    return this.addLogEntry(member.guild, modLogEmbed, "JoinLog");
  }

  addWarnEntry(guild, user, reason, moderator) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} warned`, user.avatarURL)
      .setColor(Discord.Constants.Colors.DARK_GOLD)
      .setDescription(`User ID: ${user.id}\nReason: ${reason || '`None`'}`)
      .addField('Moderator:', moderator ? `${moderator.tag}\nID: ${moderator.id}` : '`unknown`')
      .setTimestamp();

    return this.addLogEntry(guild, modLogEmbed, "ModLog");
  }

  addBanEntry(guild, user, reason, moderator) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} banned`, user.avatarURL)
      .setColor(Discord.Constants.Colors.DARK_RED)
      .setDescription(`User ID: ${user.id}\nReason: ${reason || '`None`'}`)
      .addField('Moderator:', moderator ? `${moderator.tag}\nID: ${moderator.id}` : '`unknown`')
      .setTimestamp();

    return this.addLogEntry(guild, modLogEmbed, "ModLog");
  }

  addUnbanEntry(guild, user, moderator) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} unbanned`, user.avatarURL)
      .setColor(Discord.Constants.Colors.DARK_GREEN)
      .setDescription(`User ID: ${user.id}`)
      .addField('Moderator:', moderator ? `${moderator.tag}\nID: ${moderator.id}` : '`unknown`')
      .setTimestamp();

    return this.addLogEntry(guild, modLogEmbed, "ModLog");
  }

  addLogEntry(guild, embed, logTypeName) {
    this.nix.logger.debug(`Adding mod log entry`);

    let logType = this.getLogType(logTypeName);
    if (!logType) { throw new Error(ERRORS.INVALID_LOG_TYPE); }

    return this.nix.dataService
      .getGuildData(guild.id, logType.channelDatakey)
      .filter((channelId) => typeof channelId !== 'undefined')
      .map((channelId) => guild.channels.find("id", channelId))
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

  getLogType(name) {
    return LOG_TYPES.find((type) => type.name.toLowerCase() === name.toLowerCase());
  }

  findReasonAuditLog(guild, target, options) {
    return Rx.Observable.of('')
      .flatMap(() => {
        let error = new Error("Test error");
        error.name = "TargetMatchError";
        return Rx.Observable.throw(error);
      })
      .flatMap(() => this.getLatestAuditLogs(guild, {...options, limit: 1}))
      .map((auditEntry) => {
        if (auditEntry.target.id !== target.id) {
          let error = new Error("Audit log entry does not match the target");
          error.name = "TargetMatchError";
          throw error;
        }
        return auditEntry;
      })
      .retryWhen((error$) => {
        return Rx.Observable.range(1, 3)
          .zip(error$)
          .flatMap(([attempt, error]) => {
            console.log(attempt, error);
            if (attempt === 3) {
              return Rx.Observable.throw(error);
            }
            if (error.name === "TargetMatchError") {
              return Rx.Observable.timer(500);
            }
            return Rx.Observable.throw(error);
          });
      });
  }

  getLatestAuditLogs(guild, options) {
    let filter = Object.assign({
      limit: 1,
    }, options);

    let canViewAuditLog = guild.member(this.nix.discord.user).hasPermission(Discord.Permissions.FLAGS.VIEW_AUDIT_LOG);
    if (!canViewAuditLog) {
      return Rx.Observable.from([
        {
          executor: {id: null},
          reason: 'ERROR: Unable to view audit log.',
        },
      ]);
    }

    return Rx.Observable
      .fromPromise(guild.fetchAuditLogs(filter))
      .flatMap((logs) => Rx.Observable.from(logs.entries.array()));
  }
}

module.exports = ModLogService;
