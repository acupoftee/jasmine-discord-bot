# Command

The command module provides config actions to enable and 
disable specific commands, and change the prefix used for
commands.

*This is a core module, and can not be disabled*

- Config Actions:
    - [disable](#disable)
    - [enable](#enable)
    - [enabled](#enabled)
    - [setPrefix](#setPrefix)

## Config Actions

### disable
```
!config command disable {command}
```
Explicitly disables a command.

**Note:** Commands that belong to a disabled module are 
disabled by default.

* `command`: The name of the command to disable

### enable
```
!config command enable {command}
```
Explicitly enable a command.

**Note:** If the command belongs to a module that is 
currently disabled, the command will remain disabled. 

* `command`: The name of the command to disable

### enabled
```
!config command enabled {command}
```
Checks if a command is enabled. If a command is disabled,
display the reason why.

* `command`: The name of the command to check

### setPrefix
```
!config command setPrefix {newPrefix}
```
Changes the prefix for the bot on the server

* `newPrefix`: The new prefix to use. Must be 1 or more characters.
