const monsters = [
    {
        id: "goblin",
        name: "Goblin",

        description: "A weak but unpredictable creature.",

        minFloor: 1,
        maxFloor: 5,

        baseStats: {
            hp: 80,
            attackPower: 15
        },

        resistances: {
            physical: 10,
            magic: 0,
            fire: -10,
            lightning: 20,
            holy: 0
        },

        attacks: [
            {
                id: "slash",
                name: "Slash",

                weight: 70,

                damage: [
                    {
                        type: "physical",
                        base: 15,
                        scaling: 1
                    }
                ]
            },

            {
                id: "fire_bomb",
                name: "Fire Bomb",

                weight: 30,

                damage: [
                    {
                        type: "fire",
                        base: 20,
                        scaling: 1
                    }
                ]
            }
        ]
    }
];

module.exports = monsters;