# Core
The core module contains core commands that can not be disabled

- Commands:
    - [config](#config)
    - [help](#help)
    - [owner:listGuilds](#owner:listGuilds)
    - [owner:shutdown](#owner:shutdown)

## Commands

### config
```
!config --list
```
Displays a overview list of available config actions

* *Requires permissions: Admin*

```
!config {module} --list
```
Displays a detailed list of available config actions for a module

* *Requires permissions: Admin*
* `module`: The name of the module to get config actions for

```
!config {module} {action} [inputs...]
```
Run a config action for this server. See the documentation of other modules for 
available config actions.

* *Requires permissions: Admin*
* `module`: The name of the module that the config action belongs to
* `action`: The name of the action to run

### help
```
!help
```

Displays all available commands from all modules that the user can use.

### owner:listGuilds
```
!owner:listGuilds
```
Displays a list of all server that the bot is connected to, and their guildIds

* **Owner only command**

### owner:shutdown
```
!owner:shutdown
```
Gracefully shuts down the bot.

* **Owner only command**
