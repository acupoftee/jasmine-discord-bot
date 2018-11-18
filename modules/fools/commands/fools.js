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
    let restoreNames = context.flags.restore;
    let guildMembers = guild.members.array();

    return Rx.Observable.of('')
      .flatMap(() => this.nix.getGuildData(guild.id, DATAKEYS.PREV_NAMES))
      .flatMap((prevNames) =>
        response
          .send({ content: `${restoreNames ? `Restoring` : `Changing`} ${guildMembers.length} names` })
          .map(prevNames)
      )
      .flatMap((prevNames) => {
        let total = guildMembers.length;
        let completed = 0;
        return Rx.Observable
          .from(guildMembers)
          .flatMap((member) => restoreNames ? restoreName(member, prevNames) : renameUser(member, prevNames))
          .do(() => {
            completed += 1;
            if (completed % 25 === 0) {
              response.send({ content: `${restoreNames ? `Restored` : `Changed`} ${completed} of ${total} names (${(completed/total * 100).toFixed(1)}%)` }).subscribe();
            }
          })
          .toArray()
          .flatMap((changedUsers) => this.nix.setGuildData(guild.id, DATAKEYS.PREV_NAMES, prevNames).map(() => changedUsers));
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
