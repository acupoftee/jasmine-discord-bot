const Rx = require('rx');
const Discord = require('discord.js');

const {Service} = require('nix-core');

const {
  ServerNotFoundError,
  UnauthorizedServerError,
  CategoryNotFoundError,
} = require('../errors');
const DataKeys = require('../datakeys');

class InviteListService extends Service {
  checkServerIsOWMN(guild) {
    if(guild.id !== this.nix.config.owmnServerId) {
      return Rx.Observable.throw(new UnauthorizedServerError(guild));
    }
    else {
      return Rx.Observable.of(true);
    }
  }

  /**
   * Sets the channel that the invite list will be posted in.
   *
   * @param guild
   * @param channel
   */
  setListChannel(guild, channel) {
    return this.nix
      .setGuildData(guild.id, DataKeys.SERVER_LIST_CHANNEL, channel.id)
      .map((channelId) => guild.channels.get(channelId));
  }

  /**
   * Gets the channel that the server list will be posted in.
   *
   * @param guild
   * @return {Channel|Null} The channel that the server list is posted in, or
   *   null if one is not set
   */
  getListChannel(guild) {
    return this.nix
      .getGuildData(guild.id, DataKeys.SERVER_LIST_CHANNEL)
      .map((channelId) => guild.channels.get(channelId));
  }

  /**
   * Disables the server list channel
   *
   * @param guild {Guild} the guild to disable the list for.
   */
  removeListChannel(guild) {
    return this.nix
      .setGuildData(guild.id, DataKeys.SERVER_LIST_CHANNEL, null);
  }

  /**
   * Adds a guild to the server list
   *
   * @param guildName {String} the name of the guild
   * @param guildCategory {String} the category for the guild
   * @param inviteCode {String} the invite url for the guild
   */
  addInvite(guildName, guildCategory, inviteCode) {
    return this.setInviteData(guildName, {
        name: guildName,
        category: guildCategory,
        invite: inviteCode,
      })
      .flatMap((data) => this.updateAllInviteChannels().map(() => data));
  }

  /**
   * Changes the invite code for an already added guild
   *
   * @param guildName {String} the name of the guild to change the invite for
   * @param inviteCode {String} the new invite url for the guild
   */
  changeInviteUrl(guildName, inviteCode) {
    return this.getInviteData(guildName)
      .map((guild) => ({
        ...guild,
        invite: inviteCode,
      }))
      .flatMap((guild) => this.setInviteData(guildName, guild))
      .flatMap((guild) => this.updateAllInviteChannels().map(() => guild));
  }

  /**
   * Changes the category for an existing guild
   *
   * @param guildName
   * @param guildCategory
   * @return {*}
   */
  changeInviteCategory(guildName, guildCategory) {
    return this.getInviteData(guildName)
      .map((guild) => ({
        ...guild,
        category: guildCategory,
      }))
      .flatMap((guild) => this.setInviteData(guildName, guild))
      .flatMap((guild) => this.updateAllInviteChannels().map(() => guild));
  }

  /**
   * Removes a guild from the list
   *
   * @param guildName {String} the name of the guild to remove
   */
  removeInvite(guildName) {
    guildName = guildName.toLowerCase();

    return this.getInviteList()
      .map((list) => {
        list = {...list};
        delete list[guildName];
        return list;
      })
      .flatMap((list) => this.setInviteList(list))
      .flatMap((guild) => this.updateAllInviteChannels().map(() => guild));
  }

  addCategory(categoryName) {
    return this.getInviteCategories()
      .flatMap((list) => this.setInviteCategory(categoryName, {
        name: categoryName,
        position: Object.keys(list).length,
      }))
      .flatMap((data) => this.updateAllInviteChannels().map(() => data));
  }

  removeCategory(categoryName) {
    return this.getInviteCategory(categoryName)
      .flatMap((category) =>
        this.setInviteCategory(categoryName, null)
          .map(() => category),
      )
      .flatMap((data) => this.updateAllInviteChannels().map(() => data));
  }

  /**
   * Updates the list of servers in all connected guilds
   */
  updateAllInviteChannels() {
    return Rx.Observable
      .combineLatest(
        this._getListChannels(),
        this._buildInviteMessages(),
      )
      .flatMap(([channel, messages]) => this._updateListChannel(channel, messages));
  }

  updateInviteChannel(guild) {
    return Rx.Observable
      .combineLatest(
        this.getListChannel(guild),
        this._buildInviteMessages(),
      )
      .flatMap(([channel, messages]) => this._updateListChannel(channel, messages));
  }

  /**
   * Returns a list of channels in all guilds that are configured to display the list of servers.
   *
   * @private
   *
   * @returns {Rx.Observable<Channel>} An observable of channels
   */
  _getListChannels() {
    return Rx.Observable
      .from(this.nix.discord.guilds.values())
      .flatMap((guild) => this.getListChannel(guild))
      .filter((channel) => channel !== null);
  }

