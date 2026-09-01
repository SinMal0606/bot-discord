function randomInt(min, max) {
    if (min > max) {
        throw new Error("min cannot be greater than max");
    }

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(array) {
    if (!Array.isArray(array) || array.length === 0) {
        throw new Error("Cannot choose from an empty array");
    }

    const index = randomInt(0, array.length - 1);

    return array[index];
}

function weightedRandom(items) {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Cannot choose from empty items.");
    }

    const totalWeight = items.reduce(
        (sum, item) => sum + item.weight,
        0
    );

    if (totalWeight <= 0) {
        throw new Error("Total weight must be greater than 0.");
    }

    let random = Math.random() * totalWeight;

    for (const item of items) {
        random -= item.weight;

        if (random <= 0) {
            return item;
        }
    }

    return items[items.length - 1];
}

module.exports = {
    randomInt,
    randomElement,
    weightedRandom
};