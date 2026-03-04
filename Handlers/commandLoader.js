const fs = require("fs");
const path = require("path");

module.exports = (client) => {
  client.commands = new Map();

  const commandsPath = path.join(process.cwd(), "Commands");
  if (!fs.existsSync(commandsPath)) {
    console.log("ℹ️ ./Commands klasörü yok, komut yükleme geçildi.");
    return;
  }

  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((f) => f.endsWith(".js"));

  for (const file of commandFiles) {
    const cmd = require(path.join(commandsPath, file));
    if (!cmd?.data?.name || typeof cmd.execute !== "function") {
      console.log(`⚠️ Komut format hatalı: ${file}`);
      continue;
    }

    client.commands.set(cmd.data.name, cmd);
    console.log(`✅ Komut yüklendi: /${cmd.data.name}`);
  }
};