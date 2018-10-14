# Core
The core module contains core Jasmine commands.

*This is a core module, and can not be disabled*

- Permission Levels:
    - Admin


- Commands:
    - [config](#config)
    - [help](#help)

## Commands

### config
```
!config --list
```
Displays a overview list of available config actions

* *Requires permission: Admin*

```
!config {module} --list
```
Displays a detailed list of available config actions for a module

* *Requires permission: Admin*
* `module`: The name of the module to get config actions for

```
!config {module} {action} [inputs...]
```
Run a config action for this server. See the documentation of other modules for 
available config actions.

* *Requires permission: Admin*
* `module`: The name of the module that the config action belongs to
* `action`: The name of the action to run

### help
```
!help
```

Displays all available commands from all modules that the user can use.
