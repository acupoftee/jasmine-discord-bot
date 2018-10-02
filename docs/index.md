# Jasmine Discord Bot

Jasmine is the Offical OWMN bot providing common tools and features for moderators and admins.

## Commands
By default, all commands are prefixed with `!`. To avoid conflict with other 
bots, the command prefix can be changed using:
```text
!config command setPrefix {newPrefix}
```

Additionally, commands can also be run by mentioning Jasmine:
```text
@Jasmine {command}
```

You can use the following command to see all the commands that you are able to
run:
```text
!help
```

### Command list
- [Core](./modules/core.md)
    - [config](./modules/core.md#config)
        - Run a [config action](#config-action)
    - [help](./modules/core.md#help)
        - display currently avaliable commands

## Modules
A module is a group of features and commands that are related. These extend the fuctionality of Jasmine beyond the core
feature set. By default, some modules are disabled when Jasmine and may be enabled on a per server basis.

When a module is disable, all commands and features will be disabled for the server.

To enable a module:
```text
!config module enable {module}
```
 
Inversely, modules can be disabled by running: *(Note: The core modules can not be disabled)*
```text
!config module disable {module}
```

### Module list
The following Modules are available for Jasmine:

- [Core](./modules/core.md): 
    - *Core Module; can't be disabled*
    - Hosts the core features of Jasmine.
- [Permissions](./modules/permissions.md): 
    - *Core Module; can't be disabled*
    - Supplies the permission system for Jasmine's commands.
- [Command](./modules/command.md): 
    - *Core Module; can't be disabled*
    - Manages commands, and allows for enabling and disabling specific commands. 
- [Module](./modules/module.md): 
    - *Core Module; can't be disabled*
    - Manages modules, and allows for enabling and disabling modules.
- [Mod Tools](./modules/mod-tools.md): 
    - Provides moderation commands such as `!ban`, and `!warn`, and `!kick`.
- [Overwatch Info](./modules/ow-info.md):
    - *disabled by default* 
    - Provides commands to help users find others to play with.
- [OWMN](./modules/ow-mains.md):
    - *disabled by default* 
    - Provides OWMN specific tools and commands
- [Topics](./modules/topics.md):
    - *disabled by default* 
    - Provides command to create Topic Channels

## Config Actions
Config actions are used to enable, change, or disable features of a module.
These are always run through the [config](./modules/core.md#config) command:
```text
!config {module} {action} [inputs...]
```

### Config Action List
- [Command](./modules/command.md):
    - [disable](./modules/command.md#disable)
        - Explicitly disable a command
    - [enable](./modules/command.md#enable)
        - Explicitly enable a command
    - [enabled](./modules/command.md#enabled)
        - Check if a command is enabled
    - [setPrefix](./modules/command.md#setPrefix)
        - Change the command prefix used for the server
- [Permissions](./modules/permissions.md):
    - [addRole](./modules/permissions.md#addRole)
        - Grant a permission level to a role
    - [addUser](./modules/permissions.md#addUser)
        - Grant a permission level to a user
    - [list](./modules/permissions.md#list)
        - View a listing of all current permissions
    - [rmRole](./modules/permissions.md#rmRole)
        - Revoke a permission level from a role
    - [rmUser](./modules/permissions.md#rmUser)
        - Revoke a permission level from a user

