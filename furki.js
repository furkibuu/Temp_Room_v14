require("dotenv").config();
const fs = require("fs");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const IncludedIntents = Object.values(GatewayIntentBits).reduce((acc, val) => acc | val, 0);
const client = new Client({ intents: IncludedIntents, allowedMentions: { parse: ["users", "roles"], repliedUser: true }, partials: [Partials.Message, Partials.Channel, Partials.Reaction], });

client.setMaxListeners(0);
client.getMaxListeners = () => 0;
module.exports = client;

require("./Handlers/commandLoader")(client);
if (fs.existsSync("./Handlers")) {
  if (fs.existsSync("./Handlers/eventLoader.js")) {
    require("./Handlers/eventLoader")(client);
  } else {
    const { readdirSync } = require("fs");
    readdirSync("./Handlers")
      .filter((f) => f.endsWith(".js"))
      .forEach((handler) => {
        require(`./Handlers/${handler}`)(client);
      });
  }
} else {
  console.log("ℹ️ ./Handlers klasörü yok, handler yükleme geçildi.");
}

require("./Scripts/debug")(client);



async function initDatabase() {
  const provider = (process.env.DB_PROVIDER || "mongo").toLowerCase();

  if (provider === "mongo") {
if (provider === "mongo") {
  client.db = await require("./Utils/mongo")();
  console.log("✅ DB Provider: MongoDB (adapter aktif)");
  return;
}
  }

  if (provider === "orio") {
    const createOrioDB = require("./Utils/orio");
    client.db = createOrioDB({
      fileName: process.env.ORIO_FILE || "furki-database.json",
    });

    console.log("✅ DB Provider: OrioDB (basit mod)");
    console.log("📁 Orio dosyası:", client.db.filePath);
    return;
  }

  console.warn(`⚠️ Bilinmeyen DB_PROVIDER: ${provider}. Varsayılan: mongo`);
  await require("./Utils/mongo")();
  console.log("✅ DB Provider: MongoDB (fallback)");
}

(async () => {
  try {
    if (!process.env.TOKEN) {
      console.error("❌ TOKEN .env içinde yok!");
      process.exit(1);
    }

    await initDatabase();
    await client.login(process.env.TOKEN);

    console.log("🤖 Bot giriş yaptı!");
  } catch (err) {
    console.error("❌ Başlatma hatası:", err);
    process.exit(1);
  }
})();