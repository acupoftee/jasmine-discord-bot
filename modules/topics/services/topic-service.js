class TopicService {
  constructor(nix) {
    this.nix = nix;
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
