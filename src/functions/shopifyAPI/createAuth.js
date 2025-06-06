const { createAdminApiClient } = require('@shopify/admin-api-client');

async function createAuth() {
    try {
        console.log('🔐 Configurando autenticação Shopify...');
        
        // Validar variáveis de ambiente
        if (!process.env.SHOPIFY_STORE_URL) {
            throw new Error('SHOPIFY_STORE_URL não está definida nas variáveis de ambiente');
        }
        
        if (!process.env.SHOPIFY_ACCESS_TOKEN) {
            throw new Error('SHOPIFY_ACCESS_TOKEN não está definida nas variáveis de ambiente');
        }
        
        // Limpar URL da loja
        const storeDomain = process.env.SHOPIFY_STORE_URL
            .replace('https://', '')
            .replace('http://', '')
            .replace(/\/$/, ''); // Remove trailing slash
        
        console.log(`🏪 Store Domain: ${storeDomain}`);
        
        const client = createAdminApiClient({
            storeDomain: storeDomain,
            apiVersion: '2025-01', // Versão mais recente
            accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
        });
        
        // Teste de conectividade
        console.log('🔍 Testando conectividade...');
        
        const testQuery = `
            query {
                shop {
                    name
                    domain
                    email
                    currencyCode
                    timezone
                }
            }
        `;
        
        const testResponse = await client.request(testQuery);
        
        if (testResponse.data && testResponse.data.shop) {
            console.log('✅ Cliente Shopify configurado com sucesso!');
            console.log(`🏪 Loja: ${testResponse.data.shop.name}`);
            console.log(`🌐 Domínio: ${testResponse.data.shop.domain}`);
            console.log(`💰 Moeda: ${testResponse.data.shop.currencyCode}`);
        } else {
            console.log('⚠️ Cliente configurado mas teste de conectividade falhou');
        }
        
        return client;
        
    } catch (error) {
        console.log('❌ Erro ao criar autenticação Shopify:', error.message);
        
        // Logs detalhados para debugging
        if (error.response) {
            console.log('📄 Detalhes da resposta:', error.response.data || error.response);
        }
        
        if (error.message.includes('SHOPIFY_STORE_URL')) {
            console.log('💡 Dica: Verifique se SHOPIFY_STORE_URL está definida corretamente');
        }
        
        if (error.message.includes('SHOPIFY_ACCESS_TOKEN')) {
            console.log('💡 Dica: Verifique se SHOPIFY_ACCESS_TOKEN está definida corretamente');
        }
        
        throw error;
    }
}

module.exports = createAuth;
