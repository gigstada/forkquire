module.exports = (s) => {
    return new Promise(resolve => {
        setTimeout(() => resolve(s), s * 1000);
    });
}