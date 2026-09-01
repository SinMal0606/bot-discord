const { EmbedBuilder } = require("discord.js");
const weapons = require("../../data/weapons");
const spells = require("../../data/spells");
const buffs = require("../../data/buffs");

function createRunEmbed(result) {
    const {
        race,
        subrace,
        run,
        derivedStats
    } = result;

    const stats = run.stats;
    const resistances = derivedStats.resistances;

    const embed = new EmbedBuilder()
        .setTitle("⚔️ NEW RUN")
        .setDescription(
            `**${race.name}** — ${subrace.name}\n\n` +
            `Your journey into the dungeon begins.`
        )
        .addFields(
            {
                name: "📊 Stats",
                value:
                    `❤️ **Vigor:** ${stats.vigor}\n` +
                    `💙 **Mind:** ${stats.mind}\n` +
                    `💪 **Strength:** ${stats.strength}\n` +
                    `🏹 **Dexterity:** ${stats.dexterity}\n` +
                    `🧠 **Intelligence:** ${stats.intelligence}\n` +
                    `✨ **Faith:** ${stats.faith}\n` +
                    `🍃 **Agility:** ${stats.agility}`,
                inline: true
            },
            {
                name: "⚔️ Combat Stats",
                value:
                    `❤️ **HP:** ${run.hp}/${run.maxHp}\n` +
                    `💙 **Mana:** ${run.mana}/${run.maxMana}\n\n` +
                    `🛡 **Physical:** ${resistances.physical}\n` +
                    `🔥 **Fire:** ${resistances.fire}\n` +
                    `⚡ **Lightning:** ${resistances.lightning}\n` +
                    `🔮 **Magic:** ${resistances.magic}\n` +
                    `✝️ **Holy:** ${resistances.holy}\n` +
                    `💨 **Dodge:** ${derivedStats.dodgeChance}%`,
                inline: true
            },
            {
                name: "💰 Resources",
                value:
                    `Rune: **${run.rune}**\n` +
                    `Floor: **${run.floor}**\n` +
                    `Rooms Cleared: **${run.roomsCleared}**`,
                inline: false
            }
        )
        .setFooter({
            text: "Choose your next action."
        });

    return embed;
}

function formatCombatResult(result) {
    const lines = [];

    const playerResult = result.playerResult;

    if (playerResult.action === "weapon") {
        lines.push(
            `⚔️ You used **${playerResult.weapon.name}**.`
        );

        lines.push(
            `💥 Dealt **${playerResult.damage.totalDamage}** damage.`
        );
    }

    if (playerResult.action === "spell") {
        lines.push(
            `✨ You cast **${playerResult.spell.name}**.`
        );

        if (playerResult.result.type === "damage") {
            lines.push(
                `💥 Dealt **${playerResult.result.result.totalDamage}** damage.`
            );
        }

        if (playerResult.result.type === "heal") {
            lines.push(
                `❤️ Restored **${playerResult.result.result.healAmount} HP**.`
            );
        }

        if (playerResult.result.type === "buff") {
            lines.push(
                `🛡️ Applied **${playerResult.result.result.amount}** resistance.`
            );
        }
    }

    if (result.monsterResult) {
        const monsterResult = result.monsterResult;

        lines.push("");

        lines.push(
            `👹 **${monsterResult.attack.name}**`
        );

        if (monsterResult.dodged) {
            lines.push(
                "💨 You dodged the attack!"
            );
        } else {
            lines.push(
                `💥 You took **${monsterResult.totalDamage}** damage.`
            );
        }
    }

    return lines.join("\n");
}

function getRewardInfo(reward) {
    if (reward.type === "weapon") {
        const item = weapons.find(
            weapon => weapon.id === reward.id
        );

        return {
            emoji: "⚔️",
            name: item.name,
            description: item.description
        };
    }

    if (reward.type === "spell") {
        const item = spells.find(
            spell => spell.id === reward.id
        );

        return {
            emoji: "✨",
            name: item.name,
            description: item.description
        };
    }

    if (reward.type === "buff") {
        const item = buffs.find(
            buff => buff.id === reward.id
        );

        return {
            emoji: "📈",
            name: item.name,
            description: item.description
        };
    }

    throw new Error(
        `Unknown reward type: ${reward.type}`
    );
}

module.exports = {
    createRunEmbed,
    formatCombatResult,
    getRewardInfo
};