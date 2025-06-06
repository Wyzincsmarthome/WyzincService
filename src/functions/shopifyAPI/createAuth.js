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
        
        // Usar versão API mais estável
        const client = createAdminApiClient({
            storeDomain: storeDomain,
            apiVersion: '2024-07', // Versão mais estável (não 2025-01)
            accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
        });
        
        // Teste de conectividade básico
        console.log('🔍 Testando conectividade básica...');
        
        const basicTestQuery = `
            query {
                shop {
                    name
                    domain
                    email
                    currencyCode
                }
            }
        `;
        
        try {
            const testResponse = await client.request(basicTestQuery);
            
            if (testResponse && testResponse.data && testResponse.data.shop) {
                console.log('✅ Cliente Shopify configurado com sucesso!');
                console.log(`🏪 Loja: ${testResponse.data.shop.name}`);
                console.log(`🌐 Domínio: ${testResponse.data.shop.domain}`);
                console.log(`💰 Moeda: ${testResponse.data.shop.currencyCode}`);
                
                // Teste adicional de permissões de produtos
                console.log('🔍 Testando permissões de produtos...');
                
                const permissionTestQuery = `
                    query {
                        products(first: 1) {
                            edges {
                                node {
                                    id
                                    title
                                }
                            }
                        }
                    }
                `;
                
                try {
                    const permissionResponse = await client.request(permissionTestQuery);
                    
                    if (permissionResponse && permissionResponse.data && permissionResponse.data.products) {
                        console.log('✅ Permissões de produtos confirmadas');
                        
                        const productCount = permissionResponse.data.products.edges.length;
                        if (productCount > 0) {
                            console.log(`📦 Primeiro produto encontrado: ${permissionResponse.data.products.edges[0].node.title}`);
                        } else {
                            console.log('📦 Nenhum produto encontrado na loja');
                        }
                    } else {
                        console.log('⚠️ Resposta de permissões inesperada');
                        console.log('📄 Resposta:', JSON.stringify(permissionResponse, null, 2));
                    }
                    
                } catch (permissionError) {
                    console.error('❌ Erro no teste de permissões:', permissionError.message);
                    if (permissionError.response) {
                        console.error('📄 Detalhes:', JSON.stringify(permissionError.response, null, 2));
                    }
                    console.log('⚠️ Cliente configurado mas sem permissões de produtos');
                }
                
            } else {
                console.log('⚠️ Cliente configurado mas teste de conectividade falhou');
                console.log('📄 Resposta do teste:', JSON.stringify(testResponse, null, 2));
            }
            
        } catch (testError) {
            console.error('❌ Erro no teste de conectividade:', testError.message);
            if (testError.response) {
                console.error('📄 Detalhes do erro:', JSON.stringify(testError.response, null, 2));
            }
            console.log('⚠️ Cliente configurado mas teste falhou');
        }
        
        return client;
        
    } catch (error) {
        console.log('❌ Erro ao criar autenticação Shopify:', error.message);
        
        // Logs detalhados para debugging
        if (error.response) {
            console.log('📄 Detalhes da resposta:', JSON.stringify(error.response, null, 2));
        }
        
        if (error.message.includes('SHOPIFY_STORE_URL')) {
            console.log('💡 Dica: Verifique se SHOPIFY_STORE_URL está definida corretamente');
            console.log('💡 Formato esperado: "sua-loja.myshopify.com" ou "https://sua-loja.myshopify.com"');
        }
        
        if (error.message.includes('SHOPIFY_ACCESS_TOKEN')) {
            console.log('💡 Dica: Verifique se SHOPIFY_ACCESS_TOKEN está definida corretamente');
            console.log('💡 O token deve ter permissões para ler produtos');
        }
        
        throw error;
    }
}

module.exports = createAuth;

