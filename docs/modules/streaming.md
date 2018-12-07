# Streaming
Allows for adding a role to a user when they go live on twitch. 

- Config Actions:
    - [viewSettings](#viewSettings)
    - [setLiveRole](#setLiveRole)
    - [removeLiveRole](#removeLiveRole)
    - [setStreamerRole](#setStreamerRole)
    - [removeStreamerRole](#removeStreamerRole)

## Config Actions

### viewSettings
```
!config streaming viewSettings
```
View the current settings for the streaming module.

### setLiveRole
```
!config streaming setLiveRole {role}
```
Sets the role to assign when a user starts streaming. Will also be automagically removed when they go offline

- `role`: The role to grant a permission to. Can be a mention or the name of a 
  role.

### removeLiveRole
```
!config streaming removeLiveRole
```
Stops Jasmine from adding a role to users when they start streaming.

### setStreamerRole
```
!config streaming setStreamerRole {role}
```
Sets a role to limit who can receive the live role

- `role`: The role to grant a permission to. Can be a mention or the name of a 
  role.

### removeStreamerRole
```
!config streaming removeStreamerRole
```
Removes the limit on who can receive the live role
