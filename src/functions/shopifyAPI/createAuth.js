const { createAdminApiClient } = require('@shopify/admin-api-client');

async function createAuth() {
    try {
        console.log('🔐 Configurando autenticação Shopify...');
        
        const client = createAdminApiClient({
            storeDomain: process.env.SHOPIFY_STORE_URL.replace('https://', '').replace('http://', ''),
            apiVersion: '2024-07', // Versão mais recente
            accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
        });

        console.log('✅ Cliente Shopify configurado com sucesso!');
        return client;
        
    } catch (error) {
        console.log('❌ Erro ao criar autenticação Shopify:', error.message);
        throw error;
    }
}

module.exports = createAuth;

