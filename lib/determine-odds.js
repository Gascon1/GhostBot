function determineOdds(rolls, sides) {

    const fraction = Math.pow(((sides - 1) / sides), rolls)
    return { "survival": (fraction * 100).toFixed(3) + "%", "death": ((1 - fraction) * 100).toFixed(3) + "%" };
}

module.exports = { determineOdds };
