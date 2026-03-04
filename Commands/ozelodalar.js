const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType, } = require("discord.js");

function indexKey(guildId) {
  return `tempRoomsIndex.${guildId}`;
}
function roomKey(guildId, voiceId) {
  return `tempRoomsByVoice.${guildId}.${voiceId}`;
}
function ownerKey(guildId, ownerId) {
  return `tempRoomsByOwner.${guildId}.${ownerId}`;
}

async function getIndex(db, guildId) {
  const list = (await db.get(indexKey(guildId))) || [];
  return Array.isArray(list) ? list : [];
}
async function setIndex(db, guildId, list) {
  await db.set(indexKey(guildId), list);
}

function fmtMs(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}g ${h % 24}s`;
  if (h > 0) return `${h}s ${m % 60}dk`;
  if (m > 0) return `${m}dk ${s % 60}sn`;
  return `${s}sn`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ozelodalar")
    .setDescription("Özel oda sistemi yönetimi (Admin).")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((sc) =>
      sc.setName("say").setDescription("Aktif özel oda sayısını gösterir.")
    )
    .addSubcommand((sc) =>
      sc.setName("liste").setDescription("Aktif özel odaları listeler (max 20).")
    )
    .addSubcommand((sc) =>
      sc
        .setName("temizle")
        .setDescription("DB'de kalmış bozuk oda kayıtlarını temizler.")
    )
    .addSubcommand((sc) =>
      sc
        .setName("bilgi")
        .setDescription("Belirli bir özel oda hakkında bilgi verir.")
        .addChannelOption((o) =>
          o
            .setName("oda")
            .setDescription("Ses odasını seç")
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName("sil")
        .setDescription("Belirli bir özel odayı siler (kanal + DB).")
        .addChannelOption((o) =>
          o
            .setName("oda")
            .setDescription("Ses odasını seç")
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        )
        .addStringOption((o) =>
          o
            .setName("sebep")
            .setDescription("Log için sebep (opsiyonel)")
            .setRequired(false)
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName("sahip")
        .setDescription("Odanın sahibini değiştirir (transfer).")
        .addChannelOption((o) =>
          o
            .setName("oda")
            .setDescription("Ses odasını seç")
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        )
        .addUserOption((o) =>
          o
            .setName("kisi")
            .setDescription("Yeni sahip")
            .setRequired(true)
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName("yenile")
        .setDescription("Seçilen odanın V2 panel mesajını yeniden basar.")
        .addChannelOption((o) =>
          o
            .setName("oda")
            .setDescription("Ses odasını seç")
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        )
    ),

  async execute(client, interaction) {
    const db = client.db;
    if (!db?.get || !db?.set || !db?.delete) {
      return interaction.reply({
        content: "❌ Veritabanı adapter bulunamadı (client.db yok).",
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();
    const gid = interaction.guildId;

    if (sub === "say") {
      const list = await getIndex(db, gid);

      let alive = 0;
      for (const voiceId of list) {
        const ch = interaction.guild.channels.cache.get(voiceId);
        if (ch) alive++;
      }

      return interaction.reply({
        content: `✅ Aktif özel oda sayısı: **${alive}**`,
        ephemeral: true,
      });
    }

    if (sub === "liste") {
      const list = await getIndex(db, gid);

      const lines = [];
      for (const voiceId of list.slice(0, 20)) {
        const room = await db.get(roomKey(gid, voiceId));
        const ch = interaction.guild.channels.cache.get(voiceId);

        if (!room || !ch) continue;

        const locked = room.locked ? "🔒" : "🔓";
        const hidden = room.hidden ? "👻" : "👁️";
        const limit = typeof room.limit === "number" ? room.limit : "-";
        lines.push(
          `• ${ch} ${locked}${hidden} (Limit: ${limit}) — 👑 <@${room.ownerId}>`
        );
      }

      const embed = new EmbedBuilder()
        .setTitle("📋 Aktif Özel Odalar")
        .setDescription(lines.length ? lines.join("\n") : "Şu an aktif oda yok.")
        .setFooter({ text: "DevCode Temp Room V2" });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "temizle") {
      const list = await getIndex(db, gid);
      let cleaned = 0;

      const next = [];
      for (const voiceId of list) {
        const ch = interaction.guild.channels.cache.get(voiceId);
        const room = await db.get(roomKey(gid, voiceId));

        if (!ch || !room) {
          await db.delete(roomKey(gid, voiceId)).catch(() => {});
          cleaned++;
          continue;
        }

        next.push(voiceId);
      }

      await setIndex(db, gid, next);

      return interaction.reply({
        content: `🧹 Temizlik tamamlandı. Silinen bozuk kayıt: **${cleaned}** | Kalan aktif kayıt: **${next.length}**`,
        ephemeral: true,
      });
    }

    if (sub === "bilgi") {
      const oda = interaction.options.getChannel("oda", true);
      const room = await db.get(roomKey(gid, oda.id));

      if (!room) {
        return interaction.reply({
          content: "❌ Bu kanal bir özel oda kaydıyla eşleşmiyor.",
          ephemeral: true,
        });
      }

      const created = room.createdAt ? fmtMs(Date.now() - room.createdAt) : "—";
      const embed = new EmbedBuilder()
        .setTitle("ℹ️ Özel Oda Bilgisi")
        .addFields(
          { name: "Oda", value: `${oda}`, inline: true },
          { name: "Sahip", value: `<@${room.ownerId}>`, inline: true },
          { name: "Durum", value: `${room.locked ? "🔒 Kilitli" : "🔓 Açık"} • ${room.hidden ? "👻 Gizli" : "👁️ Görünür"}`, inline: false },
          { name: "Limit", value: `**${typeof room.limit === "number" ? room.limit : "—"}**`, inline: true },
          { name: "Banlı", value: `**${Array.isArray(room.banned) ? room.banned.length : 0}**`, inline: true },
          { name: "Yaş", value: `**${created}**`, inline: true },
        )
        .setFooter({ text: "DevCode Temp Room V2" });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "sil") {
      const oda = interaction.options.getChannel("oda", true);
      const reason = interaction.options.getString("sebep") || "Admin tarafından silindi.";
      const room = await db.get(roomKey(gid, oda.id));

      if (!room) {
        return interaction.reply({
          content: "❌ Bu kanal bir özel oda kaydıyla eşleşmiyor.",
          ephemeral: true,
        });
      }

      const ch = interaction.guild.channels.cache.get(room.voiceId);
      if (ch) await ch.delete(reason).catch(() => {});

      await db.delete(roomKey(gid, room.voiceId)).catch(() => {});
      await db.delete(ownerKey(gid, room.ownerId)).catch(() => {});

      const list = await getIndex(db, gid);
      const next = list.filter((id) => id !== room.voiceId);
      await setIndex(db, gid, next);

      return interaction.reply({
        content: `🗑️ Oda silindi: <#${room.voiceId}> | Sebep: **${reason}**`,
        ephemeral: true,
      });
    }

    if (sub === "sahip") {
      const oda = interaction.options.getChannel("oda", true);
      const kisi = interaction.options.getUser("kisi", true);

      const room = await db.get(roomKey(gid, oda.id));
      if (!room) {
        return interaction.reply({
          content: "❌ Bu kanal bir özel oda kaydıyla eşleşmiyor.",
          ephemeral: true,
        });
      }

      const voice = interaction.guild.channels.cache.get(room.voiceId);
      if (!voice) {
        return interaction.reply({
          content: "❌ Ses kanalı bulunamadı.",
          ephemeral: true,
        });
      }

      const oldOwner = room.ownerId;
      room.ownerId = kisi.id;

      await voice.permissionOverwrites.edit(kisi.id, {
        ViewChannel: true,
        Connect: true,
        Speak: true,
        Stream: true,
        ManageChannels: true,
        MoveMembers: true,
      }).catch(() => {});
      await voice.permissionOverwrites.edit(oldOwner, {
        ManageChannels: false,
        MoveMembers: false,
      }).catch(() => {});

      await db.set(roomKey(gid, room.voiceId), room).catch(() => {});
      await db.delete(ownerKey(gid, oldOwner)).catch(() => {});
      await db.set(ownerKey(gid, kisi.id), room.voiceId).catch(() => {});

      return interaction.reply({
        content: `🔁 Oda sahipliği değişti: <#${room.voiceId}> → <@${kisi.id}>`,
        ephemeral: true,
      });
    }

    if (sub === "yenile") {
      const oda = interaction.options.getChannel("oda", true);
      const room = await db.get(roomKey(gid, oda.id));

      if (!room) {
        return interaction.reply({
          content: "❌ Bu kanal bir özel oda kaydıyla eşleşmiyor.",
          ephemeral: true,
        });
      }

      const voice = interaction.guild.channels.cache.get(room.voiceId);
      if (!voice) {
        return interaction.reply({
          content: "❌ Ses kanalı bulunamadı.",
          ephemeral: true,
        });
      }

      const { buildV2Panel } = require("../Events/_panelShared");

      const msg = await voice.send(buildV2Panel(room)).catch(() => null);
      if (!msg) {
        return interaction.reply({
          content: "❌ Panel mesajı gönderilemedi (botun voice chat yazma izni var mı?).",
          ephemeral: true,
        });
      }

      room.panelMessageId = msg.id;
      await db.set(roomKey(gid, room.voiceId), room).catch(() => {});

      return interaction.reply({
        content: `✅ Panel yenilendi: <#${room.voiceId}>`,
        ephemeral: true,
      });
    }
  },
};