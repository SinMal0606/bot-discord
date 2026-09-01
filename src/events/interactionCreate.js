const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events,
    MessageFlags
} = require("discord.js");

const {
    createNewRun,
    abandonRun
} = require("../game/run");
const { createRunEmbed } = require("../utils/embeds");

const ActiveRun = require("../models/ActiveRun");

const {
    generateRooms,
    ROOM_TYPE_INFO,
    getFloorType,
    completeFloor
} = require("../game/dungeon");

const {
    getRewardInfo,
    grantReward
} = require("../game/rewards");

const {
    completeFloor
} = require("../game/dungeon");

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === "start-run") {
                await handleStartRun(interaction);
            }

            if (interaction.commandName === "abandon-run") {
                await handleAbandonRun(interaction);
            }

            return;
        }

        if (interaction.isButton()) {
            await handleButton(interaction);

            return;
        }
    }
};

function createRewardButtons(
    interaction,
    rewards
) {
    const buttons = rewards.map(
        reward => {
            const info =
                getRewardInfo(reward);

            return new ButtonBuilder()
                .setCustomId(
                    `reward_select:${interaction.user.id}:${reward.type}:${reward.id}`
                )
                .setLabel(info.name)
                .setEmoji(info.emoji)
                .setStyle(ButtonStyle.Primary);
        }
    );

    return new ActionRowBuilder()
        .addComponents(buttons);
}

async function handleStartRun(interaction) {
    try {
        const result = await createNewRun(
            interaction.user.id,
            interaction.user.username,
            interaction.user.displayAvatarURL({
                extension: "png",
                size: 256
            })
        );

        const enterDungeonButton = new ButtonBuilder()
            .setCustomId(`run_enter_dungeon:${interaction.user.id}`)
            .setLabel("Enter Dungeon")
            .setEmoji("⚔️")
            .setStyle(ButtonStyle.Primary);

        const abandonRunButton = new ButtonBuilder()
            .setCustomId(`run_abandon:${interaction.user.id}`)
            .setLabel("Abandon Run")
            .setEmoji("🏃")
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder()
            .addComponents(
                enterDungeonButton,
                abandonRunButton
            );

        await interaction.reply({
            embeds: [
                createRunEmbed(result)
            ],
            components: [row]
        });

    } catch (error) {
        if (error.message === "PLAYER_ALREADY_IN_RUN") {
            await interaction.reply({
                content: "❌ You already have an active run.",
                ephemeral: true
            });

            return;
        }

        console.error("❌ Failed to start run:");
        console.error(error);

        await interaction.reply({
            content: "❌ Something went wrong while starting your run.",
            ephemeral: true
        });
    }
}

async function handleButton(interaction) {
    const parts = interaction.customId.split(":");

    const action = parts[0];
    const discordId = parts[1];

    if (discordId !== interaction.user.id) {
        await interaction.reply({
            content: "❌ This action does not belong to you.",
            flags: MessageFlags.Ephemeral
        });

        return;
    }

    if (action === "run_enter_dungeon") {
        await handleEnterDungeon(interaction);

        return;
    }

    if (action === "run_abandon") {
        await handleAbandonButton(interaction);

        return;
    }

    if (action === "room_select") {
        const roomId = parts[2];

        await handleRoomSelection(
            interaction,
            roomId
        );
    }

    if (action === "reward_select") {
        const rewardType = parts[2];
        const rewardId = parts[3];

        await handleRewardSelection(
            interaction,
            rewardType,
            rewardId
        );

        return;
    }
}

