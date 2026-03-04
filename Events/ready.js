const { ActivityType } = require("discord.js");

module.exports = {
  name: "ready",
  once: true,

  async execute(client) {

    try {
      client.user.setActivity({name: process.env.ACTIVITY_NAME || "Furkibu <3 Devcode", type: ActivityType.Custom});
      console.log(`✅ ${client.user.tag} aktif!`);

      const provider = (process.env.DB_PROVIDER || "mongo").toLowerCase();
      const dbName = client.db?.provider ? client.db.provider : provider;
      console.log(`🗄️ DB Provider: ${dbName}`);

      const panelId = process.env.TEMP_PANEL_VOICE_ID || "YOK";
      const catId = process.env.TEMP_CATEGORY_ID || "YOK";
      console.log(`🎛️ Temp Panel Voice ID: ${panelId}`);
      console.log(`📁 Temp Category ID: ${catId}`);
      const recoveryEnabled = String(process.env.TEMP_RECOVERY ?? "true") === "true";

      if (!recoveryEnabled) {
        console.log("🔄 Recovery kapalı (TEMP_RECOVERY=false).");
        return;
      }

      if (!client.db?.get || !client.db?.set || !client.db?.delete) {
        console.log("🔄 Recovery atlandı (client.db adapter yok).");
        return;
      }

      console.log("🔄 Recovery: Temp oda kayıtları kontrol ediliyor...")

      console.log("ℹ️ Not: Mongo KV yapısında prefix listeleme olmadığı için otomatik tarama sınırlı.");
      console.log("✅ Ready tamamlandı.");
    } catch (err) {
      console.error("ready event error:", err);
    }
  },
};