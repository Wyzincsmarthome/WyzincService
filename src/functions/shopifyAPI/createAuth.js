require('dotenv').config();

const { createAdminRestApiClient } = require('@shopify/admin-api-client');

function createAuth() {
    console.log('🔍 DEBUG createAuth - SHOPIFY_STORE_URL:', process.env.SHOPIFY_STORE_URL);
    
    // Extrair apenas o domínio da URL completa
    const storeUrl = process.env.SHOPIFY_STORE_URL;
    const storeDomain = storeUrl ? storeUrl.replace('https://', '' ).replace('http://', '' ) : undefined;
    
    console.log('🔍 DEBUG createAuth - storeDomain:', storeDomain);
    
    const client = createAdminRestApiClient({
        storeDomain: storeDomain,
        apiVersion: '2023-04',
        accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    });
    return client;
}

module.exports = createAuth;
