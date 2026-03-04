const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, UserSelectMenuBuilder, StringSelectMenuBuilder, PermissionFlagsBits, } = require("discord.js");
function ensureMemory(client) {
  client._tempRooms ??= new Map(); 
}
async function getRoom(client, interaction) {
  const gid = interaction.guildId;
  const voiceId = interaction.channelId; 

  if (client.db?.get) return await client.db.get(`tempRoomsByVoice.${gid}.${voiceId}`);
  return client._tempRooms.get(voiceId) || null;
}
async function saveRoom(client, gid, room) {
  if (client.db?.set) return await client.db.set(`tempRoomsByVoice.${gid}.${room.voiceId}`, room);
  client._tempRooms.set(room.voiceId, room);
}
function canManage(interaction, room) {
  if (!room) return false;
  if (interaction.user.id === room.ownerId) return true;
  return interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);
}
async function safeReply(interaction, payload) {
  try {
    if (interaction.deferred || interaction.replied) return await interaction.followUp(payload);
    return await interaction.reply(payload);
  } catch {}
}
async function updatePanel(interaction, room, buildPanelFn) {
  if (!room.panelMessageId) return;
  const ch = interaction.channel; 
  const msg = await ch.messages.fetch(room.panelMessageId).catch(() => null);
  if (!msg) return;
  await msg.edit(buildPanelFn(room)).catch(() => {});
}

