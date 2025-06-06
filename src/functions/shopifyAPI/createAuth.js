const { createAdminApiClient } = require('@shopify/admin-api-client');

async function createAuth() {
    try {
        console.log('🔐 Configurando autenticação Shopify...');
        
        // Validar variáveis de ambiente
        const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
        const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
        
        if (!storeDomain) {
            throw new Error('SHOPIFY_STORE_DOMAIN não está definido nas variáveis de ambiente');
        }
        
        if (!accessToken) {
            throw new Error('SHOPIFY_ACCESS_TOKEN não está definido nas variáveis de ambiente');
        }
        
        console.log('🏪 Store Domain:', storeDomain.replace(/./g, '*'));
        
        // Criar cliente Shopify
        const client = createAdminApiClient({
            storeDomain: storeDomain,
            accessToken: accessToken,
            apiVersion: '2024-07' // Versão estável
        });
        
        console.log('🔍 Testando conectividade básica...');
        
        // Teste de conectividade CORRIGIDO - sem campo 'domain'
        const testQuery = `
            query testConnection {
                shop {
                    name
                    email
                    currencyCode
                }
            }
        `;
        
        try {
            const testResponse = await client.request(testQuery);
            
            if (testResponse && testResponse.data && testResponse.data.shop) {
                console.log('✅ Conectividade confirmada!');
                console.log('🏪 Loja:', testResponse.data.shop.name);
                console.log('📧 Email:', testResponse.data.shop.email);
                console.log('💰 Moeda:', testResponse.data.shop.currencyCode);
            } else {
                console.log('⚠️ Cliente configurado mas resposta inesperada');
                console.log('📄 Resposta do teste:', JSON.stringify(testResponse, null, 2));
            }
            
        } catch (testError) {
            console.log('⚠️ Cliente configurado mas teste de conectividade falhou');
            console.log('📄 Resposta do teste:', JSON.stringify(testError, null, 2));
            // Continuar mesmo com falha no teste - pode ser problema de permissões
        }
        
        return client;
        
    } catch (error) {
        console.error('❌ Erro na configuração da autenticação Shopify:', error.message);
        throw error;
    }
}

module.exports = createAuth;

