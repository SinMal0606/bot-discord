const weapons = require("../../data/weapons");
const spells = require("../../data/spells");
const buffs = require("../../data/buffs");

const {
    calculateDerivedStats
} = require("./stats");

const {
    randomElement
} = require("../utils/random");

const REWARD_TYPES = [
    "weapon",
    "spell",
    "buff"
];

function createRandomReward() {
    const type = randomElement(REWARD_TYPES);

    if (type === "weapon") {
        const item = randomElement(weapons);

        return {
            type: "weapon",
            id: item.id
        };
    }

    if (type === "spell") {
        const item = randomElement(spells);

        return {
            type: "spell",
            id: item.id
        };
    }

    if (type === "buff") {
        const item = randomElement(buffs);

        return {
            type: "buff",
            id: item.id
        };
    }

    throw new Error(`Unsupported reward type: ${type}`);
}

function generateRewards(count = 3) {
    if (count <= 0) {
        return [];
    }

    const rewards = [];
    const usedKeys = new Set();

    let attempts = 0;
    const maxAttempts = 100;

    while (
        rewards.length < count &&
        attempts < maxAttempts
    ) {
        attempts++;

        const reward = createRandomReward();

        const key = `${reward.type}:${reward.id}`;

        if (usedKeys.has(key)) {
            continue;
        }

        usedKeys.add(key);
        rewards.push(reward);
    }

    return rewards;
}

function getRewardInfo(reward) {
    if (!reward || !reward.type || !reward.id) {
        throw new Error("Invalid reward.");
    }

    if (reward.type === "weapon") {
        const item = weapons.find(
            weapon => weapon.id === reward.id
        );

        if (!item) {
            throw new Error(
                `Weapon not found: ${reward.id}`
            );
        }

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

        if (!item) {
            throw new Error(
                `Spell not found: ${reward.id}`
            );
        }

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

        if (!item) {
            throw new Error(
                `Buff not found: ${reward.id}`
            );
        }

        return {
            emoji: "📈",
            name: item.name,
            description: item.description
        };
    }

    throw new Error(
        `Unsupported reward type: ${reward.type}`
    );
}

function grantReward(run, reward) {
    if (!run) {
        throw new Error("Run is required.");
    }

    if (!reward) {
        throw new Error("Reward is required.");
    }

    if (
        !REWARD_TYPES.includes(reward.type)
    ) {
        throw new Error(
            `Unsupported reward type: ${reward.type}`
        );
    }

    if (reward.type === "buff") {
        const buff = buffs.find(
            item => item.id === reward.id
        );

        if (!buff) {
            throw new Error(
                `Buff not found: ${reward.id}`
            );
        }

        const stat = buff.effect.stat;
        const amount = buff.effect.amount;

        run.stats[stat] += amount;

        const derivedStats =
            calculateDerivedStats(run.stats);

        const hpDifference =
            derivedStats.maxHp - run.maxHp;

        const manaDifference =
            derivedStats.maxMana - run.maxMana;

        run.maxHp = derivedStats.maxHp;
        run.maxMana = derivedStats.maxMana;

        run.hp += hpDifference;
        run.mana += manaDifference;

        return {
            type: "buff",
            id: reward.id,
            name: buff.name,
            message:
                `${buff.name}: +${amount} ${stat}`
        };
    }

    if (reward.type === "weapon") {
        const weapon = weapons.find(
            item => item.id === reward.id
        );

        if (!weapon) {
            throw new Error(
                `Weapon not found: ${reward.id}`
            );
        }

        run.inventory.push({
            type: "weapon",
            id: reward.id
        });

        return {
            type: "weapon",
            id: reward.id,
            name: weapon.name,
            message:
                `${weapon.name} added to inventory.`
        };
    }

    if (reward.type === "spell") {
        const spell = spells.find(
            item => item.id === reward.id
        );

        if (!spell) {
            throw new Error(
                `Spell not found: ${reward.id}`
            );
        }

        run.inventory.push({
            type: "spell",
            id: reward.id
        });

        return {
            type: "spell",
            id: reward.id,
            name: spell.name,
            message:
                `${spell.name} added to inventory.`
        };
    }
}

module.exports = {
    REWARD_TYPES,
    createRandomReward,
    generateRewards,
    getRewardInfo,
    grantReward
};