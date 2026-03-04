const { ChannelType, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, } = require("discord.js");

const TEMP = {
  panelVoiceId: process.env.TEMP_PANEL_VOICE_ID || null,
  categoryId: process.env.TEMP_CATEGORY_ID || null,
  nameTemplate: process.env.TEMP_NAME_TEMPLATE || "{user} Odası",
  defaultLimit: Number(process.env.TEMP_DEFAULT_LIMIT || 2),
  deleteDelayMs: Number(process.env.TEMP_DELETE_DELAY_MS || 8000),
  cooldownMs: Number(process.env.TEMP_COOLDOWN_MS || 15000),
  allowClaim: String(process.env.TEMP_ALLOW_CLAIM ?? "true") === "true",
};

function roomNameFor(member) {
  return String(TEMP.nameTemplate).replaceAll("{user}", member.displayName);
}

function statusLine(room) {
  const locked = room.locked ? "🔒 Kilitli" : "🔓 Açık";
  const hidden = room.hidden ? "👻 Gizli" : "👁️ Görünür";
  const limit = typeof room.limit === "number" ? room.limit : "—";
  const banned = Array.isArray(room.banned) ? room.banned.length : 0;
  return `**Durum:** ${locked} • ${hidden} • 👥 Limit: **${limit}** • 🚫 Ban: **${banned}**`;
}

function buildV2Panel(room) {
  const header = new TextDisplayBuilder().setContent(
    `## Oda Yönetim Paneli \n` +
      `👑 Sahip: <@${room.ownerId}>\n` +
      `🔊 Ses: <#${room.voiceId}>\n\n` +
      `${statusLine(room)}`
  );

  const info = new TextDisplayBuilder().setContent(
    `> **Menü**\n` + `- Aşağıdaki butonlarla odanızı yönetebilirsiniz.\n`
  );

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("devcode:room:lock")
      .setLabel("🔒 Kilitle")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("devcode:room:unlock")
      .setLabel("🔓 Aç")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("devcode:room:hide")
      .setLabel("👻 Gizle")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("devcode:room:unhide")
      .setLabel("👁️ Göster")
      .setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("devcode:room:limit")
      .setLabel("👥 Limit")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("devcode:room:rename")
      .setLabel("✏️ İsim")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("devcode:room:permit")
      .setLabel("✅ İzin")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("devcode:room:reject")
      .setLabel("❌ İzin Al")
      .setStyle(ButtonStyle.Danger)
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("devcode:room:kick")
      .setLabel("👢 Kick")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("devcode:room:transfer")
      .setLabel("🔁 Transfer")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("devcode:room:claim")
      .setLabel("👑 Claim")
      .setStyle(ButtonStyle.Success)
  );

  const row4 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("devcode:room:ban")
      .setLabel("🚫 Ban")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("devcode:room:unban")
      .setLabel("✅ Unban")
      .setStyle(ButtonStyle.Success)
  );

  const container = new ContainerBuilder()
    .addTextDisplayComponents(header)
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addTextDisplayComponents(info)
    .addActionRowComponents(row1)
    .addActionRowComponents(row2)
    .addActionRowComponents(row3)
    .addActionRowComponents(row4);

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

function ensureMemory(client) {
  client._tempRooms ??= new Map();
  client._tempRoomsByOwner ??= new Map();
  client._tempCooldown ??= new Map();
}

async function getRoomByVoice(client, guildId, voiceId) {
  if (client.db?.get) return await client.db.get(`tempRoomsByVoice.${guildId}.${voiceId}`);
  return client._tempRooms.get(voiceId) || null;
}

async function setRoom(client, guildId, room) {
  if (client.db?.set) {
    await client.db.set(`tempRoomsByVoice.${guildId}.${room.voiceId}`, room);
    await client.db.set(`tempRoomsByOwner.${guildId}.${room.ownerId}`, room.voiceId);
    return;
  }
  client._tempRooms.set(room.voiceId, room);
  client._tempRoomsByOwner.set(`${guildId}:${room.ownerId}`, room.voiceId);
}

