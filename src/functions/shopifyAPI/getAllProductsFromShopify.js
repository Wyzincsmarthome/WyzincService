const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Função para gerar tags de produto
function generateProductTags(product) {
    const tags = [];
    
    if (!product) {
        console.log('Produto undefined - nao e possivel gerar tags');
        return [];
    }
    
    // TAG DE MARCA
    let brandTag = '';
    if (product.brand) {
        if (product.brand.toLowerCase() === 'xiaomi' && product.name && product.name.toLowerCase().includes('yeelight')) {
            brandTag = 'Yeelight';
        } else {
            const brandMap = {
                'xiaomi': 'Xiaomi',
                'baseus': 'Baseus',
                'torras': 'Torras',
                'apple': 'Apple',
                'hutt': 'Hutt',
                'petkit': 'Petkit',
                'kingston': 'Kingston'
            };
            brandTag = brandMap[product.brand.toLowerCase()] || product.brand;
        }
        if (brandTag) tags.push(brandTag);
    }
    
    // TAG DE CATEGORIA
    let categoryTag = '';
    const productName = (product.name || '').toLowerCase();
    const productDescription = (product.description || '').toLowerCase();
    const productFamily = (product.family || '').toLowerCase();
    
    if (productName.includes('aspirador robo') || productName.includes('robot vacuum') || productName.includes('mi robot')) {
        categoryTag = 'Aspirador Robo';
    } else if (productName.includes('aspirador vertical') || productDescription.includes('aspirador vertical') || productDescription.includes('tipo aspirador vertical')) {
        categoryTag = 'Aspirador Vertical';
    } else if (productName.includes('mini aspirador')) {
        categoryTag = 'Mini Aspirador';
    } else if (productName.includes('aspirador') || productFamily.includes('aspiracao')) {
        categoryTag = 'Aspiradores';
    } else if (productName.includes('smart tv') || productName.includes('televisao') || productFamily.includes('tvs') || productName.includes(' tv ') || productName.includes('qled') || productName.includes('oled')) {
        categoryTag = 'TVs';
    } else if (productName.includes('camara') || productName.includes('camera') || productName.includes('webcam')) {
        categoryTag = 'Camaras';
    } else if (productName.includes('sensor')) {
        categoryTag = 'Sensores Inteligentes';
    } else if (productName.includes('fechadura') || productName.includes('lock')) {
        categoryTag = 'Fechaduras Inteligentes';
    } else if (productName.includes('tomada') || productName.includes('socket') || productName.includes('plug')) {
        categoryTag = 'Tomadas';
    } else if (productName.includes('controlo remoto') || productName.includes('comando') || productName.includes('remote')) {
        categoryTag = 'Controlo Remoto';
    } else if (productName.includes('iluminacao') || productName.includes('luz') || productName.includes('lamp') || productName.includes('light')) {
        categoryTag = 'Iluminacao';
    } else if (productName.includes('cortina') || productName.includes('curtain')) {
        categoryTag = 'Motor Cortinas';
    } else if (productName.includes('campainha') || productName.includes('doorbell')) {
        categoryTag = 'Campainha Inteligente';
    } else if (productName.includes('interruptor') || productName.includes('switch')) {
        categoryTag = 'Interruptor Inteligente';
    } else if (productName.includes('hub') || productName.includes('gateway')) {
        categoryTag = 'Hubs Inteligentes';
    } else if (productName.includes('assistente virtual') || productName.includes('alexa') || productName.includes('google assistant')) {
        categoryTag = 'Assistentes Virtuais';
    } else if (productName.includes('painel')) {
        categoryTag = 'Painel Controlo';
    } else if (productName.includes('acessorio') && productName.includes('aspirador')) {
        categoryTag = 'Acessorios Aspiradores';
    } else if (productName.includes('inteligente') || productName.includes('smart')) {
        categoryTag = 'Gadgets Inteligentes';
    } else {
        if (product.brand && product.brand.toLowerCase() === 'petkit') {
            categoryTag = 'Gadgets P/ Animais';
        } else {
            categoryTag = 'Gadgets Diversos';
        }
    }
    
    if (categoryTag) tags.push(categoryTag);
    
    console.log('Tags geradas para', product.name || 'produto sem nome', ':', tags);
    return tags;
}

