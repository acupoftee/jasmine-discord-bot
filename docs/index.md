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

*(Note: The core modules can not be disabled)*

## Available Modules

The following Modules are available for Jasmine:

- [Core*](./modules/core.md): Hosts the core features of Jasmine.
- [Permissions*](./modules/permissions.md): Supplies the permission system for Jasmine's commands.
- [Command*](./modules/command.md): Manages commands, and allows for enabling and disabling specific commands. 
- [Module*](./modules/module.md): Manages modules, and allows for enabling and disabling modules.
- [Mod Tools](./modules/mod-tools.md): Provides moderation commands such as `!ban`, and `!warn`, and `!kick`.
- [Overwatch Info](./modules/ow-info.md) *(disabled by default)*: Provides commands to help users find others to play with.
- [OWMN](./modules/ow-mains.md) *(disabled by default)*: Provides OWMN specific tools and commands
- [Topics](./modules/topics.md) *(disabled by default)*: Provides command to create Topic Channels

\* Core Module; can't be disabled
