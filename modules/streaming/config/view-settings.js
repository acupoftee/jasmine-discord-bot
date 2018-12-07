const Rx = require('rx');
const Discord = require('discord.js');

module.exports = {
  name: 'viewSettings',
  description: `View the current settings for the streaming module`,

  configureAction() {
    this.streamingService = this.nix.getService('streaming', 'streamingService');
  },

  run(context) {
    let guild = context.guild;

    return Rx.Observable
      .combineLatest(
        this.streamingService.getLiveRole(guild),
      )
      .map(([liveRole]) => {
        let embed = new Discord.RichEmbed();
        embed.addField("Live Role:", liveRole ? liveRole.name : "[Not set]");

        return {
          status: 200,
          content: `Here are the current settings for the streaming module:`,
          embed
        }
      });
  },
};