// Função para processar preços
function processProductPrices(product) {
    console.log('Processando precos...');
    console.log('   Preco original (price):', product.price);
    console.log('   PVP original (pvpr):', product.pvpr);
    
    let costPrice = 0;
    let retailPrice = 0;
    
    // Processar preco de custo
    if (product.price) {
        const priceStr = String(product.price);
        console.log('   Processando price string:', JSON.stringify(priceStr));
        
        const cleanPrice1 = priceStr.replace(',', '.');
        const cleanPrice2 = priceStr.replace(/,/g, '.');
        const cleanPrice3 = priceStr.replace(/[^0-9.,]/g, '').replace(',', '.');
        
        console.log('   cleanPrice1:', cleanPrice1);
        console.log('   cleanPrice2:', cleanPrice2);
        console.log('   cleanPrice3:', cleanPrice3);
        
        costPrice = parseFloat(cleanPrice3) || parseFloat(cleanPrice2) || parseFloat(cleanPrice1) || 0;
        console.log('   Preco de custo final:', costPrice);
    }
    
    // Processar PVP
    if (product.pvpr) {
        const pvprStr = String(product.pvpr);
        console.log('   Processando pvpr string:', JSON.stringify(pvprStr));
        
        const cleanPvpr1 = pvprStr.replace(',', '.');
        const cleanPvpr2 = pvprStr.replace(/,/g, '.');
        const cleanPvpr3 = pvprStr.replace(/[^0-9.,]/g, '').replace(',', '.');
        
        console.log('   cleanPvpr1:', cleanPvpr1);
        console.log('   cleanPvpr2:', cleanPvpr2);
        console.log('   cleanPvpr3:', cleanPvpr3);
        
        retailPrice = parseFloat(cleanPvpr3) || parseFloat(cleanPvpr2) || parseFloat(cleanPvpr1) || costPrice;
        console.log('   PVP final:', retailPrice);
    } else {
        retailPrice = costPrice;
    }
    
    // Validacao final
    if (costPrice <= 0) {
        console.log('Preco de custo invalido, usando 1 euro');
        costPrice = 1;
    }
    if (retailPrice <= 0) {
        console.log('PVP invalido, usando preco de custo');
        retailPrice = costPrice;
    }
    
    console.log('Precos finais processados:');
    console.log('   Preco de custo:', costPrice + ' euros');
    console.log('   PVP (preco de venda):', retailPrice + ' euros');
    
    return { costPrice, retailPrice };
}

// Função para processar stock
function processStock(stockString) {
    console.log('Processando stock:', stockString);
    
    if (!stockString) {
        console.log('   Stock não definido, definindo como 0');
        return 0;
    }
    
    const stockLower = stockString.toLowerCase();
    
    // Verificar se está sem stock
    if (
        stockLower.includes('sem stock') || 
        stockLower.includes('indisponivel') || 
        stockLower.includes('indisponível') ||
        stockLower.includes('esgotado') ||
        stockLower.includes('ruptura')
    ) {
        console.log('   Produto sem stock, definindo como 0');
        return 0;
    }
    
    // Verificar stock reduzido
    if (
        stockLower.includes('reduzido') || 
        stockLower.includes('< 2') ||
        stockLower.includes('limitado')
    ) {
        console.log('   Stock reduzido, definindo como 1');
        return 1;
    }
    
    // Verificar stock disponível mas limitado
    if (
        stockLower.includes('disponivel') || 
        stockLower.includes('disponível') ||
        stockLower.includes('< 10')
    ) {
        console.log('   Stock disponível limitado, definindo como 5');
        return 5;
    }
    
    // Verificar stock abundante
    if (
        stockLower.includes('abundante') || 
        stockLower.includes('> 10') ||
        stockLower.includes('elevado')
    ) {
        console.log('   Stock abundante, definindo como 20');
        return 20;
    }
    
    // Valor padrão para casos não identificados
    console.log('   Padrão de stock não reconhecido, definindo como 0 por segurança');
    return 0;
}

// Função para verificar se um produto já existe na Shopify
async function checkProductExists(restClient, ean) {
    try {
        console.log(`Verificando se produto com EAN ${ean} já existe na Shopify...`);
        
        // Buscar produtos por SKU
        const skuResponse = await restClient.get('/products.json', {
            params: {
                query: `sku:${ean}`,
                fields: 'id,title,variants'
            }
        });
        
        if (skuResponse.data && skuResponse.data.products && skuResponse.data.products.length > 0) {
            const product = skuResponse.data.products[0];
            console.log(`Produto encontrado por SKU: ${product.title} (ID: ${product.id})`);
            return product;
        }
        
        // Se não encontrou por SKU, buscar por barcode
        const barcodeResponse = await restClient.get('/products.json', {
            params: {
                query: `barcode:${ean}`,
                fields: 'id,title,variants'
            }
        });
        
        if (barcodeResponse.data && barcodeResponse.data.products && barcodeResponse.data.products.length > 0) {
            const product = barcodeResponse.data.products[0];
            console.log(`Produto encontrado por barcode: ${product.title} (ID: ${product.id})`);
            return product;
        }
        
        console.log(`Nenhum produto encontrado com EAN ${ean}`);
        return null;
    } catch (error) {
        console.log(`Erro ao verificar existência do produto: ${error.message}`);
        return null;
    }
}