module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(client, interaction) {
    try {
      ensureMemory(client);

if (interaction.isChatInputCommand()) {
    const cmd = client.commands?.get(interaction.commandName);
 if (!cmd) return;
    return cmd.execute(client, interaction);
}
      const { buildV2Panel } = require("./_panelShared");



if (interaction.isButton()) {

  if (!interaction.customId.startsWith("dev:")) return;

  if (interaction.user.id !== process.env.BOT_OWNER_ID) {
    return interaction.reply({ content: "❌ Yetkin yok.", ephemeral: true });
  }

  if (interaction.customId === "dev:restart") {
    await interaction.reply({ content: "🔄 Bot yeniden başlatılıyor...", ephemeral: true });

    setTimeout(() => {
      process.exit(0);
    }, 2000);
  }

  if (interaction.customId === "dev:avatar") {
    await interaction.reply({
      content: "🖼 Yeni avatar URL gönder.",
      ephemeral: true,
    });
  }

  if (interaction.customId === "dev:name") {
    await interaction.reply({
      content: "✏️ Yeni bot ismini yaz.",
      ephemeral: true,
    });
  }

  if (interaction.customId === "dev:status") {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("devstatus:online").setLabel("Online").setStyle(1),
      new ButtonBuilder().setCustomId("devstatus:idle").setLabel("Idle").setStyle(2),
      new ButtonBuilder().setCustomId("devstatus:dnd").setLabel("DND").setStyle(4)
    );

    return interaction.reply({
      content: "Status seç:",
      components: [row],
      ephemeral: true,
    });
  }

}

if (!interaction.customId.startsWith("devstatus:")) return;

  const status = interaction.customId.split(":")[1];

  await client.user.setStatus(status);

  await interaction.reply({
    content: `✅ Status değişti: **${status}**`,
    ephemeral: true,
  });


      if (interaction.isButton()) {


        if (!interaction.customId.startsWith("devcode:room:")) return;

        const room = await getRoom(client, interaction);
        if (!room) return safeReply(interaction, { content: "❌ Bu panel bir odaya bağlı değil.", ephemeral: true });

        if (!canManage(interaction, room)) {
          return safeReply(interaction, { content: "❌ Bu paneli sadece oda sahibi / yetkili kullanabilir.", ephemeral: true });
        }

        const voice = interaction.guild.channels.cache.get(room.voiceId);
        if (!voice) return safeReply(interaction, { content: "❌ Ses kanalı bulunamadı.", ephemeral: true });

        const action = interaction.customId.split(":").pop();

        if (action === "lock") {
          await voice.permissionOverwrites.edit(interaction.guild.id, { Connect: false }).catch(() => {});
          room.locked = true;
          await saveRoom(client, interaction.guildId, room);
          await updatePanel(interaction, room, buildV2Panel);
          return safeReply(interaction, { content: "🔒 Oda kilitlendi.", ephemeral: true });
        }

        if (action === "unlock") {
          await voice.permissionOverwrites.edit(interaction.guild.id, { Connect: true }).catch(() => {});
          room.locked = false;
          await saveRoom(client, interaction.guildId, room);
          await updatePanel(interaction, room, buildV2Panel);
          return safeReply(interaction, { content: "🔓 Oda açıldı.", ephemeral: true });
        }

        if (action === "hide") {
          await voice.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: false }).catch(() => {});
          room.hidden = true;
          await saveRoom(client, interaction.guildId, room);
          await updatePanel(interaction, room, buildV2Panel);
          return safeReply(interaction, { content: "👻 Oda gizlendi.", ephemeral: true });
        }

        if (action === "unhide") {
          await voice.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: true }).catch(() => {});
          room.hidden = false;
          await saveRoom(client, interaction.guildId, room);
          await updatePanel(interaction, room, buildV2Panel);
          return safeReply(interaction, { content: "👁️ Oda görünür oldu.", ephemeral: true });
        }

        if (action === "limit") {
          const modal = new ModalBuilder().setCustomId("devcode:room:limitModal").setTitle("Oda Limitini Ayarla");
          const input = new TextInputBuilder()
            .setCustomId("limit")
            .setLabel("Limit (0 = sınırsız, 1-99)")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          await interaction.showModal(modal);
          return;
        }

        if (action === "rename") {
          const modal = new ModalBuilder().setCustomId("devcode:room:renameModal").setTitle("Oda İsmini Değiştir");
          const input = new TextInputBuilder()
            .setCustomId("name")
            .setLabel("Yeni oda ismi (2-50)")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          await interaction.showModal(modal);
          return;
        }

        if (action === "permit") {
          const menu = new UserSelectMenuBuilder()
            .setCustomId("devcode:room:permitSelect")
            .setPlaceholder("İzin verilecek kullanıcıyı seç")
            .setMinValues(1)
            .setMaxValues(1);

          return interaction.reply({
            content: "✅ İzin verilecek kullanıcıyı seç:",
            components: [new ActionRowBuilder().addComponents(menu)],
            ephemeral: true,
          });
        }

        if (action === "reject") {
          const menu = new UserSelectMenuBuilder()
            .setCustomId("devcode:room:rejectSelect")
            .setPlaceholder("İzni alınacak kullanıcıyı seç")
            .setMinValues(1)
            .setMaxValues(1);

          return interaction.reply({
            content: "❌ İzni alınacak kullanıcıyı seç:",
            components: [new ActionRowBuilder().addComponents(menu)],
            ephemeral: true,
          });
        }

        if (action === "kick") {
          const members = [...voice.members.values()].filter((m) => !m.user.bot && m.id !== room.ownerId);
          if (!members.length) return safeReply(interaction, { content: "ℹ️ Odada kick’lenebilir kimse yok.", ephemeral: true });

          const menu = new StringSelectMenuBuilder()
            .setCustomId("devcode:room:kickSelect")
            .setPlaceholder("Kick atılacak kullanıcıyı seç")
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(members.slice(0, 25).map((m) => ({ label: m.displayName.slice(0, 80), value: m.id })));

          return interaction.reply({
            content: "👢 Kick atılacak kullanıcıyı seç:",
            components: [new ActionRowBuilder().addComponents(menu)],
            ephemeral: true,
          });
        }

        if (action === "transfer") {
          const menu = new UserSelectMenuBuilder()
            .setCustomId("devcode:room:transferSelect")
            .setPlaceholder("Oda devredilecek kullanıcıyı seç")
            .setMinValues(1)
            .setMaxValues(1);

          return interaction.reply({
            content: "🔁 Odayı devredeceğin kişiyi seç:",
            components: [new ActionRowBuilder().addComponents(menu)],
            ephemeral: true,
          });
        }

        if (action === "claim") {
          const allowClaim = true;
          const ownerInRoom = voice.members.has(room.ownerId);
          if (ownerInRoom) return safeReply(interaction, { content: "ℹ️ Oda sahibi odada. Claim yapılamaz.", ephemeral: true });

          room.ownerId = interaction.user.id;

          await voice.permissionOverwrites.edit(interaction.user.id, {
            ViewChannel: true,
            Connect: true,
            Speak: true,
            Stream: true,
            ManageChannels: true,
            MoveMembers: true,
          }).catch(() => {});

          await saveRoom(client, interaction.guildId, room);
          await updatePanel(interaction, room, buildV2Panel);
          return safeReply(interaction, { content: "👑 Oda sahipliği alındı (claim).", ephemeral: true });
        }

        if (action === "ban") {
          const menu = new UserSelectMenuBuilder()
            .setCustomId("devcode:room:banSelect")
            .setPlaceholder("Banlanacak kullanıcıyı seç")
            .setMinValues(1)
            .setMaxValues(1);

          return interaction.reply({
            content: "🚫 Banlanacak kullanıcıyı seç:",
            components: [new ActionRowBuilder().addComponents(menu)],
            ephemeral: true,
          });
        }

        if (action === "unban") {
          const banned = Array.isArray(room.banned) ? room.banned : [];
          if (!banned.length) return safeReply(interaction, { content: "ℹ️ Ban listesi boş.", ephemeral: true });

          const menu = new StringSelectMenuBuilder()
            .setCustomId("devcode:room:unbanSelect")
            .setPlaceholder("Unban yapılacak kullanıcıyı seç")
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(banned.slice(0, 25).map((id) => ({ label: id, value: id })));

          return interaction.reply({
            content: "✅ Unban yapılacak kişiyi seç:",
            components: [new ActionRowBuilder().addComponents(menu)],
            ephemeral: true,
          });
        }

        return safeReply(interaction, { content: "❓ Bilinmeyen işlem.", ephemeral: true });
      }

      if (interaction.isUserSelectMenu()) {
        if (!interaction.customId.startsWith("devcode:room:")) return;

        const room = await getRoom(client, interaction);
        if (!room) return safeReply(interaction, { content: "❌ Bu panel bir odaya bağlı değil.", ephemeral: true });
        if (!canManage(interaction, room)) {
          return safeReply(interaction, { content: "❌ Bu paneli sadece oda sahibi / yetkili kullanabilir.", ephemeral: true });
        }

        const voice = interaction.guild.channels.cache.get(room.voiceId);
        if (!voice) return safeReply(interaction, { content: "❌ Ses kanalı bulunamadı.", ephemeral: true });

        const userId = interaction.values?.[0];
        if (!userId) return interaction.update({ content: "❌ Kullanıcı seçilemedi.", components: [] });

        if (interaction.customId === "devcode:room:permitSelect") {
          await voice.permissionOverwrites.edit(userId, { ViewChannel: true, Connect: true }).catch(() => {});
          return interaction.update({ content: `✅ <@${userId}> için izin verildi.`, components: [] });
        }

        if (interaction.customId === "devcode:room:rejectSelect") {
          await voice.permissionOverwrites.delete(userId).catch(() => {});
          return interaction.update({ content: `❌ <@${userId}> izni kaldırıldı.`, components: [] });
        }

        if (interaction.customId === "devcode:room:transferSelect") {
  
          const oldOwner = room.ownerId;
          room.ownerId = userId;

          await voice.permissionOverwrites.edit(userId, {
            ViewChannel: true,
            Connect: true,
            Speak: true,
            Stream: true,
            ManageChannels: true,
            MoveMembers: true,
          }).catch(() => {});
          await voice.permissionOverwrites.edit(oldOwner, { ManageChannels: false, MoveMembers: false }).catch(() => {});

          await saveRoom(client, interaction.guildId, room);
          await updatePanel(interaction, room, buildV2Panel);

          return interaction.update({ content: `🔁 Oda sahipliği <@${userId}> kullanıcısına devredildi.`, components: [] });
        }

        if (interaction.customId === "devcode:room:banSelect") {
          room.banned ??= [];
          if (!room.banned.includes(userId)) room.banned.push(userId);

          await voice.permissionOverwrites.edit(userId, { Connect: false, ViewChannel: false }).catch(() => {});

          const m = await interaction.guild.members.fetch(userId).catch(() => null);
          if (m?.voice?.channelId === room.voiceId) await m.voice.setChannel(null).catch(() => {});

          await saveRoom(client, interaction.guildId, room);
          await updatePanel(interaction, room, buildV2Panel);

          return interaction.update({ content: `🚫 <@${userId}> odadan banlandı.`, components: [] });
        }
      }

      if (interaction.isStringSelectMenu()) {
        const room = await getRoom(client, interaction);
        if (!room) return safeReply(interaction, { content: "❌ Bu panel bir odaya bağlı değil.", ephemeral: true });
        if (!canManage(interaction, room)) {
          return safeReply(interaction, { content: "❌ Bu paneli sadece oda sahibi / yetkili kullanabilir.", ephemeral: true });
        }

        const voice = interaction.guild.channels.cache.get(room.voiceId);
        if (!voice) return safeReply(interaction, { content: "❌ Ses kanalı bulunamadı.", ephemeral: true });

        const userId = interaction.values?.[0];
        if (!userId) return interaction.update({ content: "❌ Seçim alınamadı.", components: [] });

        if (interaction.customId === "devcode:room:kickSelect") {
          const member = await interaction.guild.members.fetch(userId).catch(() => null);
          if (member?.voice?.channelId === room.voiceId) await member.voice.setChannel(null).catch(() => {});
          return interaction.update({ content: `👢 <@${userId}> odadan atıldı.`, components: [] });
        }

        if (interaction.customId === "devcode:room:unbanSelect") {
          room.banned ??= [];
          room.banned = room.banned.filter((x) => x !== userId);

          await voice.permissionOverwrites.delete(userId).catch(() => {});
          await saveRoom(client, interaction.guildId, room);
          await updatePanel(interaction, room, buildV2Panel);

          return interaction.update({ content: `✅ <@${userId}> unban yapıldı.`, components: [] });
        }
      }

      if (interaction.isModalSubmit()) {
        if (!interaction.customId.startsWith("devcode:room:")) return;

        const room = await getRoom(client, interaction);
        if (!room) return safeReply(interaction, { content: "❌ Bu panel bir odaya bağlı değil.", ephemeral: true });
        if (!canManage(interaction, room)) {
          return safeReply(interaction, { content: "❌ Bu paneli sadece oda sahibi / yetkili kullanabilir.", ephemeral: true });
        }

        const voice = interaction.guild.channels.cache.get(room.voiceId);
        if (!voice) return safeReply(interaction, { content: "❌ Ses kanalı bulunamadı.", ephemeral: true });

        if (interaction.customId === "devcode:room:limitModal") {
          const raw = (interaction.fields.getTextInputValue("limit") || "").trim();
          const n = Number(raw);
          if (!Number.isFinite(n) || n < 0 || n > 99) {
            return safeReply(interaction, { content: "❌ Limit 0-99 arası olmalı.", ephemeral: true });
          }

          await voice.setUserLimit(n).catch(() => {});
          room.limit = n;
          await saveRoom(client, interaction.guildId, room);
          await updatePanel(interaction, room, buildV2Panel);

          return safeReply(interaction, { content: `✅ Limit: **${n === 0 ? "Sınırsız" : n}**`, ephemeral: true });
        }

        if (interaction.customId === "devcode:room:renameModal") {
          const name = (interaction.fields.getTextInputValue("name") || "").trim();
          if (name.length < 2 || name.length > 50) {
            return safeReply(interaction, { content: "❌ İsim 2-50 karakter olmalı.", ephemeral: true });
          }

          await voice.setName(name).catch(() => {});
          room.name = name;
          await saveRoom(client, interaction.guildId, room);
          await updatePanel(interaction, room, buildV2Panel);

          return safeReply(interaction, { content: `✅ Oda ismi: **${name}**`, ephemeral: true });
        }
      }
    } catch (err) {
      console.error("interactionCreate error:", err);
      if (interaction?.isRepliable()) await safeReply(interaction, { content: "❌ Bir hata oldu.", ephemeral: true });
    }
  },

};
