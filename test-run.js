require("dotenv").config();

const mongoose = require("mongoose");

const configureDNS = require("./src/config/dns");
const { createNewRun } = require("./src/game/run");

configureDNS();

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("✅ Connected to MongoDB");

        const result = await createNewRun(
            "test-user-456",
            "Test Player 2",
            null
        );

        console.log("\n✅ Run created");

        console.log("\nRace:");
        console.log(result.race);

        console.log("\nSubrace:");
        console.log(result.subrace);

        console.log("\nStats:");
        console.log(result.run.stats);

        console.log("\nDerived Stats:");
        console.log(result.derivedStats);

        console.log("\nActive Run:");
        console.log(result.run);

        await mongoose.disconnect();
    } catch (error) {
        console.error("❌ Test failed:");

        if (error.message === "PLAYER_ALREADY_IN_RUN") {
            console.error("Player already has an active run.");
        } else {
            console.error(error);
        }
    }
}

test();