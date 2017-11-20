module.exports = {
    getMean: function(numbers) {
        return numbers.reduce((acc, v) => {
            return acc += v;
        }, 0) / numbers.length;
    }, 
    getStandardDeviation: function(numbers) {
        const mean = this.getMean(numbers);
        return Math.sqrt(numbers.reduce((acc, v) => {
            const diff = v - mean;
            return acc += diff * diff;
        }, 0) / numbers.length);
    }
}