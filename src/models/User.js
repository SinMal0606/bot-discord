const mongoose = require("mongoose");

const savedBuildSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
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
            vigor: {
                type: Number,
                required: true,
                default: 10
            },

            mind: {
                type: Number,
                required: true,
                default: 10
            },

            strength: {
                type: Number,
                required: true,
                default: 10
            },

            dexterity: {
                type: Number,
                required: true,
                default: 10
            },

            intelligence: {
                type: Number,
                required: true,
                default: 10
            },

            faith: {
                type: Number,
                required: true,
                default: 10
            },

            agility: {
                type: Number,
                required: true,
                default: 10
            }
        },

        equipment: {
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
        }
    },
    {
        _id: false
    }
);

const userSchema = new mongoose.Schema(
    {
        discordId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        username: {
            type: String,
            required: true
        },

        avatar: {
            type: String,
            default: null
        },

        gold: {
            type: Number,
            default: 0,
            min: 0
        },

        savedBuilds: {
            type: [savedBuildSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);