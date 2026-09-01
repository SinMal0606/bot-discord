const spells = require("./data/spells");

const {
    castSpell
} = require("./src/game/combat");

const player = {
    stats: {
        vigor: 12,
        mind: 10,
        strength: 15,
        dexterity: 8,
        intelligence: 15,
        faith: 12,
        agility: 9
    },

    hp: 80,
    maxHp: 170,

    mana: 100,

    activeBuffs: []
};

const enemyResistances = {
    physical: 20,
    magic: 10,
    fire: 50,
    lightning: 0,
    holy: -20
};

for (const spell of spells) {
    console.log(`\n=== ${spell.name} ===`);

    try {
        const result = castSpell(
            spell,
            player,
            enemyResistances
        );

        console.log(result);
        console.log("Player state:");
        console.log(player);

    } catch (error) {
        console.error(error);
    }
}