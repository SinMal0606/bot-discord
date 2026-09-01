function addBuff(run, buff) {
    if (!run) {
        throw new Error("Run is required.");
    }

    if (!buff) {
        throw new Error("Buff is required.");
    }

    run.activeBuffs.push({
        id: buff.id,
        type: buff.stat,
        amount: buff.amount,
        remainingTurns: buff.duration
    });

    return run;
}

function tickBuffs(run) {
    const remainingBuffs = [];

    for (const buff of run.activeBuffs) {
        buff.remainingTurns -= 1;

        if (buff.remainingTurns > 0) {
            remainingBuffs.push(buff);
        }
    }

    run.activeBuffs = remainingBuffs;

    return run;
}

module.exports = {
    addBuff,
    tickBuffs
};