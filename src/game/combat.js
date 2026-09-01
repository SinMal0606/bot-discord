const {
    calculateMultiTypeDamage
} = require("./damage");

const {
    calculateHeal,
    applyHealing
} = require("./heal");

const {
    addBuff
} = require("./effects");

const monsters = require("../../data/monsters");
const {
    randomElement
} = require("../utils/random");

const {
    weightedRandom
} = require("../utils/random");

const {
    generateRewards
} = require("./rewards");

function castSpell(
    spell,
    caster,
    targetResistances
) {
    if (!spell) {
        throw new Error("Spell is required.");
    }

    if (!caster) {
        throw new Error("Caster is required.");
    }

    if (caster.mana < spell.manaCost) {
        throw new Error("NOT_ENOUGH_MANA");
    }

    caster.mana -= spell.manaCost;

    if (spell.type === "damage") {
        const effect = spell.effects.find(
            effect => effect.type === "damage"
        );

        const result = calculateMultiTypeDamage(
            effect.damage,
            caster.stats,
            targetResistances
        );

        return {
            type: "damage",
            manaSpent: spell.manaCost,
            result
        };
    }

    if (spell.type === "heal") {
        const effect = spell.effects.find(
            effect => effect.type === "heal"
        );

        const healAmount = calculateHeal(
            effect.base,
            caster.stats,
            effect.scaling
        );

        const result = applyHealing(
            caster.hp,
            caster.maxHp,
            healAmount
        );

        caster.hp = result.newHp;

        return {
            type: "heal",
            manaSpent: spell.manaCost,
            result
        };
    }

    if (spell.type === "buff") {
        const effect = spell.effects.find(
            effect => effect.type === "buff"
        );

        addBuff(caster, {
            id: spell.id,
            stat: effect.stat,
            amount: effect.amount,
            duration: effect.duration
        });

        return {
            type: "buff",
            manaSpent: spell.manaCost,
            result: effect
        };
    }

    throw new Error(`Unsupported spell type: ${spell.type}`);
}

function calculateWeaponDamage(
    weapon,
    playerStats,
    targetResistances
) {
    if (!weapon) {
        throw new Error("Weapon is required.");
    }

    if (!Array.isArray(weapon.damage)) {
        throw new Error("Weapon damage data is invalid.");
    }

    return calculateMultiTypeDamage(
        weapon.damage.map(damage => ({
            base: damage.base,
            type: damage.type,
            scaling: damage.scaling
        })),
        playerStats,
        targetResistances
    );
}

function scaleMonster(monster, floor) {
    if (!monster) {
        throw new Error("Monster is required.");
    }

    if (floor < 1) {
        throw new Error("Floor must be at least 1.");
    }

    const hpMultiplier = 1 + (floor - 1) * 0.12;
    const attackMultiplier = 1 + (floor - 1) * 0.08;

    return {
        id: monster.id,
        name: monster.name,

        hp: Math.round(
            monster.baseStats.hp * hpMultiplier
        ),

        maxHp: Math.round(
            monster.baseStats.hp * hpMultiplier
        ),

        attackPower: Math.round(
            monster.baseStats.attackPower * attackMultiplier
        ),

        resistances: {
            ...monster.resistances
        },

        attacks: monster.attacks
    };
}

function spawnMonster(floor) {
    const availableMonsters = monsters.filter(
        monster =>
            floor >= monster.minFloor &&
            floor <= monster.maxFloor
    );

    if (availableMonsters.length === 0) {
        throw new Error(
            `No monster available for floor ${floor}`
        );
    }

    const monster = randomElement(
        availableMonsters
    );

    return scaleMonster(monster, floor);
}

function rollDodge(dodgeChance) {
    const roll = Math.random() * 100;

    return roll < dodgeChance;
}

