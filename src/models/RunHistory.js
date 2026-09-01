const mongoose = require("mongoose");

const statsSchema = new mongoose.Schema(
    {
        vigor: {
            type: Number,
            required: true,
            min: 0
        },

        mind: {
            type: Number,
            required: true,
            min: 0
        },

        strength: {
            type: Number,
            required: true,
            min: 0
        },

        dexterity: {
            type: Number,
            required: true,
            min: 0
        },

        intelligence: {
            type: Number,
            required: true,
            min: 0
        },

        faith: {
            type: Number,
            required: true,
            min: 0
        },

        agility: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        _id: false
    }
);

const equipmentSchema = new mongoose.Schema(
    {
        weapon: {
            type: String,
            default: null
        },

        armor: {
            type: String,
            default: null
        },

        staff: {
            type: String,
            default: null
        }
    },
    {
        _id: false
    }
);

const runHistorySchema = new mongoose.Schema(
    {
        discordId: {
            type: String,
            required: true,
            index: true
        },

        race: {
            type: String,
            required: true
        },

        subrace: {
            type: String,
            required: true
        },

        stats: {
            type: statsSchema,
            required: true
        },

        equipment: {
            type: equipmentSchema,
            default: () => ({})
        },

        roomsCleared: {
            type: Number,
            required: true,
            min: 0
        },

        floorReached: {
            type: Number,
            required: true,
            min: 1,
            max: 30
        },

        goldEarned: {
            type: Number,
            required: true,
            min: 0
        },

        result: {
            type: String,
            enum: [
                "victory",
                "dead",
                "abandoned"
            ],
            required: true
        },

        startedAt: {
            type: Date,
            required: true
        },

        endedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("RunHistory", runHistorySchema);