const Collection = require('discord.js').Collection;

class MockGuild {
  constructor(options = {}) {
    Object.assign(this, {
      id: '00001',
      name: 'TestGuild',
      roles: new Collection(),

      fetchMember: sinon.fake.resolves({}),

      ...options,
    });
  }
}

class MockUser {
  constructor(options = {}) {
    Object.assign(this, {
      id: '00001',
      username: 'TestUser',

      ...options,
    });
  }
}

class MockGuildMember {
  constructor(options = {}) {
    Object.assign(this, {
      user: new MockUser(),
      guild: new MockGuild(),

      setNickname: sinon.fake.resolves({}),

      ...options,
    });
  }

  get id() {
    return this.user.id;
  }
}

class MockGuildChannel {
  constructor(options = {}) {
    Object.assign(this, {
      type: 'text',
      name: 'test-channel',
      guild: new MockGuild(),

      send: sinon.fake.resolves({}),
      permissionsFor: sinon.fake.returns({
        has: () => true,
      }),

      ...options,
    });
  }
}

class MockMessage {
  constructor(options = {}) {
    const guild = new MockGuild();
    const user = new MockUser();

    Object.assign(this, {
      content: 'Hello World',
      guild: guild,
      author: user,
      channel: new MockGuildChannel({
        guild,
      }),
      member: new MockGuildMember({
        guild,
      }),
      reply: sinon.fake.resolves({}),

      ...options,
    });
  }
}

module.exports = {
  MockGuild,
  MockUser,
  MockGuildMember,
  MockGuildChannel,
  MockMessage,
};
