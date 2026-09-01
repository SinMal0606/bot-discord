const ActiveRun = require("../models/ActiveRun");

const ROOM_TYPES = {
    BATTLE: "battle",
    REST: "rest",
    TREASURE: "treasure",
    SHOP: "shop"
};

const ROOM_TYPE_INFO = {
    [ROOM_TYPES.BATTLE]: {
        name: "Battle",
        emoji: "⚔️",
        description: "Fight a monster and claim a reward."
    },

    [ROOM_TYPES.REST]: {
        name: "Rest",
        emoji: "🛌",
        description: "Recover some HP and possibly Mana."
    },

    [ROOM_TYPES.TREASURE]: {
        name: "Treasure",
        emoji: "💰",
        description: "Open a mysterious treasure chest."
    },

    [ROOM_TYPES.SHOP]: {
        name: "Shop",
        emoji: "🏪",
        description: "Spend Rune to buy useful items."
    }
};

const {
    randomElement
} = require("../utils/random");

function generateRooms(count = 3) {
    const availableTypes = Object.values(ROOM_TYPES);

    if (count > availableTypes.length) {
        throw new Error(
            "Cannot generate more unique rooms than available room types."
        );
    }

    const rooms = [];
    const pool = [...availableTypes];

    for (let i = 0; i < count; i++) {
        const type = randomElement(pool);

        rooms.push({
            id: `${Date.now()}-${i}`,
            type
        });

        const index = pool.indexOf(type);

        pool.splice(index, 1);
    }

    return rooms;
}

async function completeFloor(run) {
    if (!run) {
        throw new Error("Run is required.");
    }

    if (run.floor >= 30) {
        run.currentRewards = [];
        run.currentMonster = null;
        run.currentRooms = [];
        run.status = "victory";

        await run.save();

        return run;
    }

    run.roomsCleared += 1;

    run.floor += 1;

    run.currentRewards = [];
    run.currentMonster = null;
    run.currentRooms = [];

    run.status = "choosing_room";

    await run.save();

    return run;
}

async function completeFloor(discordId) {
    const run = await ActiveRun.findOne({
        discordId
    });

    if (!run) {
        throw new Error("NO_ACTIVE_RUN");
    }

    run.roomsCleared += 1;

    run.currentRooms = [];

    if (run.floor === 30) {
        run.status = "victory";
    } else {
        run.floor += 1;
        run.status = "choosing_room";
    }

    await run.save();

    return run;
}

function getFloorType(floor) {
    if (floor === 30) {
        return "boss";
    }

    if (floor === 10 || floor === 20) {
        return "miniboss";
    }

    return "normal";
}

module.exports = {
    ROOM_TYPES,
    ROOM_TYPE_INFO,
    generateRooms,
    completeFloor,
    getFloorType
};