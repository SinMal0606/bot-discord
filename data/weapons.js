const weapons = [
    {
        id: "iron_sword",
        name: "Iron Sword",
        description: "A simple sword for close combat.",

        category: "light",

        damage: [
            {
                type: "physical",
                base: 30,
                scaling: {
                    strength: 0.6,
                    dexterity: 0.4
                }
            }
        ]
    },

    {
        id: "greatsword",
        name: "Greatsword",
        description: "A heavy sword that relies on raw strength.",

        category: "heavy",

        damage: [
            {
                type: "physical",
                base: 45,
                scaling: {
                    strength: 1.0
                }
            }
        ]
    },

    {
        id: "flame_blade",
        name: "Flame Blade",
        description: "A sword infused with holy flame.",

        category: "light",

        damage: [
            {
                type: "physical",
                base: 30,
                scaling: {
                    strength: 0.5,
                    dexterity: 0.3
                }
            },

            {
                type: "fire",
                base: 20,
                scaling: {
                    faith: 0.5
                }
            }
        ]
    }
];

module.exports = weapons;