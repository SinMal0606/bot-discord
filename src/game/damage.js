const DAMAGE_TYPES = {
    PHYSICAL: "physical",
    MAGIC: "magic",
    FIRE: "fire",
    LIGHTNING: "lightning",
    HOLY: "holy"
};

function calculateScaledDamage(baseDamage, stats, scaling = {}) {
    if (baseDamage < 0) {
        throw new Error("baseDamage cannot be negative.");
    }

    let damage = baseDamage;

    for (const statName of Object.keys(scaling)) {
        const statValue = stats[statName] ?? 0;
        const coefficient = scaling[statName] ?? 0;

        damage += statValue * coefficient;
    }

    return damage;
}

function applyResistance(rawDamage, resistance) {
    if (rawDamage <= 0) {
        return 0;
    }

    const multiplier = 1 - resistance / 100;

    return Math.max(
        0,
        Math.round(rawDamage * multiplier)
    );
}

function calculateDamage(
    baseDamage,
    damageType,
    stats,
    scaling,
    targetResistances
) {
    const rawDamage = calculateScaledDamage(
        baseDamage,
        stats,
        scaling
    );

    const resistance =
        targetResistances[damageType] ?? 0;

    const finalDamage = applyResistance(
        rawDamage,
        resistance
    );

    return {
        type: damageType,
        rawDamage,
        resistance,
        finalDamage
    };
}

function calculateMultiTypeDamage(
    damages,
    stats,
    targetResistances
) {
    const results = damages.map(damage => {
        return calculateDamage(
            damage.base,
            damage.type,
            stats,
            damage.scaling,
            targetResistances
        );
    });

    const totalDamage = results.reduce(
        (total, result) => total + result.finalDamage,
        0
    );

    return {
        parts: results,
        totalDamage
    };
}

module.exports = {
    DAMAGE_TYPES,
    calculateScaledDamage,
    applyResistance,
    calculateDamage,
    calculateMultiTypeDamage
};