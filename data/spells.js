const spells = [
    {
        id: "fireball",
        name: "Fireball",
        description: "Launch a ball of fire at the enemy.",

        type: "damage",

        manaCost: 20,

        effects: [
            {
                type: "damage",

                damage: [
                    {
                        type: "fire",
                        base: 35,

                        scaling: {
                            intelligence: 0.8,
                            faith: 0.3
                        }
                    }
                ]
            }
        ]
    },

    {
        id: "holy_light",
        name: "Holy Light",
        description: "Restore HP with divine power.",

        type: "heal",

        manaCost: 25,

        effects: [
            {
                type: "heal",

                base: 40,

                scaling: {
                    faith: 1.0,
                    intelligence: 0.5
                }
            }
        ]
    },

    {
        id: "iron_skin",
        name: "Iron Skin",
        description: "Increase physical resistance for a short duration.",

        type: "buff",

        manaCost: 30,

        effects: [
            {
                type: "buff",

                stat: "physicalResistance",

                amount: 15,

                duration: 3
            }
        ]
    }
];

module.exports = spells;