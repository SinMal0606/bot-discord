const {
    DAMAGE_TYPES,
    calculateDamage,
    calculateMultiTypeDamage
} = require("./src/game/damage");

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

console.log("=== SINGLE TYPE ===");

const physicalAttack = calculateDamage(
    30,
    DAMAGE_TYPES.PHYSICAL,
    playerStats,
    {
        strength: 1.0
    },
    enemyResistances
);

console.log(physicalAttack);

console.log("\n=== FIRE ===");

const fireAttack = calculateDamage(
    20,
    DAMAGE_TYPES.FIRE,
    playerStats,
    {
        faith: 0.5
    },
    enemyResistances
);

console.log(fireAttack);

console.log("\n=== MULTI TYPE ===");

const hybridAttack = calculateMultiTypeDamage(
    [
        {
            base: 30,
            type: DAMAGE_TYPES.PHYSICAL,
            scaling: {
                strength: 1.0
            }
        },

        {
            base: 20,
            type: DAMAGE_TYPES.FIRE,
            scaling: {
                faith: 0.5
            }
        }
    ],
    playerStats,
    enemyResistances
);

console.log(hybridAttack);