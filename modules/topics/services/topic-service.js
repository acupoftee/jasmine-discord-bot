const Rx = require('rx');

class TopicService {
  constructor(nix) {
    this.nix = nix;
    this.watchedChannels = {};
  }

  onNixListen() {
    this.nix.streams
      .message$
      .filter((message) => !message.system)
      .filter((message) => this.watchedChannels[message.channel.id])
      .do((message) => delete this.watchedChannels[message.channel.id])
      .do((message) => this.nix.logger.debug(`Message in ${message.channel.name}: ${message.content}`))
      .flatMap((message) => message.pin())
      .catch((error) => {
        this.nix.logger.error(error);
        return Rx.Observable.of();
      })
      .subscribe();

    return Rx.Observable.of(true);
  }

  watchChannel(channel) {
    this.nix.logger.debug(`Watching for messages in ${channel.name}`);
    this.watchedChannels[channel.id] = true;
  }

  getOpenTopicsCategory(guild) {
    return guild.channels
      .filter((c) => c.type === null)
      .find((c) => c.name.toLowerCase().includes('!topic'));
  }

  getClosedTopicsCategory(guild) {
    return guild.channels
      .filter((c) => c.type === null)
      .find((c) => c.name.toLowerCase().includes('!close'));
  }
}

module.exports = TopicService;