async function handleEnterDungeon(interaction) {
    try {
        const run = await ActiveRun.findOne({
            discordId: interaction.user.id
        });

        if (!run) {
            await interaction.reply({
                content: "❌ You don't have an active run.",
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        if (run.status !== "preparing") {
            await interaction.reply({
                content: "❌ You cannot enter the dungeon right now.",
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        const floorType = getFloorType(run.floor);

        // Floor 10 và 20
        if (floorType === "miniboss") {
            run.currentRooms = [];
            run.status = "combat";

            await run.save();

            await interaction.update({
                content:
                    `⚔️ **Floor ${run.floor} — MINIBOSS**\n\n` +
                    `Prepare yourself for a dangerous enemy!`,
                embeds: [],
                components: []
            });

            return;
        }

        // Floor 30
        if (floorType === "boss") {
            run.currentRooms = [];
            run.status = "combat";

            await run.save();

            await interaction.update({
                content:
                    `👑 **Floor ${run.floor} — BOSS**\n\n` +
                    `The final battle awaits.`,
                embeds: [],
                components: []
            });

            return;
        }

        // Floor bình thường
        const rooms = generateRooms(3);

        run.currentRooms = rooms;
        run.status = "choosing_room";

        await run.save();

        const buttons = rooms.map((room, index) => {
            const info = ROOM_TYPE_INFO[room.type];

            return new ButtonBuilder()
                .setCustomId(
                    `room_select:${interaction.user.id}:${room.id}`
                )
                .setLabel(`${index + 1}. ${info.name}`)
                .setEmoji(info.emoji)
                .setStyle(ButtonStyle.Primary);
        });

        const row = new ActionRowBuilder()
            .addComponents(buttons);

        await interaction.update({
            content:
                `🗺️ **Floor ${run.floor}**\n\n` +
                `Choose your next room:`,
            embeds: [],
            components: [row]
        });

    } catch (error) {
        console.error("❌ Failed to enter dungeon:");
        console.error(error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: "❌ Failed to enter the dungeon.",
                flags: MessageFlags.Ephemeral
            });
        }
    }
}

async function handleAbandonRun(interaction) {
    try {
        const run = await abandonRun(interaction.user.id);

        await interaction.reply({
            content:
                `🏃 Run abandoned.\n` +
                `You reached Floor **${run.floor}** ` +
                `and cleared **${run.roomsCleared}** rooms.`,
            flags: MessageFlags.Ephemeral
        });
    } catch (error) {
        if (error.message === "NO_ACTIVE_RUN") {
            await interaction.reply({
                content: "❌ You don't have an active run.",
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        console.error("❌ Failed to abandon run:");
        console.error(error);

        await interaction.reply({
            content: "❌ Failed to abandon your run.",
            flags: MessageFlags.Ephemeral
        });
    }
}

async function handleAbandonButton(interaction) {
    try {
        const run = await abandonRun(interaction.user.id);

        await interaction.update({
            content:
                `🏃 **Run abandoned.**\n\n` +
                `Floor reached: **${run.floor}**\n` +
                `Rooms cleared: **${run.roomsCleared}**`,
            embeds: [],
            components: []
        });
    } catch (error) {
        if (error.message === "NO_ACTIVE_RUN") {
            await interaction.reply({
                content: "❌ You don't have an active run.",
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        console.error(error);

        await interaction.reply({
            content: "❌ Failed to abandon your run.",
            flags: MessageFlags.Ephemeral
        });
    }
}

async function handleRoomSelection(interaction, roomId) {
    try {
        const run = await ActiveRun.findOne({
            discordId: interaction.user.id
        });

        if (!run) {
            await interaction.reply({
                content: "❌ You don't have an active run.",
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        if (run.status !== "choosing_room") {
            await interaction.reply({
                content: "❌ You cannot choose a room right now.",
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        const room = run.currentRooms.find(
            room => room.id === roomId
        );

        if (!room) {
            await interaction.reply({
                content: "❌ This room is no longer available.",
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        const roomInfo = ROOM_TYPE_INFO[room.type];

        run.currentRooms = [];
        await run.save();

        console.log(
            `${interaction.user.username} selected ${room.type}`
        );

        if (room.type === "battle") {
            await handleBattleRoom(
                interaction,
                run,
                room
            );

            return;
        }

        if (room.type === "rest") {
            await handleRestRoom(
                interaction,
                run,
                room
            );

            return;
        }

        if (room.type === "treasure") {
            await handleTreasureRoom(
                interaction,
                run,
                room
            );

            return;
        }

        if (room.type === "shop") {
            await handleShopRoom(
                interaction,
                run,
                room
            );

            return;
        }

        await interaction.reply({
            content:
                `❌ Unsupported room type: ${roomInfo.name}`,
            flags: MessageFlags.Ephemeral
        });

    } catch (error) {
        console.error("❌ Failed to select room:");
        console.error(error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: "❌ Failed to enter the room.",
                flags: MessageFlags.Ephemeral
            });
        }
    }
}

async function handleBattleRoom(interaction, run, room) {
    await interaction.update({
        content:
            "⚔️ **Battle Room**\n\n" +
            "Combat system is coming next!",
        embeds: [],
        components: []
    });
}
async function handleRestRoom(interaction, run, room) {
    await interaction.update({
        content:
            "🛌 **Rest Room**\n\n" +
            "Rest system is coming next!",
        embeds: [],
        components: []
    });
}
async function handleTreasureRoom(interaction, run, room) {
    await interaction.update({
        content:
            "💰 **Treasure Room**\n\n" +
            "Treasure system is coming next!",
        embeds: [],
        components: []
    });
}
async function handleShopRoom(interaction, run, room) {
    await interaction.update({
        content:
            "🏪 **Shop Room**\n\n" +
            "Shop system is coming next!",
        embeds: [],
        components: []
    });
}

async function handleRewardSelection(
    interaction,
    rewardType,
    rewardId
) {
    try {
        const run = await ActiveRun.findOne({
            discordId: interaction.user.id
        });

        if (!run) {
            await interaction.reply({
                content:
                    "❌ You don't have an active run.",
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        if (run.status !== "choosing_reward") {
            await interaction.reply({
                content:
                    "❌ You cannot choose a reward right now.",
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        const reward = run.currentRewards.find(
            reward =>
                reward.type === rewardType &&
                reward.id === rewardId
        );

        if (!reward) {
            await interaction.reply({
                content:
                    "❌ This reward is no longer available.",
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        const rewardResult =
            grantReward(run, reward);

        const floorCompleted =
            run.floor;

        await completeFloor(run);

        const rooms = generateRooms(3);

        run.currentRooms = rooms;

        await run.save();

        const info =
            getRewardInfo(reward);

        await interaction.update({
            content:
                `🎉 **Reward claimed!**\n\n` +
                `${info.emoji} **${info.name}**\n` +
                `${rewardResult.message}\n\n` +
                `✅ Floor **${floorCompleted}** completed.`,
            embeds: [],
            components: []
        });

    } catch (error) {
        console.error(
            "❌ Failed to claim reward:"
        );

        console.error(error);

        if (!interaction.replied &&
            !interaction.deferred) {
            await interaction.reply({
                content:
                    "❌ Failed to claim reward.",
                flags: MessageFlags.Ephemeral
            });
        }
    }
}