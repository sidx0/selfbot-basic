const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('path');

// config
const config = {
  token: "TOKEN",
  prefix: 'PREFIX',
  ownerID: 'OWNER_ID',
  logChannelID: null,
};

const client = new Client({ checkUpdate: false });
const EMOJIS = {
  INFO: "ℹ️",
  SUCCESS: "✅",
  WARNING: "⚠️",
  ERROR: "❌",
  LOADING: "🔄",
  SERVER: "🖥️",
  USER: "👤",
  BAN: "🔨",
  KICK: "👢",
  DM: "📨",
  CLONE: "🔄",
  HELP: "❓",
  TIME: "⏱️",
  ID: "🆔",
  ROLES: "👑",
  CHANNELS: "📂",
  EMOJIS: "😄",
  STICKERS: "🏷️"
};

/**
 * log actions to console and optionally to a Discord channel
 * @param {Guild} guild - the guild where the action occurred
 * @param {string} action - the action that was performed
 * @param {User} user - the user involved in the action
 * @param {string} reason - the reason for the action
 */
function logAction(guild, action, user, reason) {
  console.log(`[${guild.name}] ${action}: ${user.tag} - ${reason}`);
  if (config.logChannelID) {
    const logChannel = guild.channels.cache.get(config.logChannelID);
    if (logChannel) {
      logChannel.send({
        content: `**${EMOJIS.INFO} ${action}**: ${user.tag} (${user.id}) - ${reason}`
      });
    }
  }
}

/**
 * extract a user from a mention string
 * @param {string} mention - The mention string
 * @param {Guild} guild - The guild to search for the user in
 * @returns {GuildMember|null} - The guild member or null if not found
 */
function getUserFromMention(mention, guild) {
  if (!mention) return null;
  if (mention.startsWith('<@') && mention.endsWith('>')) {
    mention = mention.slice(2, -1);
    if (mention.startsWith('!')) mention = mention.slice(1);
  }
  return guild.members.cache.get(mention);
}

