const axios = require('axios');

async function getProductFromSupplier(ean) {
    try {
        console.log('Consultando API Suprides para EAN:', ean);
        
        const apiUser = process.env.API_USER;
        const apiPassword = process.env.API_PASSWORD;
        const apiToken = process.env.API_TOKEN;
        
        if (!apiUser || !apiPassword || !apiToken) {
            throw new Error('Credenciais da API Suprides nao configuradas');
        }
        
        console.log('Credenciais configuradas:');
        console.log('   API_USER:', apiUser);
        console.log('   API_PASSWORD:', apiPassword ? 'Definido' : 'Nao definido');
        console.log('   API_TOKEN:', apiToken ? 'Definido' : 'Nao definido');
        
        // Configuração de retry com timeouts progressivos
        const retryConfig = [
            { timeout: 30000, attempt: 1 },
            { timeout: 60000, attempt: 2 },
            { timeout: 120000, attempt: 3 }
        ];
        
        for (const config of retryConfig) {
            try {
                console.log(`Tentativa ${config.attempt}: Bearer token + user + password (timeout: ${config.timeout}ms)`);
                
                const response = await axios.get('https://www.suprides.pt/rest/V1/integration/products-list', {
                    params: {
                        user: apiUser,
                        password: apiPassword,
                        searchCriteria: JSON.stringify({
                            filterGroups: [{
                                filters: [{
                                    field: 'ean',
                                    value: ean,
                                    conditionType: 'eq'
                                }]
                            }]
                        })
                    },
                    headers: {
                        'Authorization': 'Bearer ' + apiToken,
                        'Content-Type': 'application/json'
                    },
                    timeout: config.timeout
                });
                
                console.log(`Tentativa ${config.attempt} - Status:`, response.status);
                console.log('Resposta completa:', JSON.stringify(response.data, null, 2));
                
                if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
                    const rawProduct = response.data[0];
                    
                    // Verificar se é um erro
                    if (rawProduct.status === 'ERROR') {
                        console.log('Erro retornado pela API:', rawProduct.message);
                        return null;
                    }
                    
                    // Se chegou aqui, o produto foi encontrado
                    console.log('Produto encontrado na API:', rawProduct.name || rawProduct.title || 'Nome nao disponivel');
                    console.log('Estrutura do produto:', Object.keys(rawProduct));
                    console.log('Dados do produto:');
                    console.log('   Nome:', rawProduct.name);
                    console.log('   Titulo:', rawProduct.title);
                    console.log('   Preco:', rawProduct.price);
                    console.log('   PVP:', rawProduct.pvpr);
                    console.log('   Marca:', rawProduct.brand);
                    console.log('   Stock:', rawProduct.stock);
                    console.log('   Descricao:', rawProduct.description);
                    
                    return rawProduct;
                } else if (response.status === 200 && Array.isArray(response.data) && response.data.length === 0) {
                    console.log('Produto nao encontrado na API (array vazio)');
                    return null;
                } else {
                    console.log('Resposta inesperada da API:', typeof response.data, response.data);
                    return null;
                }
                
            } catch (error) {
                console.log(`Tentativa ${config.attempt} falhou:`, error.message);
                
                if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                    console.log(`   Timeout de ${config.timeout}ms excedido`);
                    if (config.attempt < retryConfig.length) {
                        console.log(`   Tentando novamente com timeout maior...`);
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
                        continue;
                    }
                } else if (error.response) {
                    console.log('   Status:', error.response.status);
                    console.log('   Dados:', JSON.stringify(error.response.data, null, 2));
                    // Se não é timeout, não vale a pena tentar novamente
                    break;
                }
                
                // Se é a última tentativa, retornar null
                if (config.attempt === retryConfig.length) {
                    console.log('Todas as tentativas falharam - API Suprides pode estar indisponivel');
                    return null;
                }
            }
        }
        
        return null;
        
    } catch (error) {
        console.log('Erro geral ao consultar API Suprides:', error.message);
        return null;
    }
}

module.exports = getProductFromSupplier;

