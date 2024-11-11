function determineOdds(rolls, sides) {

    const fraction = Math.pow(((sides - 1) / sides), rolls)
    return ((1 - fraction) * 100).toFixed(3) + "%";
}

module.exports = { determineOdds };
