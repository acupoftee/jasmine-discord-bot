module.exports = {
  getChannel(guild, name) {
    return guild.channels
      .filter((c) => c.type === 'text')
      .find((c) => c.name.toLowerCase() === name.toLowerCase());
  },

  findCategory(guild, name) {
    return guild.channels
      .filter((c) => c.type === 'category')
      .find((c) => c.name.toLowerCase().includes(name.toLowerCase()));
  },
};
