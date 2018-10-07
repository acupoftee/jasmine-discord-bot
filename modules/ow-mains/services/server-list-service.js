const {Service} = require('nix-core');

class ServerListService extends Service {
  configureService () {
    this.dataService = this.nix.getService('core', 'dataService');
  }

  /**
   * Sets the channel that the invite list will be posted in.
   *
   * @param guild
   * @param channel
   */
  setServerListChannel(guild, channel) {

  }

  /**
   * Gets the channel that the server list will be posted in.
   *
   * @param guild
   * @return {Channel|Null} The channel that the server list is posted in, or
   * null if one is not set
   */
  getServerListChannel(guild) {

  }

  /**
   * Disables the server list channel
   *
   * @param guild {Guild} the guild to disable the list for.
   */
  removeServerListChannel(guild) {

  }

  /**
   * Adds a guild to the server list
   *
   * @param guildName {String} the name of the guild
   * @param guildCategory {String} the category for the guild
   * @param inviteCode {String} the invite url for the guild
   */
  addGuild(guildName, guildCategory, inviteCode) {

  }

  /**
   * Changes the invite code for an already added guild
   *
   * @param guildName {String} the name of the guild to change the invite for
   * @param inviteCode {String} the new invite url for the guild
   */
  changeInvite(guildName, inviteCode) {

  }

  /**
   * Removes a guild from the list
   *
   * @param guildName {String} the name of the guild to remove
   */
  removeGuild(guildName) {

  }

  /**
   * Builds a list of messages that can replace the list in the list channel
   */
  buildInviteMessages() {

  }

  /**
   * Updates the list of servers in all connected guilds
   */
  updateAllInvites() {

  }

  /**
   * Deletes and recreates the list of guilds and their invites in a guild
   *
   * @param guild {Guild} the guild to update the server list in
   */
  updateInviteList(guild) {

  }

  _checkChannelEmpty(channel) {

  }
}

module.exports = ServerListService;
