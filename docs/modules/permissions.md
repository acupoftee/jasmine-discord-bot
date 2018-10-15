# Permissions
Provides a built in permissions system to grant and restrict access
to commands.

*This is a core module, and can not be disabled*

- Config Actions:
    - [addRole](#addRole)
    - [addUser](#addUser)
    - [list](#list)
    - [rmRole](#rmRole)
    - [rmUser](#rmUser)

## Config Actions

### addRole
```
!config permissions addRole {role} {level}
```
Grants a permission level to a Discord role

- `role`: The role to grant a permission to. Can be a mention or the name of a 
  role.
- `level`: The permission level to grant to the role. Check a module's 
  documentation for available levels.

### addUser
```
!config permissions addUser {user} {level}
```
Grants a permission level to a user

- `user`: The user to grant a permission to. Can be a mention, tag, or ID of a 
  user.
- `level`: The permission level to grant to the user. Check a module's 
  documentation for available levels.

### list
```
!config permissions list
```
List all currently configured permissions levels and which roles and users are
assigned to them.

### rmRole
```
!config permissions rmRole {role} {level}
```
Revokes a permission level from a Discord role

- `role`: The role to revoke a permission from. Can be a mention or the name 
  of a role.
- `level`: The permission level to revoke from the role. Check a module's 
  documentation for available levels.

### rmUser
```
!config permissions rmUser {user} {level}
```
Revokes a permission level from a user

- `user`: The user to revoke a permission from. Can be a mention, tag, or ID 
  of a user.
- `level`: The permission level to revoke from the user. Check a module's 
  documentation for available levels.
