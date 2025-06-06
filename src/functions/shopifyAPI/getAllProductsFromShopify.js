//Versão com autenticação corrigida para API Suprides
require('colors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

function generateProductTags(product) {
    const tags = [];
    
    if (!product) {
        console.log('Produto undefined - nao e possivel gerar tags');
        return [];
    }
    
    // ===== REGRA ESPECÍFICA PETKIT =====
    // Todos os produtos PetKit são automaticamente "Gadgets P/ Animais"
    if (product.brand && product.brand.toLowerCase() === 'petkit') {
        console.log('Produto PetKit detectado - aplicando tag especifica: Gadgets P/ Animais');
        tags.push('PetKit');
        tags.push('Gadgets P/ Animais');
        console.log('Tags geradas para produto PetKit', product.name || 'produto sem nome', ':', tags);
        return tags;
    }
    
    // ===== PROCESSAMENTO DA MARCA =====
    let brandTag = '';
    if (product.brand) {
        // Mapeamento de marcas para garantir consistência
        const brandMap = {
            'xiaomi': 'Xiaomi',
            'baseus': 'Baseus',
            'torras': 'Torras',
            'apple': 'Apple',
            'hutt': 'Hutt',
            'petkit': 'PetKit',
            'kingston': 'Kingston',
            'anker': 'Anker',
            'ugreen': 'Ugreen',
            'samsung': 'Samsung',
            'lg': 'LG',
            'sony': 'Sony',
            'philips': 'Philips',
            'tp-link': 'TP-Link',
            'aqara': 'Aqara',
            'eufy': 'Eufy',
            'roborock': 'Roborock'
        };
        
        // Caso especial: Xiaomi Yeelight é marcado como Yeelight
        if (product.brand.toLowerCase() === 'xiaomi' && 
            product.name && 
            product.name.toLowerCase().includes('yeelight')) {
            brandTag = 'Yeelight';
        } else {
            // Usar mapeamento ou a marca original com primeira letra maiúscula
            brandTag = brandMap[product.brand.toLowerCase()] || 
                       product.brand.charAt(0).toUpperCase() + product.brand.slice(1).toLowerCase();
        }
        
        if (brandTag) tags.push(brandTag);
    }
    
    // ===== DETERMINAÇÃO DA CATEGORIA =====
    // Extrair informações do produto para análise
    const productName = (product.name || '').toLowerCase();
    const productDescription = (product.description || '').toLowerCase();
    const productFamily = (product.family || '').toLowerCase();
    const productLine = (product.product_line || '').toLowerCase();
    const subFamily = (product.sub_family || '').toLowerCase();
    
    // Criar chave de categoria para mapeamento
    const categoryKey = `${product.product_line || 'N/A'} > ${product.family || 'N/A'} > ${product.sub_family || 'N/A'}`;
    console.log('Categoria Suprides:', categoryKey);
    
    // Mapeamento completo de categorias Suprides para tags Shopify
    const categoryMapping = {
        // Aspiradores
        "Smart Home E Peq. Domésticos > Aspiração > Robot": "Aspirador Robo",
        "Smart Home E Peq. Domésticos > Aspiração > Vertical": "Aspirador Vertical",
        "Smart Home E Peq. Domésticos > Aspiração > N/A": "Aspiradores",
        
        // TVs
        "TV > TVs > Smart TV": "TVs",
        "TV > TVs > QLED": "TVs",
        "TV > TVs > OLED": "TVs",
        "TV > TVs > N/A": "TVs",
        
        // Domótica
        "Smart Home E Peq. Domésticos > Domótica > Sensor": "Sensores Inteligentes",
        "Smart Home E Peq. Domésticos > Domótica > Tomada": "Tomadas",
        "Smart Home E Peq. Domésticos > Domótica > Interruptor": "Interruptor Inteligente",
        "Smart Home E Peq. Domésticos > Domótica > Fechadura": "Fechaduras Inteligentes",
        "Smart Home E Peq. Domésticos > Domótica > Campainha": "Campainha Inteligente",
        "Smart Home E Peq. Domésticos > Domótica > Hub": "Hubs Inteligentes",
        "Smart Home E Peq. Domésticos > Domótica > N/A": "Gadgets Inteligentes",
        
        // Iluminação
        "Smart Home E Peq. Domésticos > Iluminação > Lâmpada": "Iluminacao",
        "Smart Home E Peq. Domésticos > Iluminação > Fita LED": "Iluminacao",
        "Smart Home E Peq. Domésticos > Iluminação > N/A": "Iluminacao",
        
        // Câmaras
        "Smart Home E Peq. Domésticos > Vigilância > Câmara": "Camaras",
        "Smart Home E Peq. Domésticos > Vigilância > N/A": "Camaras",
        
        // Audio
        "Audio > Auscultadores > Bluetooth": "Audio",
        "Audio > Auscultadores > N/A": "Audio",
        "Audio > Colunas > Bluetooth": "Audio",
        "Audio > Colunas > N/A": "Audio",
        "Audio > N/A > N/A": "Audio",
        
        // Smartphones e Tablets
        "Smartphones > Xiaomi > Redmi": "Smartphones",
        "Smartphones > Xiaomi > N/A": "Smartphones",
        "Smartphones > N/A > N/A": "Smartphones",
        "Tablets > Xiaomi > Pad": "Tablets",
        "Tablets > Xiaomi > N/A": "Tablets",
        "Tablets > N/A > N/A": "Tablets",
        
        // Smartwatches
        "Wearables > Smartwatch > Xiaomi": "Smartwatches",
        "Wearables > Smartwatch > N/A": "Smartwatches",
        "Wearables > N/A > N/A": "Smartwatches",
        
        // Carregadores e Cabos
        "Acessórios > Carregadores > USB": "Carregadores e Cabos",
        "Acessórios > Carregadores > N/A": "Carregadores e Cabos",
        "Acessórios > Cabos > USB-C": "Carregadores e Cabos",
        "Acessórios > Cabos > N/A": "Carregadores e Cabos",
        
        // Powerbanks
        "Acessórios > Powerbank > Xiaomi": "Powerbanks",
        "Acessórios > Powerbank > N/A": "Powerbanks",
        
        // Pet
        "Pet > Gadgets > Alimentação": "Gadgets P/ Animais",
        "Pet > Gadgets > Higiene": "Gadgets P/ Animais",
        "Pet > Gadgets > N/A": "Gadgets P/ Animais",
        "Pet > N/A > N/A": "Gadgets P/ Animais"
    };
    
    // Verificar se a categoria existe no mapeamento
    let categoryTag = categoryMapping[categoryKey];
    
    // Se não encontrou no mapeamento, usar análise de texto
    if (!categoryTag) {
        console.log('Categoria não encontrada no mapeamento, usando análise de texto');
        
        // Análise detalhada por palavras-chave no nome e descrição
        if (productName.includes('aspirador robo') || productName.includes('robot vacuum') || productName.includes('mi robot')) {
            categoryTag = 'Aspirador Robo';
        } else if (productName.includes('aspirador vertical') || productDescription.includes('aspirador vertical')) {
            categoryTag = 'Aspirador Vertical';
        } else if (productName.includes('mini aspirador')) {
            categoryTag = 'Mini Aspirador';
        } else if (productName.includes('aspirador') || productFamily.includes('aspiracao')) {
            categoryTag = 'Aspiradores';
        } else if (productName.includes('smart tv') || productName.includes('televisao') || productFamily.includes('tvs') || 
                   productName.includes(' tv ') || productName.includes('qled') || productName.includes('oled')) {
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
        } else if (productName.includes('iluminacao') || productName.includes('luz') || productName.includes('lamp') || 
                   productName.includes('light')) {
            categoryTag = 'Iluminacao';
        } else if (productName.includes('cortina') || productName.includes('curtain')) {
            categoryTag = 'Motor Cortinas';
        } else if (productName.includes('campainha') || productName.includes('doorbell')) {
            categoryTag = 'Campainha Inteligente';
        } else if (productName.includes('interruptor') || productName.includes('switch')) {
            categoryTag = 'Interruptor Inteligente';
        } else if (productName.includes('hub') || productName.includes('gateway')) {
            categoryTag = 'Hubs Inteligentes';
        } else if (productName.includes('assistente virtual') || productName.includes('alexa') || 
                   productName.includes('google assistant')) {
            categoryTag = 'Assistentes Virtuais';
        } else if (productName.includes('painel')) {
            categoryTag = 'Painel Controlo';
        } else if (productName.includes('acessorio') && productName.includes('aspirador')) {
            categoryTag = 'Acessorios Aspiradores';
        } else if (productName.includes('carregador') || productName.includes('charger') || productName.includes('cabo')) {
            categoryTag = 'Carregadores e Cabos';
        } else if (productName.includes('powerbank') || productName.includes('bateria externa')) {
            categoryTag = 'Powerbanks';
        } else if (productName.includes('auricular') || productName.includes('headphone') || productName.includes('earphone')) {
            categoryTag = 'Audio';
        } else if (productName.includes('smartphone') || productName.includes('telemovel')) {
            categoryTag = 'Smartphones';
        } else if (productName.includes('tablet')) {
            categoryTag = 'Tablets';
        } else if (productName.includes('smartwatch') || productName.includes('relogio')) {
            categoryTag = 'Smartwatches';
        } else if (productName.includes('inteligente') || productName.includes('smart')) {
            categoryTag = 'Gadgets Inteligentes';
        } else if (productLine.includes('pet') || productName.includes('animal') || productName.includes('pet')) {
            categoryTag = 'Gadgets P/ Animais';
        } else {
            // Categoria padrão para produtos não classificados
            categoryTag = 'Gadgets Diversos';
        }
    }
    
    if (categoryTag) tags.push(categoryTag);
    
    console.log('Tags geradas para', product.name || 'produto sem nome', ':', tags);
    return tags;
}

function processProductPrices(product) {
    console.log('Processando precos...');
    console.log('   Preco original (price):', product.price);
    console.log('   PVP original (pvpr):', product.pvpr);
    
    let costPrice = 0;
    let retailPrice = 0;
    
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

function processStock(stockString) {
    console.log('Processando stock:', stockString);
    
    if (!stockString) {
        console.log('   Stock nao definido, definindo como 0');
        return 0;
    }
    
    const stockLower = stockString.toLowerCase();
    
    if (
        stockLower.includes('sem stock') || 
        stockLower.includes('indisponivel') || 
        stockLower.includes('indisponivel') ||
        stockLower.includes('esgotado') ||
        stockLower.includes('ruptura')
    ) {
        console.log('   Produto sem stock, definindo como 0');
        return 0;
    }
    
    if (
        stockLower.includes('reduzido') || 
        stockLower.includes('< 2') ||
        stockLower.includes('limitado')
    ) {
        console.log('   Stock reduzido, definindo como 1');
        return 1;
    }
    
    if (
        stockLower.includes('disponivel') || 
        stockLower.includes('disponivel') ||
        stockLower.includes('< 10')
    ) {
        console.log('   Stock disponivel limitado, definindo como 5');
        return 5;
    }
    
    if (
        stockLower.includes('abundante') || 
        stockLower.includes('> 10') ||
        stockLower.includes('elevado')
    ) {
        console.log('   Stock abundante, definindo como 20');
        return 20;
    }
    
    console.log('   Padrao de stock nao reconhecido, definindo como 0 por seguranca');
    return 0;
}

async function checkProductExists(restClient, ean) {
    try {
        console.log('Verificando se produto com EAN ' + ean + ' ja existe na Shopify...');
        
        let allProducts = [];
        let sinceId = null;
        let pageCount = 0;
        
        console.log('Carregando todos os produtos da Shopify para verificacao...');
        
        while (pageCount < 10) {
            pageCount++;
            
            const params = {
                limit: 250,
                fields: 'id,title,variants'
            };
            
            if (sinceId) {
                params.since_id = sinceId;
            }
            
            console.log('Carregando pagina ' + pageCount + ' de produtos...');
            
            try {
                const response = await restClient.get('/products.json', { params });
                
                if (!response.data || !response.data.products || response.data.products.length === 0) {
                    console.log('Nenhum produto encontrado nesta pagina - fim da busca');
                    break;
                }
                
                console.log('Produtos encontrados na pagina ' + pageCount + ': ' + response.data.products.length);
                allProducts = allProducts.concat(response.data.products);
                
                const lastProduct = response.data.products[response.data.products.length - 1];
                sinceId = lastProduct.id;
                
                if (response.data.products.length < 250) {
                    console.log('Ultima pagina alcancada');
                    break;
                }
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (pageError) {
                console.log('Erro ao carregar pagina ' + pageCount + ':', pageError.message);
                break;
            }
        }
        
        console.log('Total de produtos carregados: ' + allProducts.length);
        
        console.log('Procurando produto com EAN: ' + ean);
        
        for (const product of allProducts) {
            if (product.variants && product.variants.length > 0) {
                for (const variant of product.variants) {
                    const variantSku = variant.sku ? variant.sku.trim() : '';
                    const variantBarcode = variant.barcode ? variant.barcode.trim() : '';
                    const searchEan = ean.trim();
                    
                    if (variantSku === searchEan || variantBarcode === searchEan) {
                        console.log('PRODUTO ENCONTRADO! ' + product.title + ' (ID: ' + product.id + ')');
                        console.log('   Encontrado por: ' + (variantSku === searchEan ? 'SKU' : 'Barcode'));
                        return product;
                    }
                }
            }
        }
        
        console.log('Nenhum produto encontrado com EAN ' + ean);
        return null;
        
    } catch (error) {
        console.log('Erro ao verificar existencia do produto: ' + error.message);
        return null;
    }
}

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

async function updateProductViaREST(restClient, existingProduct, supplierProduct) {
    try {
        console.log('Atualizando produto via REST API...');
        console.log('   ID:', existingProduct.id);
        console.log('   Titulo:', supplierProduct.name);
        
        const { costPrice, retailPrice } = processProductPrices(supplierProduct);
        const stock = processStock(supplierProduct.stock);
        const tags = generateProductTags(supplierProduct);
        
        console.log('Tags geradas:', tags);
        
        const productData = {
            product: {
                id: existingProduct.id,
                title: supplierProduct.name,
                body_html: supplierProduct.description || '',
                vendor: supplierProduct.brand || '',
                product_type: tags.length > 1 ? tags[1] : 'Produto',
                tags: tags.join(', ')
            }
        };
        
        const productResponse = await restClient.put('/products/' + existingProduct.id + '.json', productData);
        console.log('Produto atualizado com sucesso via REST API!');
        
        if (existingProduct.variants && existingProduct.variants.length > 0) {
            const variantId = existingProduct.variants[0].id;
            
            const variantData = {
                variant: {
                    id: variantId,
                    price: retailPrice.toFixed(2),
                    compare_at_price: retailPrice > costPrice ? retailPrice.toFixed(2) : null,
                    sku: supplierProduct.ean,
                    barcode: supplierProduct.ean,
                    inventory_quantity: stock,
                    inventory_management: 'shopify'
                }
            };
            
            const variantResponse = await restClient.put('/variants/' + variantId + '.json', variantData);
            console.log('Variant atualizada com sucesso via REST API!');
            console.log('   Preco final:', retailPrice + ' euros');
            console.log('   Stock final:', stock);
        }
        
        return true;
        
    } catch (error) {
        console.log('Erro ao atualizar produto via REST API:', error.message);
        if (error.response && error.response.data) {
            console.log('Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
}

async function createProductViaREST(restClient, supplierProduct) {
    try {
        console.log('Criando produto via REST API:', supplierProduct.name);
        
        const { costPrice, retailPrice } = processProductPrices(supplierProduct);
        const stock = processStock(supplierProduct.stock);
        const tags = generateProductTags(supplierProduct);
        
        console.log('Tags geradas:', tags);
        
        const productData = {
            product: {
                title: supplierProduct.name,
                body_html: supplierProduct.description || '',
                vendor: supplierProduct.brand || '',
                product_type: tags.length > 1 ? tags[1] : 'Produto',
                tags: tags.join(', '),
                variants: [{
                    price: retailPrice.toFixed(2),
                    compare_at_price: retailPrice > costPrice ? retailPrice.toFixed(2) : null,
                    sku: supplierProduct.ean,
                    barcode: supplierProduct.ean,
                    inventory_quantity: stock,
                    inventory_management: 'shopify'
                }]
            }
        };
        
        if (supplierProduct.images && supplierProduct.images.length > 0) {
            productData.product.images = supplierProduct.images.map(imageUrl => ({
                src: imageUrl
            }));
        }
        
        const response = await restClient.post('/products.json', productData);
        console.log('Produto criado com sucesso via REST API!');
        console.log('   ID:', response.data.product.id);
        console.log('   Preco final:', retailPrice + ' euros');
        console.log('   Stock final:', stock);
        
        return response.data.product;
        
    } catch (error) {
        console.log('Erro ao criar produto via REST API:', error.message);
        if (error.response && error.response.data) {
            console.log('Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
        }
        return null;
    }
}

async function getAllProductsFromShopify(shopifyClient) {
    try {
        console.log('Obtendo produtos da Shopify via REST API...');
        
        const storeUrl = process.env.SHOPIFY_STORE_URL;
        const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
        
        if (!storeUrl || !accessToken) {
            throw new Error('Variaveis de ambiente SHOPIFY_STORE_URL ou SHOPIFY_ACCESS_TOKEN nao definidas');
        }
        
        let storeDomain = storeUrl;
        if (storeUrl.includes('://')) {
            storeDomain = storeUrl.split('://')[1];
        }
        if (!storeDomain.includes('.myshopify.com')) {
            storeDomain = storeDomain + '.myshopify.com';
        }
        
        const restClient = axios.create({
            baseURL: 'https://' + storeDomain + '/admin/api/2024-07',
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
            }
        });
        
        try {
            const shopResponse = await restClient.get('/shop.json');
            console.log('Conexao com Shopify estabelecida: ' + shopResponse.data.shop.name);
        } catch (connectionError) {
            console.log('Erro ao conectar com Shopify: ' + connectionError.message);
            throw new Error('Falha na conexao com Shopify: ' + connectionError.message);
        }
        
        const productsListPath = path.join(__dirname, '../../productsList.txt');
        
        console.log('Procurando lista de EANs em:', productsListPath);
        
        if (!fs.existsSync(productsListPath)) {
            console.error('Ficheiro productsList.txt nao encontrado em:', productsListPath);
            throw new Error('Ficheiro productsList.txt nao encontrado em: ' + productsListPath);
        }
        
        const productsListContent = fs.readFileSync(productsListPath, 'utf8');
        console.log('Lendo lista de EANs...');
        console.log('Conteudo (primeiros 200 chars):', productsListContent.substring(0, 200));
        
        let localEANs;
        try {
            if (productsListContent.trim().startsWith('[')) {
                console.log('Detectado formato JSON');
                localEANs = JSON.parse(productsListContent);
            } else {
                console.log('Detectado formato simples (um EAN por linha)');
                
                const lines = productsListContent
                    .split(/\r?\n/)
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                
                localEANs = lines.filter(line => {
                    const isValid = line && line.length >= 8 && line.length <= 20 && /^[0-9]+$/.test(line);
                    if (line && !isValid) {
                        console.log('EAN invalido ignorado:', line);
                    }
                    return isValid;
                });
            }
        } catch (parseError) {
            console.error('Erro ao fazer parse:', parseError.message);
            throw new Error('productsList.txt nao contem um array valido');
        }
        
        if (!Array.isArray(localEANs) || localEANs.length === 0) {
            throw new Error('productsList.txt nao contem EANs validos');
        }
        
        console.log(localEANs.length + ' EANs encontrados na lista local');
        
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        
        for (let i = 0; i < localEANs.length; i++) {
            const ean = localEANs[i];
            
            if (!ean || ean.trim() === '') {
                console.log('EAN vazio ignorado na posicao ' + i);
                skippedCount++;
                continue;
            }
            
            console.log('Processando EAN ' + (i + 1) + '/' + localEANs.length + ': ' + ean);
            
            try {
                const existingProduct = await checkProductExists(restClient, ean);
                
                if (existingProduct) {
                    console.log('Produto ja existe na Shopify (SKU/EAN: ' + ean + ') - atualizando...');
                    
                    console.log('Consultando API Suprides para atualizacao do EAN:', ean);
                    const supplierProduct = await getProductFromSupplier(ean);
                    
                    if (supplierProduct) {
                        console.log('Dados obtidos da Suprides para atualizacao:', supplierProduct.name);
                        const updateSuccess = await updateProductViaREST(restClient, existingProduct, supplierProduct);
                        
                        if (updateSuccess) {
                            console.log('Produto atualizado com sucesso na Shopify!');
                            successCount++;
                        } else {
                            console.log('Falha ao atualizar produto na Shopify');
                            errorCount++;
                        }
                    } else {
                        console.log('Produto nao encontrado na API Suprides para atualizacao');
                        errorCount++;
                    }
                } else {
                    console.log('Produto nao existe na Shopify - obtendo dados da Suprides...');
                    
                    const supplierProduct = await getProductFromSupplier(ean);
                    
                    if (supplierProduct) {
                        const createdProduct = await createProductViaREST(restClient, supplierProduct);
                        
                        if (createdProduct) {
                            console.log('Produto criado com sucesso na Shopify!');
                            successCount++;
                        } else {
                            console.log('Falha ao criar produto na Shopify');
                            errorCount++;
                        }
                    } else {
                        console.log('Produto nao encontrado na API Suprides');
                        errorCount++;
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (productError) {
                console.log('Erro ao processar o EAN ' + ean + ':', productError.message);
                errorCount++;
            }
        }
        
        console.log('Sincronizacao concluida!');
        console.log('   Total processados: ' + localEANs.length);
        console.log('   Sucessos: ' + successCount);
        console.log('   Erros: ' + errorCount);
        console.log('   Ignorados (vazios): ' + skippedCount);
        console.log('   Taxa de sucesso: ' + ((successCount / (successCount + errorCount)) * 100).toFixed(1) + '%');
        
        return {
            total: localEANs.length,
            success: successCount,
            errors: errorCount,
            skipped: skippedCount
        };
        
    } catch (error) {
        console.error('Erro fatal na sincronizacao:', error.message);
        throw error;
    }
}

module.exports = getAllProductsFromShopify;

