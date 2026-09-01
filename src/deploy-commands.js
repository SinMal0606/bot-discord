require("dotenv").config();

const {
    REST,
    Routes,
    SlashCommandBuilder
} = require("discord.js");

const commands = [
    new SlashCommandBuilder()
        .setName("start-run")
        .setDescription("Start a new dungeon run"),

    new SlashCommandBuilder()
        .setName("abandon-run")
        .setDescription("Abandon your current dungeon run")
].map(command => command.toJSON());

const rest = new REST({
    version: "10"
}).setToken(process.env.DISCORD_TOKEN);

async function deployCommands() {
    try {
        console.log("⏳ Registering slash commands...");

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            {
                body: commands
            }
        );

        console.log("✅ Slash commands registered");
    } catch (error) {
        console.error("❌ Failed to register slash commands:");
        console.error(error);
    }
}

deployCommands();