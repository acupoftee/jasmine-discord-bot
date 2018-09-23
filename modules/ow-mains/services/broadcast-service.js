const Rx = require('rx');
const Discord = require('discord.js');
const Service = require('nix-core').Service;

const {
  BroadcastingNotAllowedError,
  BroadcastCanceledError,
} = require('../errors');
const {
  DATAKEYS,
  BROADCAST_TYPES,
  BROADCAST_TOKENS,
} = require('../utility');

const CONFIRM_YES_EMOJI_NAME = "VoteYea";
const CONFIRM_NO_EMOJI_NAME = "VoteNay";

const FALLBACK_YES = "👍";
const FALLBACK_NO = "👎";

class BroadcastService extends Service {
  configureService() {
    this.dataService = this.nix.getService('core', 'dataService');
  }

  broadcastAllowed(guild, broadcastType) {
    return this.dataService
      .getGuildData(guild.id, DATAKEYS.BROADCAST_TOKENS)
      .map((allowedTokens) => {
        if (allowedTokens[broadcastType] !== BROADCAST_TOKENS[broadcastType]) {
          throw new BroadcastingNotAllowedError();
        }
        return true;
      });
  }

  addConfirmReactions(message) {
    let emoji = this.getConfirmEmoji(message.guild);

    return Rx.Observable
      .of('')
      .flatMap(() => message.react(emoji.yes || FALLBACK_YES))
      .flatMap(() => message.react(emoji.no || FALLBACK_NO));
  }

  removeOwnReactions(message) {
    return Rx.Observable
      .from(message.reactions.values())
      .filter((reaction) => reaction.remove(this.nix.discord.user))
  }

  getConfirmEmoji(guild) {
    return {
      yes: guild.emojis.find((e) => e.name === CONFIRM_YES_EMOJI_NAME) || FALLBACK_YES,
      no: guild.emojis.find((e) => e.name === CONFIRM_NO_EMOJI_NAME) || FALLBACK_NO,
    }
  }

  /**
   * @returns {Rx.Observable<any>}
   */
  confirmBroadcast(context, broadcastBody) {
    return Rx.Observable
      .of(broadcastBody)
      .map((broadcastBody) => (new Discord.RichEmbed()).setDescription(broadcastBody))
      .flatMap((broadcastEmbed) => context.message.channel.send(
        "Broadcast the following message?",
        { embed: broadcastEmbed }
      ))
      .flatMap((confirmMessage) =>
        this.addConfirmReactions(confirmMessage)
          .map(() => confirmMessage)
      )
      .flatMap((confirmMessage) => {
        let allowedEmojiNames = [
          CONFIRM_YES_EMOJI_NAME,
          CONFIRM_NO_EMOJI_NAME,
          FALLBACK_YES,
          FALLBACK_NO,
        ];

        return Rx.Observable
          .fromPromise(
            confirmMessage.awaitReactions(
              (reaction, user) =>
                allowedEmojiNames.includes(reaction.emoji.name) &&
                user.id === context.message.author.id,
              { max: 1 }
            )
          )
          .map((reactions) => ({ confirmMessage, reactions }))
      })
      .flatMap(({confirmMessage, reactions}) => {
        let yesEmojiNames = [CONFIRM_YES_EMOJI_NAME, FALLBACK_YES];

        if (reactions.find((r) => yesEmojiNames.includes(r.emoji.name))) {
          return Rx.Observable.of({confirmMessage, result: true});
        }
        else {
          return Rx.Observable.of({confirmMessage, result: false});
        }
      })
      .flatMap(({confirmMessage, result}) =>
        this.removeOwnReactions(confirmMessage)
          .defaultIfEmpty('')
          .last()
          .map(() => result)
      )
      .flatMap((result) => {
        if (!result) {
          return Rx.Observable.throw(new BroadcastCanceledError());
        }
        return Rx.Observable.of(result);
      })
  }

  broadcastMessage(broadcastType, broadcastBody) {
    return Rx.Observable
      .from(this.nix.discord.guilds.values())
      .flatMap((guild) =>
        this.getBroadcastChannel(broadcastType, guild)
          .flatMap((channel) => channel.send(broadcastBody))
      )
  }

  getBroadcastChannel(broadcastType, guild) {
    let broadcastChannelDatakey = BROADCAST_TYPES[broadcastType];

    return this.dataService
      .getGuildData(guild.id, broadcastChannelDatakey)
      .filter((channelId) => channelId !== null)
      .map((channelId) => guild.channels.get(channelId))
      .filter((channel) => channel.permissionsFor(this.nix.discord.user).has(Discord.Permissions.FLAGS.SEND_MESSAGES))
  }
}

module.exports = BroadcastService;
