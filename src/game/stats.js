const STAT_NAMES = [
    "vigor",
    "mind",
    "strength",
    "dexterity",
    "intelligence",
    "faith",
    "agility"
];

function calculateFinalStats(baseStats, statModifiers) {
    const finalStats = {};

    for (const stat of STAT_NAMES) {
        const base = baseStats[stat] ?? 0;
        const modifier = statModifiers[stat] ?? 0;

        finalStats[stat] = Math.max(0, base + modifier);
    }

    return finalStats;
}

function calculateMaxHp(vigor) {
    return 50 + vigor * 10;
}

function calculateMaxMana(mind) {
    return 50 + mind * 10;
}

function calculateResistances(stats) {
    return {
        physical: stats.strength,
        lightning: stats.dexterity,
        magic: stats.intelligence,
        holy: stats.faith,

        // Theo thiết kế hiện tại:
        // Vigor cũng ảnh hưởng Fire Resistance.
        fire: stats.vigor
    };
}

function calculateDodgeChance(agility) {
    // Tạm thời chỉ là công thức prototype.
    // Chúng ta sẽ balance sau.
    return Math.min(50, agility);
}

function calculateDerivedStats(stats) {
    return {
        maxHp: calculateMaxHp(stats.vigor),

        maxMana: calculateMaxMana(stats.mind),

        resistances: calculateResistances(stats),

        dodgeChance: calculateDodgeChance(stats.agility)
    };
}

module.exports = {
    calculateFinalStats,
    calculateDerivedStats
};