# v2.0.0

## Major Features:

- Created Network ModLog
    - Bans and unbans on a hero server will be reported to the Network ModLog
- Added JoinLog
    - User join/leave can are added to the JoinLog
    - enable with: `!config modTools enableLog JoinLog <channel>`

## Minor Features:

- Bans and Unbans made via Discord are reported in the ModLog
- `!topic` changes
    - spaces are now allowed in the channel name
    - The first message in a topic channel is automatically pinned
- A user can now be found by ID, Mention, or Tag for `!ban`, `!unban`, and `!warn` 

## Config actions changes:

- added Unbans`owMains enableNetModLog <token> <channel>`
    - Enable receiving network mod log entries. The token must match the configured netModLogToken.
- `modTools enableModLog <channel>` changed to `modTools enableLog <type> <channel>`
    - JoinLog and ModLog can be enabled separately
- `modTools disableModLog` changed to `modTools disableLog <type>`
    - JoinLog and ModLog can be disable separately
