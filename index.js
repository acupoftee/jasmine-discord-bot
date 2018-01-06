'use strict';
const fs = require('fs');

const Nix = require('nix-core');
const config = require('./config/config.js');

let nix = new Nix(config);

// Load every module in the modules folder
fs.readdirSync('./modules')
  .forEach((file) => {
    nix.addModule(require('./modules/' + file));
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
  nix.messageOwner('Jasmine shutting down')
    .subscribe(
      () => {},
      () => {},
      () => process.exit(0)
    );
}
