require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");

const commands = [];
const commandsPath = path.join(process.cwd(), "Commands");
const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"));

for (const file of commandFiles) {
  const cmd = require(path.join(commandsPath, file));
  commands.push(cmd.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    // .env içine ekle: CLIENT_ID= botun application id
    const clientId = process.env.CLIENT_ID;
    if (!clientId) throw new Error("CLIENT_ID .env içinde yok!");


    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    console.log("✅ Slash komutlar yüklendi (global).");
  } catch (err) {
    console.error(err);
  }
})();