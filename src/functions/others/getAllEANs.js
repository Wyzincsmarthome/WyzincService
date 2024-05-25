const fs = require('fs');

async function getAllEANs() {
    const EANProductsList = fs.readFileSync('src/productsList.txt', { encoding: 'utf8', flag: 'r' }).split('\n');

    return EANProductsList;
}

module.exports = getAllEANs;