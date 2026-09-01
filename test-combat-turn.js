const mongoose = require("mongoose");
require("dotenv").config();

const configureDNS = require("./src/config/dns");

const ActiveRun = require("./src/models/ActiveRun");
const weapons = require("./data/weapons");
const spells = require("./data/spells");

const {
    startCombat,
    executeCombatTurn
} = require("./src/game/combat");

configureDNS();

async function test() {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log("✅ Connected to MongoDB");

        const run = await ActiveRun.findOne({
            discordId: "test-user-456"
        });

        if (!run) {
            throw new Error(
                "Test active run not found."
            );
        }

        // Start combat
        startCombat(run);

        console.log("\n=== COMBAT START ===");

        console.log(
            `Monster: ${run.currentMonster.name}`
        );

        console.log(
            `HP: ${run.currentMonster.hp}/${run.currentMonster.maxHp}`
        );

        const weapon = weapons.find(
            weapon => weapon.id === "greatsword"
        );

        const damageSpells = spells.filter(
            spell => spell.type === "damage"
        );

        let turn = 1;

        while (
            run.status === "combat" &&
            turn <= 20
        ) {
            console.log(
                `\n===== TURN ${turn} =====`
            );

            const result = executeCombatTurn(
                run,
                weapon,
                damageSpells
            );

            console.log(result);

            console.log(
                `Player HP: ${run.hp}/${run.maxHp}`
            );

            console.log(
                `Monster HP: ${run.currentMonster.hp}/${run.currentMonster.maxHp}`
            );

            console.log(
                `Status: ${run.status}`
            );

            if (result.result !== "continue") {
                break;
            }

            turn++;
        }

        await run.save();

        console.log("\n✅ Combat state saved");

        await mongoose.disconnect();

    } catch (error) {
        console.error("❌ Test failed:");
        console.error(error);
    }
}

test();