function generateCustomNumber(prefix) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";  // Alphanumeric characters
    let result = prefix;

    // Generate the remaining 10 characters (you can adjust the length)
    for (let i = 0; i < 10; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
}

module.exports = generateCustomNumber;