async function delRoom(client, guildId, room) {
  if (client.db?.delete) {
    await client.db.delete(`tempRoomsByVoice.${guildId}.${room.voiceId}`);
    await client.db.delete(`tempRoomsByOwner.${guildId}.${room.ownerId}`);
    return;
  }
  client._tempRooms.delete(room.voiceId);
  client._tempRoomsByOwner.delete(`${guildId}:${room.ownerId}`);
}

module.exports = {
  name: "voiceStateUpdate",
  once: false,
  async execute(client, oldState, newState) {
    try {
      ensureMemory(client);

      const member = newState.member || oldState.member;
      if (!member || member.user.bot) return;

      const guild = newState.guild || oldState.guild;
      if (!guild) return;

      if (!TEMP.panelVoiceId || !TEMP.categoryId) return;

      // Panel kanalına girince oda aç
      if (newState.channelId === TEMP.panelVoiceId) {
        const now = Date.now();
        const last = client._tempCooldown.get(member.id) || 0;
        if (now - last < TEMP.cooldownMs) {
          await newState.setChannel(null).catch(() => {});
          return;
        }
        client._tempCooldown.set(member.id, now);

        if (client.db?.get) {
          const existingVoiceId = await client.db.get(`tempRoomsByOwner.${guild.id}.${member.id}`);
          if (existingVoiceId) {
            const ch = guild.channels.cache.get(existingVoiceId);
            if (ch) {
              await newState.setChannel(ch).catch(() => {});
              return;
            }
            await client.db.delete(`tempRoomsByOwner.${guild.id}.${member.id}`).catch(() => {});
          }
        } else {
          const existingVoiceId = client._tempRoomsByOwner.get(`${guild.id}:${member.id}`);
          if (existingVoiceId) {
            const ch = guild.channels.cache.get(existingVoiceId);
            if (ch) {
              await newState.setChannel(ch).catch(() => {});
              return;
            }
            client._tempRoomsByOwner.delete(`${guild.id}:${member.id}`);
          }
        }

        const category = guild.channels.cache.get(TEMP.categoryId);
        if (!category) return;

        const overwrites = [
          { id: guild.id, deny: [PermissionFlagsBits.Connect] },
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.Stream,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.MoveMembers,
              PermissionFlagsBits.MuteMembers,
            ],
          },
        ];

        const voiceChannel = await guild.channels.create({
          name: roomNameFor(member),
          type: ChannelType.GuildVoice,
          parent: category.id,
          userLimit: TEMP.defaultLimit,
          permissionOverwrites: overwrites,
        });

        await newState.setChannel(voiceChannel).catch(() => {});

        const room = {
          ownerId: member.id,
          voiceId: voiceChannel.id,
          createdAt: Date.now(),
          locked: true,
          hidden: false,
          limit: TEMP.defaultLimit,
          banned: [],
          panelMessageId: null,
        };

        const msg = await voiceChannel.send(buildV2Panel(room)).catch(() => null);
        if (msg) room.panelMessageId = msg.id;

        await setRoom(client, guild.id, room);
        
        if (client.db?.get && client.db?.set) {
          const k = `tempRoomsIndex.${guild.id}`;
          const list = (await client.db.get(k)) || [];
          const next = Array.isArray(list) ? list : [];
          if (!next.includes(voiceChannel.id)) next.push(voiceChannel.id);
          await client.db.set(k, next);
        }

        return;
      }

      // Odadan çıkınca boşsa sil
      const leftChannel = oldState.channel;
      if (!leftChannel) return;

      const room = await getRoomByVoice(client, guild.id, leftChannel.id);
      if (!room) return;

      setTimeout(async () => {
        try {
          const voice = guild.channels.cache.get(room.voiceId);
          const isEmpty = !voice || voice.members.size === 0;
          if (!isEmpty) return;

          if (voice) await voice.delete().catch(() => {});

          if (client.db?.get && client.db?.set) {
            const k = `tempRoomsIndex.${guild.id}`;
            const list = (await client.db.get(k)) || [];
            const next = (Array.isArray(list) ? list : []).filter((id) => id !== room.voiceId);
            await client.db.set(k, next);
          }

          await delRoom(client, guild.id, room);
        } catch {}
      }, TEMP.deleteDelayMs);
    } catch (err) {
      console.error("voiceStateUpdate error:", err);
    }
  },

};