// Função para consultar API Suprides com autenticação corrigida
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
        console.log('   API_USER:', apiUser ? 'Definido' : 'Nao definido');
        console.log('   API_PASSWORD:', apiPassword ? 'Definido' : 'Nao definido');
        console.log('   API_TOKEN:', apiToken ? 'Definido (primeiros 10 chars: ' + apiToken.substring(0, 10) + '...)' : 'Nao definido');
        
        // Método 1: Apenas Bearer Token (que funcionou nos testes anteriores)
        console.log('Tentativa 1: Apenas Bearer Token');
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
            
            console.log('Tentativa 1 - Status:', response1.status);
            
            if (response1.status === 200 && Array.isArray(response1.data) && response1.data.length > 0) {
                const product = response1.data[0];
                console.log('Produto encontrado na API (Tentativa 1):', product.name || 'Nome nao disponivel');
                console.log('Stock recebido da API:', product.stock);
                console.log('Marca:', product.brand);
                return product;
            } else if (response1.status === 200 && Array.isArray(response1.data) && response1.data.length === 0) {
                console.log('Tentativa 1: Produto nao encontrado (array vazio)');
            } else {
                console.log('Tentativa 1: Resposta inesperada:', typeof response1.data, response1.data);
            }
            
        } catch (error1) {
            console.log('Tentativa 1 falhou:', error1.message);
            if (error1.response) {
                console.log('   Status:', error1.response.status);
                console.log('   Dados:', JSON.stringify(error1.response.data, null, 2));
            }
        }
        
        // Método 2: Endpoint alternativo
        console.log('Tentativa 2: Endpoint alternativo');
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
            
            console.log('Tentativa 2 - Status:', response2.status);
            
            if (response2.status === 200 && Array.isArray(response2.data) && response2.data.length > 0) {
                const product = response2.data[0];
                console.log('Produto encontrado na API (Tentativa 2):', product.name || 'Nome nao disponivel');
                console.log('Stock recebido da API:', product.stock);
                console.log('Marca:', product.brand);
                return product;
            } else if (response2.status === 200 && Array.isArray(response2.data) && response2.data.length === 0) {
                console.log('Tentativa 2: Produto nao encontrado (array vazio)');
            } else {
                console.log('Tentativa 2: Resposta inesperada:', typeof response2.data, response2.data);
            }
            
        } catch (error2) {
            console.log('Tentativa 2 falhou:', error2.message);
            if (error2.response) {
                console.log('   Status:', error2.response.status);
                console.log('   Dados:', JSON.stringify(error2.response.data, null, 2));
            }
        }
        
        // Método 3: Apenas Basic Auth
        console.log('Tentativa 3: Apenas Basic Auth');
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
            
            console.log('Tentativa 3 - Status:', response3.status);
            
            if (response3.status === 200 && Array.isArray(response3.data) && response3.data.length > 0) {
                const product = response3.data[0];
                console.log('Produto encontrado na API (Tentativa 3):', product.name || 'Nome nao disponivel');
                console.log('Stock recebido da API:', product.stock);
                console.log('Marca:', product.brand);
                return product;
            } else if (response3.status === 200 && Array.isArray(response3.data) && response3.data.length === 0) {
                console.log('Tentativa 3: Produto nao encontrado (array vazio)');
            } else {
                console.log('Tentativa 3: Resposta inesperada:', typeof response3.data, response3.data);
            }
            
        } catch (error3) {
            console.log('Tentativa 3 falhou:', error3.message);
            if (error3.response) {
                console.log('   Status:', error3.response.status);
                console.log('   Dados:', JSON.stringify(error3.response.data, null, 2));
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

// Função para atualizar produto existente
async function updateProductViaREST(restClient, existingProduct, productData) {
    try {
        console.log('Atualizando produto via REST API:', productData.name);
        
        const { costPrice, retailPrice } = processProductPrices(productData);
        const tags = generateProductTags(productData);
        
        // Processar stock
        const inventory_quantity = processStock(productData.stock);
        
        const productUpdateData = {
            product: {
                id: existingProduct.id,
                title: productData.name,
                body_html: (productData.short_description || '') + "\n\n" + (productData.description || ''),
                vendor: productData.brand || '',
                product_type: productData.family || '',
                tags: tags.join(', ')
            }
        };
        
        console.log('Atualizando produto via REST API...');
        console.log('   ID:', existingProduct.id);
        console.log('   Titulo:', productUpdateData.product.title);
        console.log('   Tags:', productUpdateData.product.tags);
        
        const productResponse = await restClient.put(`/products/${existingProduct.id}.json`, productUpdateData);
        
        if (existingProduct.variants && existingProduct.variants.length > 0) {
            const variantId = existingProduct.variants[0].id;
            
            const variantUpdateData = {
                variant: {
                    id: variantId,
                    price: retailPrice.toFixed(2),
                    cost: costPrice.toFixed(2),
                    inventory_quantity: inventory_quantity,
                    sku: productData.ean,
                    barcode: productData.ean
                }
            };
            
            console.log('Atualizando variant via REST API...');
            console.log('   Variant ID:', variantId);
            console.log('   Preco:', variantUpdateData.variant.price);
            console.log('   Custo:', variantUpdateData.variant.cost);
            console.log('   Stock:', variantUpdateData.variant.inventory_quantity);
            
            const variantResponse = await restClient.put(`/variants/${variantId}.json`, variantUpdateData);
            console.log('Variant atualizada com sucesso!');
        }
        
        console.log('Produto atualizado com sucesso na Shopify!');
        return true;
        
    } catch (error) {
        console.log('Erro ao atualizar produto via REST API:', error.message);
        if (error.response && error.response.data) {
            console.log('Detalhes do erro
