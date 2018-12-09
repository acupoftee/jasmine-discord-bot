const Rx = require('rx');
const Service = require('nix-core').Service;
const DiscordAPIError = require('discord.js').DiscordAPIError;

const DATAKEYS = require('../lib/datakeys');
const { RoleNotFoundError } = require('../lib/errors');

class StreamingService extends Service {
  configureService() {
    this.moduleService = this.nix.getService('core', 'ModuleService');
  }

  onNixListen() {
    this.nix.streams
      .presenceUpdate$
      .flatMap((eventData) => {
        let [_, newMember] = eventData;
        return this.moduleService
          .filterModuleEnabled(newMember.guild.id, 'streaming')
          .map(() => eventData)
      })
      .flatMap(([ oldMember, newMember ]) => this.handlePresenceUpdate(oldMember, newMember))
      .subscribe();
  }

  handlePresenceUpdate(oldMember, newMember) {
    return Rx.Observable
      .of('')
      .flatMap(() => this.getLiveRole(newMember.guild))
      .filter((liveRole) => liveRole)
      .flatMap((liveRole) => {
        let isStreaming = this.memberIsStreaming(newMember);

        if (isStreaming && !newMember.roles.has(liveRole.id)) {
          return Rx.Observable.of('')
            .do(() => this.nix.logger.debug(`User has gone live, adding role ${liveRole.name}`))
            .flatMap(() => newMember.addRole(liveRole));
        } else if (!isStreaming && newMember.roles.has(liveRole.id)) {
          return Rx.Observable.of('')
            .do(() => this.nix.logger.debug(`User has gone offline, removing role ${liveRole.name}`))
            .flatMap(() => newMember.removeRole(liveRole));
        } else {
          return Rx.Observable.empty();
        }
      })
      .catch((error) => {
        if (error instanceof DiscordAPIError) {
          switch (error.message) {
            case 'Missing Permissions':
              return Rx.Observable.empty();
            default:
              break;
          }
        }

        return this.nix.handleError(error, [
          { name: "Service", value: "StreamingService" },
          { name: "Hook", value: "presenceUpdate$" },
          { name: "Guild", value: newMember.guild.toString() },
          { name: "Member", value: newMember.toString() },
        ]).ignoreElements();
      });
  }

  setLiveRole(guild, role) {
    return this.nix.setGuildData(guild.id, DATAKEYS.LIVE_ROLE, role ? role.id : null)
      .flatMap(() => this.getLiveRole(guild));
  }

  getLiveRole(guild) {
    return this.nix.getGuildData(guild.id, DATAKEYS.LIVE_ROLE)
      .map((roleId) => guild.roles.get(roleId));
  }

  removeLiveRole(guild) {
    return this.getLiveRole(guild)
      .flatMap((oldRole) => this.setLiveRole(guild, null).map(() => oldRole));
  }

  /**
   * Checks if a member is streaming a game
   *
   * @param member {GuildMember}
   * @return {Boolean} true, if the member is streaming
   */
  memberIsStreaming(member) {
    let presence = member.presence;
    if (!presence.game) {
      return false;
    } else {
      return presence.game.streaming;
    }
  }

  setStreamerRole(guild, role) {
    return this.nix.setGuildData(guild.id, DATAKEYS.STREAMER_ROLE, role ? role.id : null)
      .flatMap(() => this.getStreamerRole(guild));
  }

  getStreamerRole(guild) {
    return this.nix.getGuildData(guild.id, DATAKEYS.STREAMER_ROLE)
      .map((roleId) => guild.roles.get(roleId));
  }

  removeStreamerRole(guild) {
    return this.getStreamerRole(guild)
      .map((oldRole) => {
        if (oldRole) {
          return oldRole;
        }
        else {
          throw new RoleNotFoundError('No streamer role set.');
        }
      })
      .flatMap((oldRole) => this.setStreamerRole(guild, null).map(() => oldRole));
  }
}

module.exports = StreamingService;
