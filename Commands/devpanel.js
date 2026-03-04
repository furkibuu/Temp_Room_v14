const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, } = require("discord.js");

const OWNER_ID = process.env.BOT_OWNER_ID;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("devpanel")
    .setDescription("Bot geliştirici paneli (sadece bot sahibi)."),

  async execute(client, interaction) {

    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        content: "❌ Bu komutu sadece bot sahibi kullanabilir.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("⚙️ Dev Panel")
      .setDescription("Bot yönetim paneli")
      .addFields(
        { name: "Bot", value: client.user.tag, inline: true },
        { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
        { name:"Bulunduğum Sunucu", value: `${interaction.guild.name}`, inline: true},
      )
      .setThumbnail(client.user.displayAvatarURL())
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("dev:restart")
        .setLabel("🔄 Restart")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("dev:avatar")
        .setLabel("🖼 Avatar Değiştir")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("dev:name")
        .setLabel("✏️ İsim Değiştir")
        .setStyle(ButtonStyle.Secondary),

    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  },
};