const Rx = require('rx');
const Discord = require('discord.js');

const {DATAKEYS} = require('../utility');

module.exports = {
  name: 'fools',
  description: 'April fools for Sombra Mains',
  permissions: ['admin'],
  flags: [
    {
      name: 'restore',
      shortAlias: 'r',
      description: 'Restore user nicknames',
      default: false,
      type: 'boolean',
    },
  ],
  args: [],

  run(context, response) {
    let guild = context.guild;
    let dataService = context.nix.dataService;
    let restoreNames = context.flags.restore;

    return Rx.Observable.of('')
      .flatMap(() => dataService.getGuildData(guild.id, DATAKEYS.PREV_NAMES))
      .flatMap((prevNames) => {
        return Rx.Observable
          .from(guild.members.array())
          .flatMap((member) => restoreNames ? restoreName(member, prevNames) : renameUser(member, prevNames))
          .toArray()
          .flatMap((changedUsers) => dataService.setGuildData(guild.id, DATAKEYS.PREV_NAMES, prevNames).map(() => changedUsers));
      })
      .flatMap((changedUsers) => {
        return response.send({
          content: `renamed ${changedUsers.length} users`,
        });
      });
  },
};

function renameUser(member, prevNames) {
  if (prevNames[member.id]) {
    // Name already changed, don't change it again.
    return Rx.Observable.of(member);
  }
  else {
    let newName = `Sombra-${getRandomTag()}`;
    prevNames[member.id] = member.displayName;
    return Rx.Observable
      .fromPromise(member.setNickname(newName))
      .catch(() => Rx.Observable.of(member));
  }
}

function restoreName(member, prevNames) {
  let newName = prevNames[member.id];
  return Rx.Observable
    .fromPromise(member.setNickname(newName))
    .do(() => delete prevNames[member.id])
    .catch(() => Rx.Observable.of(member));
}

function getRandomTag() {
  return Math.floor(Math.random()*16777215).toString(16);
}