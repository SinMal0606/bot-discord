const monsters = require("./data/monsters");
const weapons = require("./data/weapons");
const spells = require("./data/spells");

const {
    spawnMonster,
    playerAttack,
    monsterAttack
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

    hp: 170,
    maxHp: 170,

    mana: 100,

    dodgeChance: 9,

    resistances: {
        physical: 15,
        magic: 15,
        fire: 12,
        lightning: 8,
        holy: 12
    }
};

const weapon = weapons.find(
    weapon => weapon.id === "greatsword"
);

const availableSpells = spells.filter(
    spell => spell.type === "damage"
);

const monster = spawnMonster(1);

console.log("=== COMBAT START ===");

console.log("\nMonster:");
console.log(monster);

for (let turn = 1; turn <= 5; turn++) {
    console.log(`\n===== TURN ${turn} =====`);

    if (monster.hp <= 0 || player.hp <= 0) {
        break;
    }

    const playerResult = playerAttack(
        player,
        monster,
        weapon,
        availableSpells
    );

    console.log("\nPlayer action:");
    console.log(playerResult);

    console.log(
        `Monster HP: ${monster.hp}/${monster.maxHp}`
    );

    if (monster.hp <= 0) {
        console.log("\n🎉 Monster defeated!");
        break;
    }

    const monsterResult = monsterAttack(
        monster,
        player
    );

    console.log("\nMonster action:");
    console.log(monsterResult);

    console.log(
        `Player HP: ${player.hp}/${player.maxHp}`
    );

    if (player.hp <= 0) {
        console.log("\n💀 Player defeated!");
        break;
    }
}