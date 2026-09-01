const {
    generateRewards,
    getRewardInfo
} = require("./src/game/rewards");

function test() {
    console.log("=== REWARD TEST ===\n");

    const rewards = generateRewards(3);

    if (rewards.length === 0) {
        console.log("❌ No rewards generated.");
        return;
    }

    rewards.forEach((reward, index) => {
        const info = getRewardInfo(reward);

        console.log(`${index + 1}. ${info.emoji} ${info.name}`);
        console.log(`   Type: ${reward.type}`);
        console.log(`   ID: ${reward.id}`);
        console.log(`   Description: ${info.description}`);
        console.log();
    });
}

test();