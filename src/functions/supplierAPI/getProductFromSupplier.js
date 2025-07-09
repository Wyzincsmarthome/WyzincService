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
        console.log('    API_USER:', apiUser);
        console.log('    API_PASSWORD:', apiPassword ? 'Definido' : 'Nao definido');
        console.log('    API_TOKEN:', apiToken ? 'Definido' : 'Nao definido');
        
        // CONFIGURAÇÃO CORRETA: Timeouts longos para evitar falhas desnecessárias
        const retryConfig = [
            { timeout: 120000, attempt: 1 }, // Tentativa 1: Esperar até 2 minutos
            { timeout: 180000, attempt: 2 }  // Tentativa 2: Esperar até 3 minutos (para casos extremos)
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
                
                if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
                    const rawProduct = response.data[0];
                    if (rawProduct.status === 'ERROR') {
                        console.log('Erro retornado pela API:', rawProduct.message);
                        return null;
                    }
                    console.log('Produto encontrado na API:', rawProduct.name || 'Nome nao disponivel');
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
                    console.log(`    Timeout de ${config.timeout}ms excedido`);
                    if (config.attempt < retryConfig.length) {
                        console.log(`    Tentando novamente...`);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        continue;
                    }
                } else if (error.response) {
                    console.log('    Status:', error.response.status);
                    console.log('    Dados:', JSON.stringify(error.response.data, null, 2));
                    break;
                }
                
                if (config.attempt === retryConfig.length) {
                    console.log('Todas as tentativas falharam para o EAN', ean);
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

// Corrigido para exportar corretamente
module.exports = { getProductFromSupplier };