client.on('messageCreate', async (message) => {
  if (message.author.id !== config.ownerID || !message.guild) return;
  if (!message.content.startsWith(config.prefix)) return;
  
  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'help') {
    await message.delete();
    const helpMsg = await message.channel.send({
      content: `**${EMOJIS.HELP} Server Management Commands**\n
${EMOJIS.SERVER} \`${config.prefix}serverinfo\` - Display server information
${EMOJIS.USER} \`${config.prefix}userinfo [@user]\` - Display user information
${EMOJIS.INFO} \`${config.prefix}getinvite [serverID]\` - Generate invite for a server
${EMOJIS.BAN} \`${config.prefix}banall [reason]\` - Ban all bannable members
${EMOJIS.KICK} \`${config.prefix}kickall [reason]\` - Kick all kickable members
${EMOJIS.DM} \`${config.prefix}dmall [message]\` - DM all members
${EMOJIS.EMOJIS} \`${config.prefix}clone emoji [sourceServerID] [targetServerID]\` - Clone emojis between servers
${EMOJIS.STICKERS} \`${config.prefix}clone sticker [sourceServerID] [targetServerID]\` - Clone stickers between servers
${EMOJIS.CHANNELS} \`${config.prefix}clone channels [sourceServerID] [targetServerID]\` - Clone channels between servers
${EMOJIS.ROLES} \`${config.prefix}clone roles [sourceServerID] [targetServerID]\` - Clone roles between servers
${EMOJIS.HELP} \`${config.prefix}help\` - Show this help menu`
    });
    setTimeout(() => helpMsg.delete().catch(err => {}), 15000);
  }


  else if (command === 'serverinfo') {
    await message.delete();
    const guild = message.guild;
    let verificationLevel;
    switch (guild.verificationLevel) {
      case 0: verificationLevel = 'None'; break;
      case 1: verificationLevel = 'Low'; break;
      case 2: verificationLevel = 'Medium'; break;
      case 3: verificationLevel = 'High'; break;
      case 4: verificationLevel = 'Very High'; break;
      default: verificationLevel = 'Unknown';
    }
    const members = guild.members.cache;
    const bots = members.filter(member => member.user.bot).size;
    const humans = members.size - bots;
    const channels = guild.channels.cache;
    const textChannels = channels.filter(c => c.type === 'GUILD_TEXT').size;
    const voiceChannels = channels.filter(c => c.type === 'GUILD_VOICE').size;
    const categoryChannels = channels.filter(c => c.type === 'GUILD_CATEGORY').size;
    const roleCount = guild.roles.cache.size - 1;
    const createdAt = new Date(guild.createdTimestamp);
    const createdAtFormatted = `${createdAt.toDateString()} (${Math.floor((Date.now() - createdAt) / 86400000)} days ago)`;
    
    const serverInfo = `
# ${EMOJIS.SERVER} __${guild.name} Server Information__

## ${EMOJIS.INFO} General Information
> ${EMOJIS.ID} **ID:** \`${guild.id}\`
> ${EMOJIS.USER} **Owner:** <@${guild.ownerId}> (\`${guild.ownerId}\`)
> ${EMOJIS.INFO} **Region:** \`${guild.preferredLocale || 'Unknown'}\`
> ${EMOJIS.INFO} **Boost Tier:** \`${guild.premiumTier || '0'}\`
> ${EMOJIS.INFO} **Boost Count:** \`${guild.premiumSubscriptionCount || '0'}\`
> ${EMOJIS.INFO} **Verification Level:** \`${verificationLevel}\`
> ${EMOJIS.TIME} **Created:** \`${createdAtFormatted}\`

## ${EMOJIS.INFO} Statistics
> ${EMOJIS.USER} **Members:** \`${guild.memberCount}\` (\`${humans}\` humans, \`${bots}\` bots)
> ${EMOJIS.ROLES} **Roles:** \`${roleCount}\`
> ${EMOJIS.EMOJIS} **Emojis:** \`${guild.emojis.cache.size}\`
> ${EMOJIS.CHANNELS} **Channels:** \`${channels.size}\` total (\`${textChannels}\` text, \`${voiceChannels}\` voice, \`${categoryChannels}\` categories)

## ${EMOJIS.INFO} Other
> ${EMOJIS.INFO} **Server Features:** \`${guild.features.join(', ') || 'None'}\`
> ${EMOJIS.INFO} **Vanity URL:** \`${guild.vanityURLCode || 'None'}\``;
    
    const infoMsg = await message.channel.send(serverInfo);
    setTimeout(() => infoMsg.delete().catch(err => {}), 30000);
  }


  else if (command === 'userinfo') {
    await message.delete();
    const member = getUserFromMention(args[0], message.guild) || message.member;
    if (!member) {
      const errorMsg = await message.channel.send(`${EMOJIS.ERROR} User not found.`);
      setTimeout(() => errorMsg.delete().catch(err => {}), 5000);
      return;
    }
    const user = member.user;
    const createdAt = new Date(user.createdTimestamp);
    const createdAtFormatted = `${createdAt.toDateString()} (${Math.floor((Date.now() - createdAt) / 86400000)} days ago)`;
    let joinedAtFormatted = 'N/A';
    if (member.joinedTimestamp) {
      const joinedAt = new Date(member.joinedTimestamp);
      joinedAtFormatted = `${joinedAt.toDateString()} (${Math.floor((Date.now() - joinedAt) / 86400000)} days ago)`;
    }
    const roles = member.roles.cache
      .filter(role => role.id !== message.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(role => `<@&${role.id}>`).join(', ') || 'None';
    const badges = [];
    if (user.flags) {
      const userFlags = user.flags.toArray();
      if (userFlags.includes('DISCORD_EMPLOYEE')) badges.push('Discord Staff');
      if (userFlags.includes('PARTNERED_SERVER_OWNER')) badges.push('Partner');
      if (userFlags.includes('HYPESQUAD_EVENTS')) badges.push('HypeSquad Events');
      if (userFlags.includes('BUGHUNTER_LEVEL_1')) badges.push('Bug Hunter (Level 1)');
      if (userFlags.includes('HOUSE_BRAVERY')) badges.push('HypeSquad Bravery');
      if (userFlags.includes('HOUSE_BRILLIANCE')) badges.push('HypeSquad Brilliance');
      if (userFlags.includes('HOUSE_BALANCE')) badges.push('HypeSquad Balance');
      if (userFlags.includes('EARLY_SUPPORTER')) badges.push('Early Supporter');
      if (userFlags.includes('BUGHUNTER_LEVEL_2')) badges.push('Bug Hunter (Level 2)');
      if (userFlags.includes('VERIFIED_BOT_DEVELOPER')) badges.push('Verified Bot Developer');
    }
    
    const userInfo = `
# ${EMOJIS.USER} __User Information: ${user.tag}__

## ${EMOJIS.INFO} General Information
> ${EMOJIS.ID} **ID:** \`${user.id}\`
> ${EMOJIS.TIME} **Created:** \`${createdAtFormatted}\`
> ${EMOJIS.TIME} **Joined:** \`${joinedAtFormatted}\`
> ${EMOJIS.INFO} **Bot:** \`${user.bot ? 'Yes' : 'No'}\`
> ${EMOJIS.INFO} **Badges:** \`${badges.length ? badges.join(', ') : 'None'}\`

## ${EMOJIS.INFO} Server Member Info
> ${EMOJIS.INFO} **Nickname:** \`${member.nickname || 'None'}\`
> ${EMOJIS.ROLES} **Roles [${member.roles.cache.size - 1}]:** ${roles}`;
    
    const infoMsg = await message.channel.send(userInfo);
    setTimeout(() => infoMsg.delete().catch(err => {}), 30000);
  }


  else if (command === 'dmall') {
    await message.delete();
    const dmText = args.join(' ');
    if (!dmText) {
      const errorMsg = await message.channel.send(`${EMOJIS.ERROR} Please provide a message to send.`);
      setTimeout(() => errorMsg.delete().catch(err => {}), 5000);
      return;
    }
    const confirmMsg = await message.channel.send(`${EMOJIS.WARNING} Are you sure you want to DM all members? Reply with 'yes' to confirm.`);
    const filter = m => m.author.id === message.author.id && (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'no');
    try {
      const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
      const response = collected.first();
      if (response) await response.delete().catch(err => {});
      await confirmMsg.delete().catch(err => {});
      if (response && response.content.toLowerCase() === 'yes') {
        const statusMsg = await message.channel.send(`${EMOJIS.LOADING} Starting to DM all members...`);
        const members = message.guild.members.cache;
        let sentCount = 0;
        let failedCount = 0;
        for (const [id, member] of members) {
          if (member.user.bot || member.user.id === client.user.id) continue;
          try {
            await member.send(dmText);
            sentCount++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (err) {
            failedCount++;
          }
          if ((sentCount + failedCount) % 10 === 0) {
            await statusMsg.edit(`${EMOJIS.LOADING} DMing members: ${sentCount} sent, ${failedCount} failed, ${members.size - sentCount - failedCount} remaining...`);
          }
        }
        await statusMsg.edit(`${EMOJIS.SUCCESS} Finished DMing members: ${sentCount} sent, ${failedCount} failed.`);
        setTimeout(() => statusMsg.delete().catch(err => {}), 10000);
      } else {
        const cancelMsg = await message.channel.send(`${EMOJIS.INFO} DMAll command cancelled.`);
        setTimeout(() => cancelMsg.delete().catch(err => {}), 5000);
      }
    } catch (err) {
      await confirmMsg.delete().catch(err => {});
      const timeoutMsg = await message.channel.send(`${EMOJIS.ERROR} Command timed out.`);
      setTimeout(() => timeoutMsg.delete().catch(err => {}), 5000);
    }
  }


  else if (command === 'kickall') {
    await message.delete();
    const reason = args.join(' ') || 'No reason provided';
    const confirmMsg = await message.channel.send(`${EMOJIS.WARNING} **DANGEROUS OPERATION** ${EMOJIS.WARNING}\n\nAre you sure you want to kick ALL members? Reply with 'I CONFIRM' to proceed.`);
    const filter = m => m.author.id === message.author.id;
    try {
      const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
      const response = collected.first();
      if (response) await response.delete().catch(err => {});
      await confirmMsg.delete().catch(err => {});
      if (response && response.content === 'I CONFIRM') {
        const statusMsg = await message.channel.send(`${EMOJIS.LOADING} Starting to kick all members...`);
        const members = message.guild.members.cache;
        let kickedCount = 0;
        let failedCount = 0;
        for (const [id, member] of members) {
          if (member.user.bot || member.user.id === client.user.id || member.user.id === message.guild.ownerId) continue;
          if (member.kickable) {
            try {
              await member.kick(reason);
              kickedCount++;
              logAction(message.guild, 'Mass Kick', member.user, reason);
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err) {
              failedCount++;
            }
          } else {
            failedCount++;
          }
          if ((kickedCount + failedCount) % 5 === 0) {
            await statusMsg.edit(`${EMOJIS.LOADING} Kicking members: ${kickedCount} kicked, ${failedCount} failed, ${members.size - kickedCount - failedCount - 2} remaining...`);
          }
        }
        await statusMsg.edit(`${EMOJIS.SUCCESS} Finished kicking members: ${kickedCount} kicked, ${failedCount} failed.`);
        setTimeout(() => statusMsg.delete().catch(err => {}), 10000);
      } else {
        const cancelMsg = await message.channel.send(`${EMOJIS.INFO} KickAll command cancelled.`);
        setTimeout(() => cancelMsg.delete().catch(err => {}), 5000);
      }
    } catch (err) {
      await confirmMsg.delete().catch(err => {});
      const timeoutMsg = await message.channel.send(`${EMOJIS.ERROR} Command timed out.`);
      setTimeout(() => timeoutMsg.delete().catch(err => {}), 5000);
    }
  }


  else if (command === 'banall') {
    await message.delete();
    const reason = args.join(' ') || 'No reason provided';
    const confirmMsg = await message.channel.send(`${EMOJIS.WARNING} **EXTREMELY DANGEROUS OPERATION** ${EMOJIS.WARNING}\n\nAre you sure you want to BAN ALL members? Reply with 'I UNDERSTAND THE CONSEQUENCES' to proceed.`);
    const filter = m => m.author.id === message.author.id;
    try {
      const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
      const response = collected.first();
      if (response) await response.delete().catch(err => {});
      await confirmMsg.delete().catch(err => {});
      if (response && response.content === 'I UNDERSTAND THE CONSEQUENCES') {
        const statusMsg = await message.channel.send(`${EMOJIS.LOADING} Starting to ban all members...`);
        const members = message.guild.members.cache;
        let bannedCount = 0;
        let failedCount = 0;
        for (const [id, member] of members) {
          if (member.user.bot || member.user.id === client.user.id || member.user.id === message.guild.ownerId) continue;
          if (member.bannable) {
            try {
              await message.guild.members.ban(member.user, { reason });
              bannedCount++;
              logAction(message.guild, 'Mass Ban', member.user, reason);
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err) {
              failedCount++;
            }
          } else {
            failedCount++;
          }
          if ((bannedCount + failedCount) % 5 === 0) {
            await statusMsg.edit(`${EMOJIS.LOADING} Banning members: ${bannedCount} banned, ${failedCount} failed, ${members.size - bannedCount - failedCount - 2} remaining...`);
          }
        }
        await statusMsg.edit(`${EMOJIS.SUCCESS} Finished banning members: ${bannedCount} banned, ${failedCount} failed.`);
        setTimeout(() => statusMsg.delete().catch(err => {}), 10000);
      } else {
        const cancelMsg = await message.channel.send(`${EMOJIS.INFO} BanAll command cancelled.`);
        setTimeout(() => cancelMsg.delete().catch(err => {}), 5000);
      }
    } catch (err) {
      await confirmMsg.delete().catch(err => {});
      const timeoutMsg = await message.channel.send(`${EMOJIS.ERROR} Command timed out.`);
      setTimeout(() => timeoutMsg.delete().catch(err => {}), 5000);
    }
  }


  else if (command === 'getinvite') {
    await message.delete();
    const guildId = args[0];
    if (!guildId) {
      const errorMsg = await message.channel.send(`${EMOJIS.ERROR} Please provide a server ID.`);
      setTimeout(() => errorMsg.delete().catch(err => {}), 5000);
      return;
    }
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      const errorMsg = await message.channel.send(`${EMOJIS.ERROR} Server not found or you are not a member.`);
      setTimeout(() => errorMsg.delete().catch(err => {}), 5000);
      return;
    }
    try {
      const channel = guild.channels.cache.find(
        channel => channel.type === 'GUILD_TEXT' && 
        channel.permissionsFor(guild.me).has(['CREATE_INSTANT_INVITE'])
      );
      if (!channel) {
        const errorMsg = await message.channel.send(`${EMOJIS.ERROR} No suitable channel found to create an invite.`);
        setTimeout(() => errorMsg.delete().catch(err => {}), 5000);
        return;
      }
      const invite = await channel.createInvite({ maxAge: 86400, maxUses: 1 });
      const inviteMsg = await message.channel.send(`${EMOJIS.SUCCESS} Invite for **${guild.name}**: ${invite.url} (Valid for 24 hours, 1 use)`);
      setTimeout(() => inviteMsg.delete().catch(err => {}), 60000);
    } catch (err) {
      const errorMsg = await message.channel.send(`${EMOJIS.ERROR} Error generating invite: ${err.message}`);
      setTimeout(() => errorMsg.delete().catch(err => {}), 5000);
    }
  }


  else if (command === 'clone') {
    await message.delete();
    const subCommand = args[0]?.toLowerCase();
    const sourceId = args[1];
    const targetId = args[2];
    
    if (!subCommand || !sourceId || !targetId) {
      const errorMsg = await message.channel.send(`${EMOJIS.ERROR} Usage: ${config.prefix}clone [emoji|sticker|channels|roles] [sourceServerID] [targetServerID]`);
      setTimeout(() => errorMsg.delete().catch(err => {}), 5000);
      return;
    }
    
    const sourceGuild = client.guilds.cache.get(sourceId);
    const targetGuild = client.guilds.cache.get(targetId);
    
    if (!sourceGuild || !targetGuild) {
      const errorMsg = await message.channel.send(`${EMOJIS.ERROR} Source or target server not found or you are not in them.`);
      setTimeout(() => errorMsg.delete().catch(err => {}), 5000);
      return;
    }
    

    if (subCommand === 'emoji') {
      const statusMsg = await message.channel.send(`${EMOJIS.LOADING} Starting emoji cloning...`);
      const emojis = sourceGuild.emojis.cache;
      let successCount = 0;
      let failCount = 0;
      
      for (const [id, emoji] of emojis) {
        try {
          await targetGuild.emojis.create(emoji.url, emoji.name);
          successCount++;
          if (successCount % 5 === 0) {
            await statusMsg.edit(`${EMOJIS.LOADING} Cloning emojis: ${successCount} added, ${failCount} failed, ${emojis.size - successCount - failCount} remaining...`);
          }
          await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit prevention
        } catch (err) {
          failCount++;
        }
      }
      
      await statusMsg.edit(`${EMOJIS.SUCCESS} Finished cloning emojis: ${successCount} added, ${failCount} failed.`);
      setTimeout(() => statusMsg.delete().catch(err => {}), 10000);
    }
    

    else if (subCommand === 'sticker') {
      const statusMsg = await message.channel.send(`${EMOJIS.LOADING} Starting sticker cloning...`);
      try {
        const stickers = await sourceGuild.stickers.fetch();
        let successCount = 0;
        let failCount = 0;
        
        for (const [id, sticker] of stickers) {
          try {
            const stickerBuffer = await sticker.fetch();
            await targetGuild.stickers.create({
              file: sticker.url,
              name: sticker.name,
              tags: sticker.tags,
              description: sticker.description || 'Cloned sticker'
            });
            successCount++;
            if (successCount % 5 === 0) {
              await statusMsg.edit(`${EMOJIS.LOADING} Cloning stickers: ${successCount} added, ${failCount} failed, ${stickers.size - successCount - failCount} remaining...`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit prevention
          } catch (err) {
            failCount++;
          }
        }
        
        await statusMsg.edit(`${EMOJIS.SUCCESS} Finished cloning stickers: ${successCount} added, ${failCount} failed.`);
        setTimeout(() => statusMsg.delete().catch(err => {}), 10000);
      } catch (err) {
        await statusMsg.edit(`${EMOJIS.ERROR} Error fetching stickers: ${err.message}`);
        setTimeout(() => statusMsg.delete().catch(err => {}), 5000);
      }
    }
    else if (command === 'nukeclone') {
      await message.delete();
      const sourceId = args[0];
      const targetId = args[1]; // this is the server that will be nuked and then have channels cloned to it
      
      if (!sourceId || !targetId) {
        const errorMsg = await message.channel.send(`${EMOJIS.ERROR} Usage: ${config.prefix}nukeclone [sourceServerID] [targetServerID]`);
        setTimeout(() => errorMsg.delete().catch(err => {}), 5000);
        return;
      }
      
      const sourceGuild = client.guilds.cache.get(sourceId);
      const targetGuild = client.guilds.cache.get(targetId);
      
      if (!sourceGuild || !targetGuild) {
        const errorMsg = await message.channel.send(`${EMOJIS.ERROR} Source or target server not found or you are not in them.`);
        setTimeout(() => errorMsg.delete().catch(err => {}), 5000);
        return;
      }
      
      // confirm the dangerous operation
      const confirmMsg = await message.channel.send(`${EMOJIS.WARNING} **EXTREMELY DANGEROUS OPERATION** ${EMOJIS.WARNING}\n\nThis will DELETE ALL CHANNELS in ${targetGuild.name} and then clone channels from ${sourceGuild.name}.\nAre you sure? Reply with 'I UNDERSTAND THE CONSEQUENCES' to proceed.`);
      
      const filter = m => m.author.id === message.author.id;
      try {
        const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
        const response = collected.first();
        if (response) await response.delete().catch(err => {});
        await confirmMsg.delete().catch(err => {});
        
        if (response && response.content === 'I UNDERSTAND THE CONSEQUENCES') {
          // first delete all channels in target server
          const statusMsg = await message.channel.send(`${EMOJIS.LOADING} Phase 1: Deleting all channels in ${targetGuild.name}...`);
          
          const targetChannels = targetGuild.channels.cache;
          let deletedCount = 0;
          let deleteFailCount = 0;
          
          // delete all channels in target guild
          for (const [id, channel] of targetChannels) {
            try {
              await channel.delete('Channel cleanup before cloning');
              deletedCount++;
              
              if (deletedCount % 5 === 0) {
                await statusMsg.edit(`${EMOJIS.LOADING} Deleting channels: ${deletedCount} deleted, ${deleteFailCount} failed, ${targetChannels.size - deletedCount - deleteFailCount} remaining...`);
              }
              
              await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit prevention
            } catch (err) {
              deleteFailCount++;
              console.error(`Failed to delete channel ${channel.name}: ${err.message}`);
            }
          }
          
          await statusMsg.edit(`${EMOJIS.SUCCESS} Phase 1 complete: ${deletedCount} channels deleted, ${deleteFailCount} failed.`);
          
          // begin cloning channels from source server
          await statusMsg.edit(`${EMOJIS.LOADING} Phase 2: Cloning channels from ${sourceGuild.name}...`);
          
          try {
            //create a map of categories
            const categories = sourceGuild.channels.cache.filter(c => c.type === 'GUILD_CATEGORY');
            const categoryMap = new Map();
            
            // create categories first
            for (const [id, category] of categories) {
              try {
                const newCategory = await targetGuild.channels.create(category.name, {
                  type: 'GUILD_CATEGORY',
                  position: category.position,
                  permissionOverwrites: category.permissionOverwrites.cache
                });
                categoryMap.set(category.id, newCategory.id);
              } catch (err) {
                console.error(`Failed to create category ${category.name}: ${err.message}`);
              }
            }
            
            //create text and voice channels
            const channels = sourceGuild.channels.cache.filter(c => c.type === 'GUILD_TEXT' || c.type === 'GUILD_VOICE');
            let successCount = 0;
            let failCount = 0;
            
            for (const [id, channel] of channels) {
              try {
                const options = {
                  type: channel.type,
                  topic: channel.topic,
                  nsfw: channel.nsfw,
                  bitrate: channel.bitrate,
                  userLimit: channel.userLimit,
                  rateLimitPerUser: channel.rateLimitPerUser,
                  position: channel.position,
                  permissionOverwrites: channel.permissionOverwrites.cache
                };
                
                //set parent if the channel had one and we cloned it
                if (channel.parentId && categoryMap.has(channel.parentId)) {
                  options.parent = categoryMap.get(channel.parentId);
                }
                
                await targetGuild.channels.create(channel.name, options);
                successCount++;
                
                if (successCount % 5 === 0) {
                  await statusMsg.edit(`${EMOJIS.LOADING} Cloning channels: ${successCount} added, ${failCount} failed, ${channels.size - successCount - failCount} remaining...`);
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit prevention
              } catch (err) {
                failCount++;
                console.error(`Failed to clone channel ${channel.name}: ${err.message}`);
              }
            }
            
            await statusMsg.edit(`${EMOJIS.SUCCESS} Operation complete!\nPhase 1: ${deletedCount} channels deleted, ${deleteFailCount} failed\nPhase 2: ${successCount} channels cloned, ${failCount} failed`);
            setTimeout(() => statusMsg.delete().catch(err => {}), 30000);
          } catch (err) {
            await statusMsg.edit(`${EMOJIS.ERROR} Error in Phase 2 (cloning): ${err.message}`);
            setTimeout(() => statusMsg.delete().catch(err => {}), 10000);
          }
        } else {
          const cancelMsg = await message.channel.send(`${EMOJIS.INFO} NukeClone command cancelled.`);
          setTimeout(() => cancelMsg.delete().catch(err => {}), 5000);
        }
      } catch (err) {
        await confirmMsg.delete().catch(err => {});
        const timeoutMsg = await message.channel.send(`${EMOJIS.ERROR} Command timed out.`);
        setTimeout(() => timeoutMsg.delete().catch(err => {}), 5000);
      }
    }
    // clone Channels
    else if (subCommand === 'channels') {
      const statusMsg = await message.channel.send(`${EMOJIS.LOADING} Starting channel cloning...`);
      
      try {
        //create a map of categories
        const categories = sourceGuild.channels.cache.filter(c => c.type === 'GUILD_CATEGORY');
        const categoryMap = new Map();
        
        //create categories first
        for (const [id, category] of categories) {
          try {
            const newCategory = await targetGuild.channels.create(category.name, {
              type: 'GUILD_CATEGORY',
              position: category.position,
              permissionOverwrites: category.permissionOverwrites.cache
            });
            categoryMap.set(category.id, newCategory.id);
          } catch (err) {
            console.error(`Failed to create category ${category.name}: ${err.message}`);
          }
        }
        
        //create text and voice channels
        const channels = sourceGuild.channels.cache.filter(c => c.type === 'GUILD_TEXT' || c.type === 'GUILD_VOICE');
        let successCount = 0;
        let failCount = 0;
        
        for (const [id, channel] of channels) {
          try {
            const options = {
              type: channel.type,
              topic: channel.topic,
              nsfw: channel.nsfw,
              bitrate: channel.bitrate,
              userLimit: channel.userLimit,
              rateLimitPerUser: channel.rateLimitPerUser,
              position: channel.position,
              permissionOverwrites: channel.permissionOverwrites.cache
            };
            
            //parent if the channel had one and we cloned it
            if (channel.parentId && categoryMap.has(channel.parentId)) {
              options.parent = categoryMap.get(channel.parentId);
            }
            
            await targetGuild.channels.create(channel.name, options);
            successCount++;
            
            if (successCount % 5 === 0) {
              await statusMsg.edit(`${EMOJIS.LOADING} Cloning channels: ${successCount} added, ${failCount} failed, ${channels.size - successCount - failCount} remaining...`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000)); // rate limit prevention
          } catch (err) {
            failCount++;
          }
        }
        
        await statusMsg.edit(`${EMOJIS.SUCCESS} Finished cloning channels: ${successCount} added, ${failCount} failed.`);
        setTimeout(() => statusMsg.delete().catch(err => {}), 10000);
      } catch (err) {
        await statusMsg.edit(`${EMOJIS.ERROR} Error cloning channels: ${err.message}`);
        setTimeout(() => statusMsg.delete().catch(err => {}), 5000);
      }
    }
    
    // clone Roles
    else if (subCommand === 'roles') {
      const statusMsg = await message.channel.send(`${EMOJIS.LOADING} Starting role cloning...`);
      
      try {
        // get all roles from source guild and sort them by position
        const roles = Array.from(sourceGuild.roles.cache.values())
          .filter(r => !r.managed && r.name !== '@everyone')
          .sort((a, b) => b.position - a.position);
        
        let successCount = 0;
        let failCount = 0;
        
        for (const role of roles) {
          try {
            await targetGuild.roles.create({
              name: role.name,
              color: role.color,
              hoist: role.hoist,
              position: role.position,
              permissions: role.permissions,
              mentionable: role.mentionable
            });
            
            successCount++;
            
            if (successCount % 5 === 0) {
              await statusMsg.edit(`${EMOJIS.LOADING} Cloning roles: ${successCount} added, ${failCount} failed, ${roles.length - successCount - failCount} remaining...`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000)); // rate limit prevention
          } catch (err) {
            failCount++;
          }
        }
        
        await statusMsg.edit(`${EMOJIS.SUCCESS} Finished cloning roles: ${successCount} added, ${failCount} failed.`);
        setTimeout(() => statusMsg.delete().catch(err => {}), 10000);
      } catch (err) {
        await statusMsg.edit(`${EMOJIS.ERROR} Error cloning roles: ${err.message}`);
        setTimeout(() => statusMsg.delete().catch(err => {}), 5000);
      }
    }
  }
});

client.on('ready', () => {
  console.log(`${EMOJIS.SUCCESS} logged in as ${client.user.tag}`);
  console.log(`${EMOJIS.INFO} selfbot is ready!`);
});

client.login(config.token).catch(err => {
  console.error(`${EMOJIS.ERROR} failed to login:`, err);
});
