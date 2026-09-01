const monsters = require("./data/monsters");

const {
    scaleMonster
} = require("./src/game/combat");

const monster = monsters[0];

for (const floor of [1, 5, 10, 20, 30]) {
    const scaled = scaleMonster(monster, floor);

    console.log(
        `Floor ${floor}:`,
        `HP=${scaled.hp}`,
        `Attack=${scaled.attackPower}`
    );
}