const races = require("./data/races");

const {
    calculateFinalStats,
    calculateDerivedStats
} = require("./src/game/stats");

function test() {
    const race = races.find(race => race.id === "human");

    if (!race) {
        throw new Error("Race not found");
    }

    const subrace = race.subraces.find(
        subrace => subrace.id === "knight"
    );

    if (!subrace) {
        throw new Error("Subrace not found");
    }

    const finalStats = calculateFinalStats(
        race.baseStats,
        subrace.statModifiers
    );

    const derivedStats = calculateDerivedStats(finalStats);

    console.log("Race:", race.name);
    console.log("Subrace:", subrace.name);

    console.log("\nFinal Stats:");
    console.log(finalStats);

    console.log("\nDerived Stats:");
    console.log(derivedStats);
}

test();