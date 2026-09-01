const races = [
    {
        id: "human",
        name: "Human",

        baseStats: {
            vigor: 10,
            mind: 10,
            strength: 10,
            dexterity: 10,
            intelligence: 10,
            faith: 10,
            agility: 10
        },

        subraces: [
            {
                id: "knight",
                name: "Knight",

                statModifiers: {
                    vigor: 2,
                    mind: 0,
                    strength: 3,
                    dexterity: 0,
                    intelligence: -1,
                    faith: 1,
                    agility: -1
                }
            },

            {
                id: "rogue",
                name: "Rogue",

                statModifiers: {
                    vigor: -1,
                    mind: 0,
                    strength: 0,
                    dexterity: 3,
                    intelligence: 0,
                    faith: 0,
                    agility: 3
                }
            }
        ]
    },

    {
        id: "elf",
        name: "Elf",

        baseStats: {
            vigor: 8,
            mind: 12,
            strength: 7,
            dexterity: 12,
            intelligence: 12,
            faith: 8,
            agility: 11
        },

        subraces: [
            {
                id: "high_elf",
                name: "High Elf",

                statModifiers: {
                    vigor: -1,
                    mind: 2,
                    strength: -1,
                    dexterity: 0,
                    intelligence: 3,
                    faith: 0,
                    agility: 1
                }
            },

            {
                id: "wood_elf",
                name: "Wood Elf",

                statModifiers: {
                    vigor: 0,
                    mind: 0,
                    strength: 0,
                    dexterity: 2,
                    intelligence: 0,
                    faith: 1,
                    agility: 2
                }
            }
        ]
    }
];

module.exports = races;