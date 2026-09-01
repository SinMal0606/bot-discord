const ActiveRun = require("../models/ActiveRun");
const User = require("../models/User");

const races = require("../../data/races");

const {
    calculateFinalStats,
    calculateDerivedStats
} = require("./stats");

const {
    randomElement
} = require("../utils/random");
async function createNewRun(discordId, username, avatar) {
    // 1. Check user
    let user = await User.findOne({ discordId });

    if (!user) {
        user = await User.create({
            discordId,
            username,
            avatar,
            gold: 0,
            savedBuilds: []
        });
    } else {
        // Cập nhật thông tin Discord mới nhất
        user.username = username;
        user.avatar = avatar;

        await user.save();
    }

    // 2. Check active run
    const existingRun = await ActiveRun.findOne({ discordId });

    if (existingRun) {
        throw new Error("PLAYER_ALREADY_IN_RUN");
    }

    // 3. Random race
    const race = randomElement(races);

    // 4. Random subrace thuộc race
    const subrace = randomElement(race.subraces);

    // 5. Calculate stats
    const finalStats = calculateFinalStats(
        race.baseStats,
        subrace.statModifiers
    );

    // 6. Calculate derived stats
    const derivedStats = calculateDerivedStats(finalStats);

    // 7. Create active run
    const run = await ActiveRun.create({
        discordId,

        race: race.id,
        subrace: subrace.id,

        stats: finalStats,

        hp: derivedStats.maxHp,
        maxHp: derivedStats.maxHp,

        mana: derivedStats.maxMana,
        maxMana: derivedStats.maxMana,

        rune: 0,

        floor: 1,
        roomsCleared: 0,

        equipment: {
            weapon: null,
            armor: null,
            staff: null
        },

        inventory: [],

        status: "preparing"
    });

    return {
        user,
        run,
        race,
        subrace,
        derivedStats
    };
}

async function abandonRun(discordId) {
    const run = await ActiveRun.findOneAndDelete({
        discordId
    });

    if (!run) {
        throw new Error("NO_ACTIVE_RUN");
    }

    return run;
}

module.exports = {
    createNewRun,
    abandonRun
};