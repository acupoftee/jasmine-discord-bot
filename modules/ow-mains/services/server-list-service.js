const {Service} = require('nix-core');

const {
  ServerNotFoundError,
} = require('../errors');
const DataKeys = require('../datakeys');

class ServerListService extends Service {
  configureService() {
    this.dataService = this.nix.getService('core', 'dataService');
  }

  /**
   * Sets the channel that the invite list will be posted in.
   *
   * @param guild
   * @param channel
   */
  setServerListChannel(guild, channel) {
    return this.dataService
      .setGuildData(guild.id, DataKeys.SERVER_LIST_CHANNEL, channel.id);
  }

  /**
   * Gets the channel that the server list will be posted in.
   *
   * @param guild
   * @return {Channel|Null} The channel that the server list is posted in, or
   *   null if one is not set
   */
  getServerListChannel(guild) {
    return this.dataService
      .getGuildData(guild.id, DataKeys.SERVER_LIST_CHANNEL)
      .map((channelId) => guild.channels.get(channelId));
  }

  /**
   * Disables the server list channel
   *
   * @param guild {Guild} the guild to disable the list for.
   */
  removeServerListChannel(guild) {
    return this.dataService
      .setGuildData(guild.id, DataKeys.SERVER_LIST_CHANNEL, null);
  }

  /**
   * Adds a guild to the server list
   *
   * @param guildName {String} the name of the guild
   * @param guildCategory {String} the category for the guild
   * @param inviteCode {String} the invite url for the guild
   */
  addGuild(guildName, guildCategory, inviteCode) {
    return this._setServerData(guildName, {
      name: guildName,
      category: guildCategory,
      invite: inviteCode,
    });
  }

  /**
   * Changes the invite code for an already added guild
   *
   * @param guildName {String} the name of the guild to change the invite for
   * @param inviteCode {String} the new invite url for the guild
   */
  changeInvite(guildName, inviteCode) {
    return this._getServerData(guildName)
      .map((guild) => ({
        ...guild,
        invite: inviteCode,
      }))
      .flatMap((guild) => this._setServerData(guildName, guild));
  }

  /**
   * Changes the category for an existing guild
   *
   * @param guildName
   * @param guildCategory
   * @return {*}
   */
  changeCategory(guildName, guildCategory) {
    return this._getServerData(guildName)
      .map((guild) => ({
        ...guild,
        category: guildCategory,
      }))
      .flatMap((guild) => this._setServerData(guildName, guild));
  }

  /**
   * Removes a guild from the list
   *
   * @param guildName {String} the name of the guild to remove
   */
  removeGuild(guildName) {
    guildName = guildName.toLowerCase();

    return this._getServerList()
      .map((list) => {
        list = {...list};
        delete list[guildName];
        return list;
      })
      .flatMap((list) => this._setServerList(list));
  }

  /**
   * Updates the list of servers in all connected guilds
   */
  updateAllInvites() {
    return Rx.Observable
      .combineLatest(
        this._getAllServerListChannels(),
        this._buildInviteMessages()
      )
      .flatMap(([channel, messages]) => this._updateInviteList(channel, messages))
  }

  _getAllServerListChannels() {
    return Rx.Observable
      .from(this.nix.discord.guilds.values())
      .flatMap((guild) => this.getServerListChannel(guild))
      .filter((channel) => channel !== null);
  }

  /**
   * Builds a list of messages that can replace the list in the list channel
   */
  _buildInviteMessages() {
    return this._getServerList()
      .flatMap((list) => Rx.Observable.from(Object.values(list)))
      .groupBy((guild) => guild.category)
      .map((guilds) => ([guilds[0].category, guilds]))
      .map(([category, guilds]) => (
        `**=== ${category} ===**\n` +
        guilds
          .map((guild) => `${guild.name}: ${guild.invite}`)
          .join('\n')
      ))
      .toArray();
  }

  /**
   * Deletes and recreates the list of guilds and their invites in a guild
   *
   * @param guild {Guild} the guild to update the server list in
   */
  _updateInviteList(channel, messages) {
    return this._removeListMessages(channel)
      .flatMap(() => this._addListMessages(channel, messages))
  }

  _removeListMessages(channel) {
    return Rx.Observable
      .of('')
      .flatMap(() => channel.fetchMessages())
      .flatMap((messages) => Rx.Observable.from(messages.values()))
      .filter((message) => message.author.id === this.nix.discord.user.id)
      .flatMap((message) => message.delete())
      .defaultIfEmpty('')
      .last()
      .map(() => '')
  }

  _addListMessages(channel, messages) {
    return Rx.Observable
      .from(serverListMessages)
      .concatMap((newMessage) => channel.send(newMessage))
      .defaultIfEmpty('')
      .last()
      .map(() => '')
  }

  _getServerList() {
    return this.dataService
      ._getData('module', 'owMains', DataKeys.FULL_SERVER_LIST)
      .map((data) => data === null ? {} : data);
  }

  _getServerData(guildName) {
    guildName = guildName.toLowerCase();

    return this._getServerList()
      .map((list) => {
        if (list[guildName]) {
          return list[guildName];
        }
        else {
          throw new ServerNotFoundError(guildName);
        }
      });
  }

  _setServerData(guildName, guildData) {
    guildName = guildName.toLowerCase();

    return this._getServerList()
      .map((list) => {
        list = {...list};
        list[guildName] = guildData;
        return list;
      })
      .flatMap((list) => this._setServerList(list));
  }

  _setServerList(list) {
    return this.dataService
      ._setData('module', 'owMains', DataKeys.FULL_SERVER_LIST, list);
  }

  _checkChannelEmpty(channel) {

  }
}

module.exports = ServerListService;
