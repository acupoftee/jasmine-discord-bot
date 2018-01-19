# v2.0.0

## Major Features:

- Created Network ModLog
    - Bans on a hero server will be reported to the Network ModLog
    - Unbans on a hero server will be reported to the Network ModLog
- User join is reported in the hero ModLog
- User leave is reported in the hero ModLog

## Minor Features:

- Bans (made via Discord) are reported in the ModLog
- Unbans (made via Discord) are reported in the ModLog
- !topic now allows for spaces in the channel name
- The first message in a topic channel is automatically pinned
- A user can now be found by ID, Mention, or Tag for `!ban`, `!unban`, and `!warn`
- 

## New config actions:

- `!config owMains enableNetModLog <token> <channel>`
    - Enable receiving network mod log entries. The token must match the configured netModLogToken.
