require('dotenv').config();

const { createAdminRestApiClient } = require('@shopify/admin-api-client');

async function createAuth() {
    let shopifyClient = createAdminRestApiClient({
        storeDomain: process.env.SHOPIFY_STORE_DOMAIN,
        apiVersion: process.env.SHOPIFY_API_VERSION,
        accessToken: process.env.SHOPIFY_ACCESS_TOKEN
    });
    
    return shopifyClient;
}

module.exports = createAuth;