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
                const rawProduct = response1.data[0];
                console.log('Produto RAW recebido da API:', JSON.stringify(rawProduct, null, 2));
                
                // Mapear campos corretamente baseado na estrutura real da API
                const product = {
                    ean: ean,
                    name: rawProduct.name || rawProduct.title || rawProduct.product_name || 'Produto sem nome',
                    description: rawProduct.description || rawProduct.short_description || '',
                    short_description: rawProduct.short_description || rawProduct.description || '',
                    price: rawProduct.price || rawProduct.cost || rawProduct.wholesale_price || 0,
                    pvpr: rawProduct.pvpr || rawProduct.retail_price || rawProduct.price || 0,
                    brand: rawProduct.brand || rawProduct.manufacturer || rawProduct.vendor || '',
                    family: rawProduct.family || rawProduct.category || rawProduct.product_type || '',
                    stock: rawProduct.stock || rawProduct.quantity || rawProduct.inventory || 'Disponível',
                    images: rawProduct.images || rawProduct.image_urls || []
                };
                
                console.log('Produto MAPEADO:');
                console.log('   Nome:', product.name);
                console.log('   Preço:', product.price);
                console.log('   PVP:', product.pvpr);
                console.log('   Marca:', product.brand);
                console.log('   Stock:', product.stock);
                
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
                const rawProduct = response2.data[0];
                console.log('Produto RAW recebido da API (endpoint alternativo):', JSON.stringify(rawProduct, null, 2));
                
                // Mapear campos corretamente
                const product = {
                    ean: ean,
                    name: rawProduct.name || rawProduct.title || rawProduct.product_name || 'Produto sem nome',
                    description: rawProduct.description || rawProduct.short_description || '',
                    short_description: rawProduct.short_description || rawProduct.description || '',
                    price: rawProduct.price || rawProduct.cost || rawProduct.wholesale_price || 0,
                    pvpr: rawProduct.pvpr || rawProduct.retail_price || rawProduct.price || 0,
                    brand: rawProduct.brand || rawProduct.manufacturer || rawProduct.vendor || '',
                    family: rawProduct.family || rawProduct.category || rawProduct.product_type || '',
                    stock: rawProduct.stock || rawProduct.quantity || rawProduct.inventory || 'Disponível',
                    images: rawProduct.images || rawProduct.image_urls || []
                };
                
                console.log('Produto MAPEADO (endpoint alternativo):');
                console.log('   Nome:', product.name);
                console.log('   Preço:', product.price);
                console.log('   PVP:', product.pvpr);
                console.log('   Marca:', product.brand);
                console.log('   Stock:', product.stock);
                
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
                const rawProduct = response3.data[0];
                console.log('Produto RAW recebido da API (basic auth):', JSON.stringify(rawProduct, null, 2));
                
                // Mapear campos corretamente
                const product = {
                    ean: ean,
                    name: rawProduct.name || rawProduct.title || rawProduct.product_name || 'Produto sem nome',
                    description: rawProduct.description || rawProduct.short_description || '',
                    short_description: rawProduct.short_description || rawProduct.description || '',
                    price: rawProduct.price || rawProduct.cost || rawProduct.wholesale_price || 0,
                    pvpr: rawProduct.pvpr || rawProduct.retail_price || rawProduct.price || 0,
                    brand: rawProduct.brand || rawProduct.manufacturer || rawProduct.vendor || '',
                    family: rawProduct.family || rawProduct.category || rawProduct.product_type || '',
                    stock: rawProduct.stock || rawProduct.quantity || rawProduct.inventory || 'Disponível',
                    images: rawProduct.images || rawProduct.image_urls || []
                };
                
                console.log('Produto MAPEADO (basic auth):');
                console.log('   Nome:', product.name);
                console.log('   Preço:', product.price);
                console.log('   PVP:', product.pvpr);
                console.log('   Marca:', product.brand);
                console.log('   Stock:', product.stock);
                
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

