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

class InviteListError extends Error {
  constructor(message) {
    super(message);
    this.name = "InviteListError";
  }
}

class InviteNotFoundError extends InviteListError {
  constructor(guildName) {
    super(`The invite for guild ${guildName} could not be found`);
  }
}

class CategoryNotFoundError extends InviteListError {
  constructor(categoryName) {
    super(`The category ${categoryName} could not be found`);
  }
}

class UnauthorizedServerError extends InviteListError {
  constructor(guild) {
    super(`${guild.name} is not authorized to manage guild invites.`);
  }
}

module.exports = {
  BroadcastError,
  BroadcastingNotAllowedError,
  BroadcastCanceledError,

  InviteListError,
  ServerNotFoundError: InviteNotFoundError,
  CategoryNotFoundError,
  UnauthorizedServerError,
};
