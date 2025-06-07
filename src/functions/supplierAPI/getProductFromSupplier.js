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
        
        // Método 1: Apenas Bearer Token
        try {
            const response1 = await axios.get('https://www.suprides.pt/rest/V1/integration/products-list', {
                params: {
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
                timeout: 15000
            });
            
            if (response1.status === 200 && Array.isArray(response1.data) && response1.data.length > 0) {
                const product = response1.data[0];
                console.log('Produto encontrado na API:', product.name || 'Nome nao disponivel');
                console.log('Stock recebido da API:', product.stock);
                console.log('Marca:', product.brand);
                return product;
            }
        } catch (error1) {
            console.log('Tentativa 1 falhou:', error1.message);
        }
        
        // Método 2: Endpoint alternativo
        try {
            const response2 = await axios.get('https://www.suprides.pt/rest/all/V1/integration/products-list', {
                params: {
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
                timeout: 15000
            });
            
            if (response2.status === 200 && Array.isArray(response2.data) && response2.data.length > 0) {
                const product = response2.data[0];
                console.log('Produto encontrado na API (endpoint alternativo):', product.name || 'Nome nao disponivel');
                return product;
            }
        } catch (error2) {
            console.log('Tentativa 2 falhou:', error2.message);
        }
        
        // Método 3: Apenas Basic Auth
        try {
            const response3 = await axios.get('https://www.suprides.pt/rest/V1/integration/products-list', {
                params: {
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
                auth: {
                    username: apiUser,
                    password: apiPassword
                },
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });
            
            if (response3.status === 200 && Array.isArray(response3.data) && response3.data.length > 0) {
                const product = response3.data[0];
                console.log('Produto encontrado na API (basic auth):', product.name || 'Nome nao disponivel');
                return product;
            }
        } catch (error3) {
            console.log('Tentativa 3 falhou:', error3.message);
        }
        
        console.log('Produto nao encontrado na API Suprides para EAN:', ean);
        return null;
        
    } catch (error) {
        console.log('Erro geral ao consultar API Suprides:', error.message);
        return null;
    }
}

module.exports = getProductFromSupplier;

