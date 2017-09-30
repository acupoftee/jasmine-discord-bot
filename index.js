'use strict';
const fs = require('fs');

const Nix = require('nix-core');
const config = require('./config.js');

let nix = new Nix(config);

// Load every command in the commands folder
fs.readdirSync('./commands')
  .forEach((file) => {
    nix.addCommand(require('./commands/' + file));
  });

nix.listen()
  .subscribe(
    () => {},
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
  nix.messageOwner('Nix shutting down')
    .subscribe(
      () => {},
      () => {},
      () => process.exit(0)
    );
}
