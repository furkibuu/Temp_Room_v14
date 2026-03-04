const { MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, } = require("discord.js");

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
 `> **Menü**\n` +
    `- Aşağıdaki butonlarla odanızı yönetebilirsiniz.\n` 
  );

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("devcode:room:lock").setLabel("🔒 Kilitle").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("devcode:room:unlock").setLabel("🔓 Aç").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("devcode:room:hide").setLabel("👻 Gizle").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("devcode:room:unhide").setLabel("👁️ Göster").setStyle(ButtonStyle.Primary),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("devcode:room:limit").setLabel("👥 Limit").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("devcode:room:rename").setLabel("✏️ İsim").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("devcode:room:permit").setLabel("✅ İzin").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("devcode:room:reject").setLabel("❌ İzin Al").setStyle(ButtonStyle.Danger),
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("devcode:room:kick").setLabel("👢 Kick").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("devcode:room:transfer").setLabel("🔁 Transfer").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("devcode:room:claim").setLabel("👑 Claim").setStyle(ButtonStyle.Success),
  );

  const row4 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("devcode:room:ban").setLabel("🚫 Ban").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("devcode:room:unban").setLabel("✅ Unban").setStyle(ButtonStyle.Success),
  );

  const container = new ContainerBuilder()
    .addTextDisplayComponents(header)
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(info)
    .addActionRowComponents(row1)
    .addActionRowComponents(row2)
    .addActionRowComponents(row3)
    .addActionRowComponents(row4);

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

module.exports = { buildV2Panel };