const Rx = require('rx');

const DATAKEYS = {
  MOD_LOG_CHANNEL: 'modTools.modLogChannel',
};

module.exports = {
  DATAKEYS,

  addModLogEntry(context, embed) {
    return context.nix.dataService
      .getGuildData(context.guild.id, DATAKEYS.MOD_LOG_CHANNEL)
      .map((channelId) => context.guild.channels.find("id", channelId))
      .flatMap((channel) => {
        if(channel) {
          return Rx.Observable.fromPromise(channel.send({embed}));
        }
        else {
          return Rx.Observable.return();
        }
      })
      .catch((error) => {
        if (error.name === 'DiscordAPIError') {
          if (error.message === "Missing Access") {
            // Bot no longer has access to the channel, ignore for now.
            return Rx.Observable.return();
          }

          response.content = `Err... Discord returned an unexpected error when I tried to talk in that channel.`;
          context.nix.messageOwner(
            "I got this error when I tried to talk in the mod log channel",
            {embed: context.nix.createErrorEmbed(context, error)}
          );

          return response.send();
        }

        return Rx.Observable.throw(error);
      });
  },
};
