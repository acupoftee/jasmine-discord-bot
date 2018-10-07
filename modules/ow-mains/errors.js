class BroadcastError extends Error {
  constructor(message) {
    super(message);
    this.name = "BroadcastError";
  }
}

class BroadcastingNotAllowedError extends BroadcastError {
  constructor(broadcastType) {
    super(`Sending ${broadcastType} broadcasts from this server is not allowed.`);
  }
}

class BroadcastCanceledError extends BroadcastError {
  constructor() {
    super(`Broadcast canceled`);
  }
}

class ServerListError extends Error {
  constructor(message) {
    super(message);
    this.name = "ServerListError";
  }
}

class ServerNotFoundError extends ServerListError {
  constructor(guildName) {
    super(`The guild ${guildName} could not be found`);
  }
}

module.exports = {
  BroadcastError,
  BroadcastingNotAllowedError,
  BroadcastCanceledError,

  ServerListError,
  ServerNotFoundError,
};
