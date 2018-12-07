# Jasmine Discord Bot

Jasmine is the bot used by the Overwatch Mains Network (OWMN), to help with network wide tasks.

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
- [Core](docs/modules/core.md)
    - [config](docs/modules/core.md#config)
        - Run a [config action](#config-actions)
    - [help](docs/modules/core.md#help)
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

- [Core](docs/modules/core.md): 
    - *Core Module; can't be disabled*
    - Hosts the core features of Jasmine.
- [Permissions](docs/modules/permissions.md): 
    - *Core Module; can't be disabled*
    - Supplies the permission system for Jasmine's commands.
- [Command](docs/modules/command.md): 
    - *Core Module; can't be disabled*
    - Manages commands, and allows for enabling and disabling specific commands. 
- [Module](docs/modules/module.md): 
    - *Core Module; can't be disabled*
    - Manages modules, and allows for enabling and disabling modules.
- [Mod Tools](docs/modules/mod-tools.md): 
    - Provides moderation commands such as `!ban`, and `!warn`, and `!kick`.
- [Overwatch Info](docs/modules/ow-info.md):
    - *disabled by default* 
    - Provides commands to help users find others to play with.
- [OWMN](docs/modules/ow-mains.md):
    - *disabled by default* 
    - Provides OWMN specific tools and commands
- [Streaming](docs/modules/streaming.md):
    - *disabled by default* 
    - Assign a role to a user when they go live
- [Topics](docs/modules/topics.md):
    - *disabled by default* 
    - Provides command to create Topic Channels

## Config Actions
Config actions are used to enable, change, or disable features of a module.
These are always run through the [config](docs/modules/core.md#config) command:
```text
!config {module} {action} [inputs...]
```

### Config Action List
- [Command](docs/modules/command.md):
    - [disable](docs/modules/command.md#disable)
        - Explicitly disable a command
    - [enable](docs/modules/command.md#enable)
        - Explicitly enable a command
    - [enabled](docs/modules/command.md#enabled)
        - Check if a command is enabled
    - [setPrefix](docs/modules/command.md#setPrefix)
        - Change the command prefix used for the server
- [Permissions](docs/modules/permissions.md):
    - [addRole](docs/modules/permissions.md#addRole)
        - Grant a permission level to a role
    - [addUser](docs/modules/permissions.md#addUser)
        - Grant a permission level to a user
    - [list](docs/modules/permissions.md#list)
        - View a listing of all current permissions
    - [rmRole](docs/modules/permissions.md#rmRole)
        - Revoke a permission level from a role
    - [rmUser](docs/modules/permissions.md#rmUser)
        - Revoke a permission level from a user
- [Streaming](docs/modules/streaming.md)
    - [setLiveRole](docs/modules/streaming.md#setLiveRole)
        - Set the role to assign when a user goes live
    - [setStreamerRole](docs/modules/streaming.md#setStreamerRole)
        - Set a role to limit who can receive the live role
    - [removeLiveRole](docs/modules/streaming.md#removeLiveRole)
        - Disables assigning a role when a user goes live
    - [removeStreamerRole](docs/modules/streaming.md#removeStreamerRole)
        - Removes the limit on who can receive the live role
    - [viewSettings](docs/modules/streaming.md#viewSettings)
        - View the current settings for the streaming module
