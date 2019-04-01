'use strict';
const fs = require('fs');

const Nix = require('nix-core');
const config = require('./lib/config.js');
const packageJson = require('./package');

let nix = new Nix(config);

// Load every plugin in the plugins folder
fs.readdirSync('./plugins')
  .forEach((file) => {
    nix.addModule(require('./plugins/' + file));
  });

nix.listen()
  .subscribe(
    () => nix.discord.user.setPresence({game: {name: `v${packageJson.version}`}}),
    (error) => onNixError(error),
    () => onNixComplete()
);

function onNixError(error) {
  console.error(error);
  nix.messageOwner('Shutting down due to unhandled error: ' + error)
    .subscribe(
      () => {},
      () => {},
      () => process.exit(1)
    );
}

function onNixComplete() {
  console.log('Shutting down');
  nix.messageOwner('Jasmine shutting down')
    .subscribe(
      () => {},
      () => {},
      () => process.exit(0)
    );
}
