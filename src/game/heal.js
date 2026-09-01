function calculateHeal(
    baseHeal,
    stats,
    scaling = {}
) {
    if (baseHeal < 0) {
        throw new Error("baseHeal cannot be negative.");
    }

    let heal = baseHeal;

    for (const statName of Object.keys(scaling)) {
        const statValue = stats[statName] ?? 0;
        const coefficient = scaling[statName] ?? 0;

        heal += statValue * coefficient;
    }

    return Math.max(0, Math.round(heal));
}

function applyHealing(
    currentHp,
    maxHp,
    healAmount
) {
    if (currentHp < 0) {
        throw new Error("currentHp cannot be negative.");
    }

    if (maxHp <= 0) {
        throw new Error("maxHp must be greater than 0.");
    }

    if (healAmount < 0) {
        throw new Error("healAmount cannot be negative.");
    }

    const newHp = Math.min(
        maxHp,
        currentHp + healAmount
    );

    return {
        oldHp: currentHp,
        healAmount: newHp - currentHp,
        newHp
    };
}

module.exports = {
    calculateHeal,
    applyHealing
};