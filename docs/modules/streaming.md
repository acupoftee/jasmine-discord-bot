# Streaming
Allows for adding a role to a user when they go live on twitch. 

- Config Actions:
    - [addLiveRole](#addLiveRole)
    - [removeLiveRole](#removeLiveRole)
    - [viewSettings](#viewSettings)

## Config Actions

### addLiveRole
```
!config streaming addLiveRole {role}
```
Sets the role to assign when a user starts streaming. Will also be automagically removed when they go offline

- `role`: The role to grant a permission to. Can be a mention or the name of a 
  role.

### removeLiveRole
```
!config streaming removeLiveRole
```
Stops Jasmine from adding a role to users when they start streaming.

### viewSettings
```
!config streaming viewSettings
```
View the current settings for the streaming module.
