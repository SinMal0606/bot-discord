const buffs = [
    {
        id: "strength_boost",
        name: "Might",
        description: "Increase Strength by 2.",

        effect: {
            type: "stat",
            stat: "strength",
            amount: 2
        }
    },

    {
        id: "vigor_boost",
        name: "Vitality",
        description: "Increase Vigor by 2.",

        effect: {
            type: "stat",
            stat: "vigor",
            amount: 2
        }
    },

    {
        id: "faith_boost",
        name: "Devotion",
        description: "Increase Faith by 2.",

        effect: {
            type: "stat",
            stat: "faith",
            amount: 2
        }
    }
];

module.exports = buffs;