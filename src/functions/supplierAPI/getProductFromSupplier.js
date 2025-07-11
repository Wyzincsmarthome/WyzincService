const axios = require('axios');

async function getProductFromSupplier(ean) {
    try {
        console.log('Consultando API Suprides para EAN:', ean);
        const apiUser = process.env.API_USER, apiPassword = process.env.API_PASSWORD, apiToken = process.env.API_TOKEN;
        if (!apiUser || !apiPassword || !apiToken) throw new Error('Credenciais da API Suprides nao configuradas');
        
        const retryConfig = [ { timeout: 120000, attempt: 1 }, { timeout: 180000, attempt: 2 } ];
        
        for (const config of retryConfig) {
            try {
                console.log(`Tentativa ${config.attempt}: (timeout: ${config.timeout}ms)`);
                const response = await axios.get('https://www.suprides.pt/rest/V1/integration/products-list', {
                    params: { user: apiUser, password: apiPassword, searchCriteria: JSON.stringify({ filterGroups: [{ filters: [{ field: 'ean', value: ean, conditionType: 'eq' }] }] }) },
                    headers: { 'Authorization': 'Bearer ' + apiToken, 'Content-Type': 'application/json' },
                    timeout: config.timeout
                });
                
                if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
                    const rawProduct = response.data[0];
                    if (rawProduct.status === 'ERROR') return null;
                    return rawProduct;
                } else if (response.status === 200 && Array.isArray(response.data) && response.data.length === 0) {
                    return null;
                } else {
                    return null;
                }
            } catch (error) {
                console.log(`Tentativa ${config.attempt} falhou:`, error.message);
                if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                    if (config.attempt < retryConfig.length) { await new Promise(resolve => setTimeout(resolve, 2000)); continue; }
                } else if (error.response) { break; }
                if (config.attempt === retryConfig.length) return null;
            }
        }
        return null;
    } catch (error) {
        console.log('Erro geral ao consultar API Suprides:', error.message);
        return null;
    }
}

module.exports = { getProductFromSupplier };