function monsterAttack(monster, player) {
    if (!monster) {
        throw new Error("Monster is required.");
    }

    if (!player) {
        throw new Error("Player is required.");
    }

    const attack = weightedRandom(
        monster.attacks
    );

    const dodged = rollDodge(
        player.dodgeChance
    );

    if (dodged) {
        return {
            attack,
            dodged: true,
            totalDamage: 0
        };
    }

    const result = calculateMultiTypeDamage(
        attack.damage,
        {
            // Monster attack hiện chưa có stat scaling.
            strength: monster.attackPower
        },
        player.resistances
    );

    player.hp = Math.max(
        0,
        player.hp - result.totalDamage
    );

    return {
        attack,
        dodged: false,
        ...result
    };
}

function choosePlayerAction(
    weapon,
    spells,
    currentMana
) {
    if (!weapon && spells.length === 0) {
        throw new Error(
            "Player has no combat actions."
        );
    }

    const availableSpells = spells.filter(
        spell =>
            spell.manaCost <= currentMana
    );

    if (!weapon) {
        return {
            type: "spell",
            value: randomElement(availableSpells)
        };
    }

    if (availableSpells.length === 0) {
        return {
            type: "weapon",
            value: weapon
        };
    }

    // 70% weapon, 30% spell
    const roll = Math.random();

    if (roll < 0.7) {
        return {
            type: "weapon",
            value: weapon
        };
    }

    return {
        type: "spell",
        value: randomElement(
            availableSpells
        )
    };
}

function playerAttack(
    player,
    monster,
    weapon,
    spells
) {
    const action = choosePlayerAction(
        weapon,
        spells,
        player.mana
    );

    if (action.type === "weapon") {
        const result = calculateWeaponDamage(
            action.value,
            player.stats,
            monster.resistances
        );

        monster.hp = Math.max(
            0,
            monster.hp - result.totalDamage
        );

        return {
            action: "weapon",
            weapon: action.value,
            ...result
        };
    }

    const result = castSpell(
        action.value,
        player,
        monster.resistances
    );

    if (result.type === "damage") {
        monster.hp = Math.max(
            0,
            monster.hp - result.result.totalDamage
        );
    }

    return {
        action: "spell",
        spell: action.value,
        ...result
    };
}

function startCombat(run) {
    if (!run) {
        throw new Error("Run is required.");
    }

    const monster = spawnMonster(run.floor);

    run.currentMonster = monster;
    run.status = "combat";

    return monster;
}

function executeCombatTurn(
    run,
    weapon,
    availableSpells = []
) {
    if (!run) {
        throw new Error("Run is required.");
    }

    if (!run.currentMonster) {
        throw new Error("No active monster.");
    }

    if (run.status !== "combat") {
        throw new Error("Run is not in combat.");
    }

    const player = {
        stats: run.stats,
        hp: run.hp,
        maxHp: run.maxHp,
        mana: run.mana,
        dodgeChance: run.stats.agility,
        resistances: {
            physical: run.stats.strength,
            magic: run.stats.intelligence,
            fire: run.stats.vigor,
            lightning: run.stats.dexterity,
            holy: run.stats.faith
        },
        activeBuffs: run.activeBuffs
    };

    const monster = run.currentMonster;

    // Player turn
    const playerResult = playerAttack(
        player,
        monster,
        weapon,
        availableSpells
    );

    run.hp = player.hp;
    run.mana = player.mana;

    // Monster died
    if (monster.hp <= 0) {
        run.currentRewards = generateRewards(3);

        run.status = "choosing_reward";

        return {
            result: "victory",
            playerResult,
            monsterResult: null,
            rewards: run.currentRewards
        };
    }

    // Monster turn
    const monsterResult = monsterAttack(
        monster,
        player
    );

    run.hp = player.hp;

    // Player died
    if (run.hp <= 0) {
        run.status = "dead";

        return {
            result: "defeat",
            playerResult,
            monsterResult
        };
    }

    return {
        result: "continue",
        playerResult,
        monsterResult
    };
}

module.exports = {
    scaleMonster,
    spawnMonster,
    startCombat,
    rollDodge,
    calculateWeaponDamage,
    choosePlayerAction,
    castSpell,
    playerAttack,
    monsterAttack,
    executeCombatTurn
};