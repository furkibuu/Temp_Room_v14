const { readdirSync } = require("fs");
const path = require("path");

module.exports = (client) => {

    const eventsPath = path.join(__dirname, "..", "Events");

    if (!require("fs").existsSync(eventsPath)) {
        console.log("⚠️ Events klasörü bulunamadı.");
        return;
    }

    const files = readdirSync(eventsPath).filter(file => file.endsWith(".js"));

    for (const file of files) {

        const event = require(`../Events/${file}`);

        if (!event.name) {
            console.log(`⚠️ ${file} event name eksik.`);
            continue;
        }

        if (event.once) {
            client.once(event.name, (...args) => event.execute(client, ...args));
        } else {
            client.on(event.name, (...args) => event.execute(client, ...args));
        }

        console.log(`✅ Event yüklendi → ${event.name}`);
    }

};