  /**
   * Builds a list of messages that can replace the list in the list channel
   *
   * @private
   * @return {Rx.Observable<Array<String>>} an observable that will emit a single array of messages that contain the
   *   server list.
   */
  _buildInviteMessages() {
    return this.getInviteCategories()
      .map((categoryList) => {
        let list = {...categoryList};
        Object.values(list).forEach((category) => category.guilds = []);
        return list;
      })
      .flatMap((categoryList) =>
        this.getInviteList()
          .map((serverList) => Object.values(serverList))
          .flatMap((serverList) => Rx.Observable.from(serverList))
          .map((serverInvite) => {
            let category = categoryList[serverInvite.category.toLowerCase()];
            if (category) {
              category.guilds.push(serverInvite);
            }
            return '';
          })
          .count()
          .map(() => categoryList),
      )
      .map((categoryList) => Object.values(categoryList))
      .map((categoryList) => categoryList.sort((a, b) => a.position - b.position))
      .flatMap((categoryList) => Rx.Observable.from(categoryList))
      .map((category) => (
        `**=== ${category.name} ===**\n` +
        category.guilds
          .sort((a, b) => {
            if (a.name < b.name) { return -1; }
            if (a.name > b.name) { return 1; }
            return 0;
          })
          .map((guild) => `${guild.name}: ${guild.invite}`)
          .join('\n')
      ))
      .toArray();
  }

  _updateListChannel(channel, messages) {
    if (!channel.permissionsFor(this.nix.discord.user).has(Discord.Permissions.FLAGS.SEND_MESSAGES)) {
      return Rx.Observable.of(channel);
    }

    return Rx.Observable
      .of(channel)
      .do(() => this.nix.logger.debug(`removing old invites from ${channel.name} of ${channel.guild.name}`))
      .flatMap(() => channel.fetchMessages())
      .flatMap((oldMessages) => Rx.Observable.from(oldMessages.values()))
      .filter((oldMessage) => oldMessage.author.id === this.nix.discord.user.id)
      .filter((oldMessage) => oldMessage.content.match(/\*\*=== .* ===\*\*/))
      .flatMap((oldMessage) => oldMessage.delete())
      .count()
      .do((count) => this.nix.logger.debug(`Removed ${count} messages`))
      .do(() => this.nix.logger.debug(`Adding new invites to ${channel.name} of ${channel.guild.name}`))
      .flatMap(() => Rx.Observable.from(messages))
      .concatMap((newMessage) => channel.send(newMessage))
      .count()
      .do((count) => this.nix.logger.debug(`Added ${count} messages`))
      .map(() => channel);
  }

  /**
   * Gets a list of all added server invites
   *
   * @private
   *
   * @return {Object} The data structure for the list of Servers
   */
  getInviteList() {
    return this.nix.dataManager
      ._getData('module', 'owMains', DataKeys.SERVER_LIST)
      .map((data) => data || {});
  }

  /**
   * Gets the data for a single server
   *
   * @private
   *
   * @param guildName {String} the name of the server to retrieve (case insensitive),
   * @return {Object} The data structure for the saved server.
   */
  getInviteData(guildName) {
    return this.getInviteList()
      .map((list) => {
        if (list[guildName.toLowerCase()]) {
          return list[guildName.toLowerCase()];
        }
        else {
          throw new ServerNotFoundError(guildName);
        }
      });
  }

  /**
   * Updates the settings for a saved server invite
   *
   * @private
   *
   * @param guildName {String} the name of the server to update
   * @param guildData {Object} the data to save for that server
   *
   * @return {Object} The saved data for the server invite
   */
  setInviteData(guildName, guildData) {
    return this.getInviteList()
      .map((list) => {
        list = {...list};
        list[guildName.toLowerCase()] = guildData;
        return list;
      })
      .flatMap((list) => this.setInviteList(list))
      .map((list) => list[guildName.toLowerCase()]);
  }

  setInviteList(list) {
    return this.nix.dataManager
      ._setData('module', 'owMains', DataKeys.SERVER_LIST, list);
  }

  getInviteCategories() {
    return this.nix.dataManager
      ._getData('module', 'owMains', DataKeys.CATEGORY_LIST)
      .map((list) => list || {});
  }

  getInviteCategory(categoryName) {
    return this.getInviteCategories()
      .map((list) => list[categoryName.toLowerCase()])
      .flatMap((category) => {
        if (typeof category === "undefined" || category === null) {
          return Rx.Observable.throw(new CategoryNotFoundError(categoryName));
        }
        else {
          return Rx.Observable.of(category);
        }
      });
  }

  setInviteCategory(categoryName, data) {
    return this.getInviteCategories()
      .map((list) => {
        list = {...list};
        if (data !== null) {
          list[categoryName.toLowerCase()] = data;
        }
        else {
          delete list[categoryName.toLowerCase()];
        }
        return list;
      })
      .flatMap((list) => this.setInviteCategories(list))
      .map((list) => list[categoryName.toLowerCase()]);
  }

  setInviteCategories(list) {
    return this.nix.dataManager
      ._setData('module', 'owMains', DataKeys.CATEGORY_LIST, list);
  }
}

module.exports = InviteListService;
