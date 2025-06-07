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
        
        // Método 1: Bearer Token com campo user
        try {
            console.log('Tentativa 1: Bearer Token com campo user');
            const response1 = await axios.get('https://www.suprides.pt/rest/V1/integration/products-list', {
                params: {
                    user: apiUser,
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
            
            console.log('Tentativa 1 - Status:', response1.status);
            console.log('Tentativa 1 - Resposta:', JSON.stringify(response1.data, null, 2));
            
            if (response1.status === 200 && Array.isArray(response1.data) && response1.data.length > 0) {
                const product = response1.data[0];
                console.log('Produto encontrado na API (Tentativa 1):', product.name || 'Nome nao disponivel');
                return product;
            }
        } catch (error1) {
            console.log('Tentativa 1 falhou:', error1.message);
            if (error1.response) {
                console.log('   Status:', error1.response.status);
                console.log('   Dados:', JSON.stringify(error1.response.data, null, 2));
            }
        }
        
        // Método 2: POST com dados no body
        try {
            console.log('Tentativa 2: POST com dados no body');
            const response2 = await axios.post('https://www.suprides.pt/rest/V1/integration/products-list', {
                user: apiUser,
                password: apiPassword,
                token: apiToken,
                searchCriteria: {
                    filterGroups: [{
                        filters: [{
                            field: 'ean',
                            value: ean,
                            conditionType: 'eq'
                        }]
                    }]
                }
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });
            
            console.log('Tentativa 2 - Status:', response2.status);
            console.log('Tentativa 2 - Resposta:', JSON.stringify(response2.data, null, 2));
            
            if (response2.status === 200 && Array.isArray(response2.data) && response2.data.length > 0) {
                const product = response2.data[0];
                console.log('Produto encontrado na API (Tentativa 2):', product.name || 'Nome nao disponivel');
                return product;
            }
        } catch (error2) {
            console.log('Tentativa 2 falhou:', error2.message);
            if (error2.response) {
                console.log('   Status:', error2.response.status);
                console.log('   Dados:', JSON.stringify(error2.response.data, null, 2));
            }
        }
        
        // Método 3: GET com user nos headers
        try {
            console.log('Tentativa 3: GET com user nos headers');
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
                headers: {
                    'Authorization': 'Bearer ' + apiToken,
                    'X-User': apiUser,
                    'X-Password': apiPassword,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });
            
            console.log('Tentativa 3 - Status:', response3.status);
            console.log('Tentativa 3 - Resposta:', JSON.stringify(response3.data, null, 2));
            
            if (response3.status === 200 && Array.isArray(response3.data) && response3.data.length > 0) {
                const product = response3.data[0];
                console.log('Produto encontrado na API (Tentativa 3):', product.name || 'Nome nao disponivel');
                return product;
            }
        } catch (error3) {
            console.log('Tentativa 3 falhou:', error3.message);
            if (error3.response) {
                console.log('   Status:', error3.response.status);
                console.log('   Dados:', JSON.stringify(error3.response.data, null, 2));
            }
        }
        
        // Método 4: Basic Auth com user no query
        try {
            console.log('Tentativa 4: Basic Auth com user no query');
            const response4 = await axios.get('https://www.suprides.pt/rest/V1/integration/products-list', {
                params: {
                    user: apiUser,
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
            
            console.log('Tentativa 4 - Status:', response4.status);
            console.log('Tentativa 4 - Resposta:', JSON.stringify(response4.data, null, 2));
            
            if (response4.status === 200 && Array.isArray(response4.data) && response4.data.length > 0) {
                const product = response4.data[0];
                console.log('Produto encontrado na API (Tentativa 4):', product.name || 'Nome nao disponivel');
                return product;
            }
        } catch (error4) {
            console.log('Tentativa 4 falhou:', error4.message);
            if (error4.response) {
                console.log('   Status:', error4.response.status);
                console.log('   Dados:', JSON.stringify(error4.response.data, null, 2));
            }
        }
        
        console.log('Todas as tentativas falharam - produto nao encontrado na API Suprides para EAN:', ean);
        return null;
        
    } catch (error) {
        console.log('Erro geral ao consultar API Suprides:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Dados:', JSON.stringify(error.response.data, null, 2));
        }
        return null;
    }
}

module.exports = getProductFromSupplier;

