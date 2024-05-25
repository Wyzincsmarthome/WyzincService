require('dotenv').config();
const axios = require('axios');

async function getProductFromSupplier(productEAN) {
    let finalResult = await axios.get(`https://www.suprides.pt/rest/V1/integration/products-list?`, {
        params: {
            user: process.env.API_USER,
            password: process.env.API_PASSWORD,
            EAN: productEAN,
        },
        headers: {
            'Authorization': 'Bearer ' + process.env.API_TOKEN,
            'Content-Type': 'application/json'
        }
    }).then((response) => {
        return ((response.data.length !== 0) ? response.data[0] : false);
    });

    return finalResult;
}

module.exports = getProductFromSupplier;