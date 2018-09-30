# Jasmine Discord Bot

Jasmine is the Offical OWMN bot providing common tools and features for moderators and admins.

# Modules

A module is a group of features and commands that are related. These extend the fuctionality of Jasmine beyond the core
feature set. By default, some modules are disabled when Jasmine and may be enabled on a per server basis.

When a module is disable, all commands and features will be disabled for the server.

To enable a module:

```text
!config module enable {module}
```

Inversely, modules can be disabled by running:

```text
!config module disable {module}
```

_(Note: The core modules can not be disabled)_

## Available Modules

The following Modules are available for Jasmine:

- [Core*](./core.md): Hosts the core features of Jasmine.
- [Permissions*](./permissions.md): Supplies the permission system for Jasmine's commands.
- [Command*](./command.md): Manages commands, and allows for enabling and disabling specific commands. 
- [Module*](./module.md): Manages modules, and allows for enabling and disabling modules.
- [Mod Tools](./mod-tools.md): Provides moderation commands such as `!ban`, and `!warn`, and `!kick`.
- [Overwatch Info](./ow-info.md) _(disabled by default)_: Provides commands to help users find others to play with.
- [OWMN](./ow-mains.md) _(disabled by default)_: Provides OWMN specific tools and commands
- [Topics](./topics.md) _(disabled by default)_: Provides command to create Topic Channels

\* Core Module; can't be disabled
