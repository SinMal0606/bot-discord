const mongoose = require("mongoose");

const DAMAGE_TYPES = [
    "physical",
    "magic",
    "fire",
    "lightning",
    "holy"
];

const STAT_NAMES = [
    "vigor",
    "mind",
    "strength",
    "dexterity",
    "intelligence",
    "faith",
    "agility"
];

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

const roomSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true
        },

        type: {
            type: String,
            enum: [
                "battle",
                "rest",
                "treasure",
                "shop"
            ],
            required: true
        }
    },
    {
        _id: false
    }
);

const damageSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: DAMAGE_TYPES,
            required: true
        },

        base: {
            type: Number,
            required: true,
            min: 0
        },

        scaling: {
            vigor: {
                type: Number,
                default: 0
            },

            mind: {
                type: Number,
                default: 0
            },

            strength: {
                type: Number,
                default: 0
            },

            dexterity: {
                type: Number,
                default: 0
            },

            intelligence: {
                type: Number,
                default: 0
            },

            faith: {
                type: Number,
                default: 0
            },

            agility: {
                type: Number,
                default: 0
            }
        }
    },
    {
        _id: false
    }
);

const attackSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true
        },

        name: {
            type: String,
            required: true
        },

        weight: {
            type: Number,
            required: true,
            min: 0
        },

        damage: {
            type: [damageSchema],
            default: []
        }
    },
    {
        _id: false
    }
);

const resistanceSchema = new mongoose.Schema(
    {
        physical: {
            type: Number,
            default: 0
        },

        magic: {
            type: Number,
            default: 0
        },

        fire: {
            type: Number,
            default: 0
        },

        lightning: {
            type: Number,
            default: 0
        },

        holy: {
            type: Number,
            default: 0
        }
    },
    {
        _id: false
    }
);

const currentMonsterSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true
        },

        name: {
            type: String,
            required: true
        },

        hp: {
            type: Number,
            required: true,
            min: 0
        },

        maxHp: {
            type: Number,
            required: true,
            min: 1
        },

        attackPower: {
            type: Number,
            required: true,
            min: 0
        },

        resistances: {
            type: resistanceSchema,
            default: () => ({})
        },

        attacks: {
            type: [attackSchema],
            default: []
        }
    },
    {
        _id: false
    }
);

const buffSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true
        },

        type: {
            type: String,
            required: true
        },

        amount: {
            type: Number,
            required: true
        },

        remainingTurns: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        _id: false
    }
);

const rewardSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: [
                "weapon",
                "armor",
                "staff",
                "spell",
                "buff"
            ],
            required: true
        },

        id: {
            type: String,
            required: true
        }
    },
    {
        _id: false
    }
);

const activeRunSchema = new mongoose.Schema(
    {
        discordId: {
            type: String,
            required: true,
            unique: true,
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

        hp: {
            type: Number,
            required: true,
            min: 0
        },

        maxHp: {
            type: Number,
            required: true,
            min: 1
        },

        mana: {
            type: Number,
            required: true,
            min: 0
        },

        maxMana: {
            type: Number,
            required: true,
            min: 0
        },

        rune: {
            type: Number,
            default: 0,
            min: 0
        },

        floor: {
            type: Number,
            default: 1,
            min: 1,
            max: 30
        },

        roomsCleared: {
            type: Number,
            default: 0,
            min: 0,
            max: 30
        },

        currentRooms: {
            type: [roomSchema],
            default: []
        },

        currentRewards: {
            type: [rewardSchema],
            default: []
        },

        currentMonster: {
            type: currentMonsterSchema,
            default: null
        },
        equipment: {
            type: equipmentSchema,
            default: () => ({})
        },

        inventory: {
            type: [
                {
                    type: {
                        type: String,
                        enum: [
                            "weapon",
                            "armor",
                            "staff",
                            "spell",
                            "buff"
                        ],
                        required: true
                    },

                    id: {
                        type: String,
                        required: true
                    }
                }
            ],
            default: []
        },

        activeBuffs: {
            type: [buffSchema],
            default: []
        },

        currentRewards: {
            type: [rewardSchema],
            default: []
        },

        status: {
            type: String,
            enum: [
                "preparing",
                "exploring",
                "choosing_room",
                "combat",
                "choosing_reward",
                "resting",
                "shopping",
                "victory",
                "dead",
                "abandoned"
            ],
            default: "preparing"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "ActiveRun",
    activeRunSchema,

);