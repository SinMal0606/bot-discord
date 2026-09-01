const weapons = require("./data/weapons");

const {
    calculateWeaponDamage
} = require("./src/game/combat");

const playerStats = {
    vigor: 12,
    mind: 10,
    strength: 15,
    dexterity: 8,
    intelligence: 10,
    faith: 12,
    agility: 9
};

const enemyResistances = {
    physical: 20,
    magic: 10,
    fire: 50,
    lightning: 0,
    holy: -20
};

for (const weapon of weapons) {
    const result = calculateWeaponDamage(
        weapon,
        playerStats,
        enemyResistances
    );

    console.log(`\n=== ${weapon.name} ===`);
    console.log(result);
}