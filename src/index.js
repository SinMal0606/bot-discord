require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Collection
} = require("discord.js");

const configureDNS = require("./config/dns");
const connectDatabase = require("./config/database");

const interactionCreate = require("./events/interactionCreate");

configureDNS();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

client.once("clientReady", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(
    interactionCreate.name,
    (...args) => interactionCreate.execute(...args)
);

async function startBot() {
    try {
        await connectDatabase();
        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
        console.error("❌ Failed to start bot:");
        console.error(error);

        process.exit(1);
    }
}

startBot();