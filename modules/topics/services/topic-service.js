const Rx = require('rx');

class TopicService {
  constructor(nix) {
    this.nix = nix;
    this.watchedChannels = {};
  }

  onNixListen() {
    this.nix.streams
      .message$
      .filter((message) => this.watchedChannels[message.channel.id])
      .do((message) => this.nix.logger.debug(`Message in ${message.channel.name}`))
      .flatMap((message) => message.pin())
      .do((message) => this.watchChannels[message.channel.id] = false)
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
