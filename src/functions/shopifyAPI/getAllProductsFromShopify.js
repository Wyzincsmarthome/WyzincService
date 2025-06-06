require('colors');
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
        
        // Buscar TODOS os produtos da loja para verificação completa
        let allProducts = [];
        let sinceId = null;
        let pageCount = 0;
        
        console.log('Carregando todos os produtos da Shopify para verificacao...');
        
        while (pageCount < 10) { // Limite de segurança para evitar loops infinitos
            pageCount++;
            
            const params = {
                limit: 250,
                fields: 'id,title,variants'
            };
            
            if (sinceId) {
                params.since_id = sinceId;
            }
            
            console.log(`Carregando página ${pageCount} de produtos...`);
            
            try {
                const response = await restClient.get('/products.json', { params });
                
                if (!response.data || !response.data.products || response.data.products.length === 0) {
                    console.log('Nenhum produto encontrado nesta página - fim da busca');
                    break;
                }
                
                console.log(`Produtos encontrados na página ${pageCount}: ${response.data.products.length}`);
                allProducts = allProducts.concat(response.data.products);
                
                // Atualizar since_id para próxima página
                const lastProduct = response.data.products[response.data.products.length - 1];
                sinceId = lastProduct.id;
                
                // Se retornou menos que o limite, é a última página
                if (response.data.products.length < 250) {
                    console.log('Última página alcançada');
                    break;
                }
                
                // Pequena pausa para não sobrecarregar a API
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (pageError) {
                console.log(`Erro ao carregar página ${pageCount}:`, pageError.message);
                break;
            }
        }
        
        console.log(`Total de produtos carregados: ${allProducts.length}`);
        
        // Mostrar alguns produtos para debug
        console.log('Primeiros 3 produtos para debug:');
        for (let i = 0; i < Math.min(3, allProducts.length); i++) {
            const product = allProducts[i];
            console.log(`Produto ${i + 1}:`);
            console.log(`   ID: ${product.id}`);
            console.log(`   Título: ${product.title}`);
            console.log(`   Variants: ${product.variants ? product.variants.length : 0}`);
            
            if (product.variants && product.variants.length > 0) {
                for (let j = 0; j < product.variants.length; j++) {
                    const variant = product.variants[j];
                    console.log(`      Variant ${j + 1}:`);
                    console.log(`         SKU: ${variant.sku || 'N/A'}`);
                    console.log(`         Barcode: ${variant.barcode || 'N/A'}`);
                }
            }
        }
        
        // Procurar produto com o EAN específico
        console.log(`Procurando produto com EAN: ${ean}`);
        
        for (const product of allProducts) {
            if (product.variants && product.variants.length > 0) {
                for (const variant of product.variants) {
                    const variantSku = variant.sku ? variant.sku.trim() : '';
                    const variantBarcode = variant.barcode ? variant.barcode.trim() : '';
                    const searchEan = ean.trim();
                    
                    console.log(`Comparando EAN ${searchEan} com:`);
                    console.log(`   SKU: "${variantSku}"`);
                    console.log(`   Barcode: "${variantBarcode}"`);
                    
                    if (variantSku === searchEan || variantBarcode === searchEan) {
                        console.log(`PRODUTO ENCONTRADO! ${product.title} (ID: ${product.id})`);
                        console.log(`   Encontrado por: ${variantSku === searchEan ? 'SKU' : 'Barcode'}`);
                        return product;
                    }
                }
            }
        }
        
        console.log(`Nenhum produto encontrado com EAN ${ean} após verificar ${allProducts.length} produtos`);
        return null;
        
    } catch (error) {
        console.log(`Erro ao verificar existência do produto: ${error.message}`);
        if (error.response && error.response.data) {
            console.log('Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
        }
        return null;
    }
}

// Função principal
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
        
        // Criar cliente REST
        const restClient = axios.create({
            baseURL: `https://${storeDomain}/admin/api/2024-07`,
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
            }
        });
        
        // Testar conexão
        try {
            const shopResponse = await restClient.get('/shop.json');
            console.log(`Conexão com Shopify estabelecida: ${shopResponse.data.shop.name}`);
        } catch (connectionError) {
            console.log(`Erro ao conectar com Shopify: ${connectionError.message}`);
            if (connectionError.response) {
                console.log(`Status: ${connectionError.response.status}`);
                console.log(`Dados: ${JSON.stringify(connectionError.response.data)}`);
            }
            throw new Error(`Falha na conexão com Shopify: ${connectionError.message}`);
        }
        
        // Ler lista de EANs
        const productsListPath = path.join(__dirname, '../../productsList.txt');
        
        console.log('Procurando lista de EANs em:', productsListPath);
        
        if (!fs.existsSync(productsListPath)) {
            console.error('Ficheiro productsList.txt nao encontrado em:', productsListPath);
            throw new Error('Ficheiro productsList.txt nao encontrado em: ' + productsListPath);
        }
        
        const productsListContent = fs.readFileSync(productsListPath, 'utf8');
        console.log('Lendo lista de EANs...');
        console.log('Conteudo (primeiros 200 chars):', productsListContent.substring(0, 200));
        
        // Processar lista de EANs
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
                
                console.log('Linhas apos split:', lines);
                
                localEANs = lines.filter(line => {
                    const isValid = line && line.length >= 8 && line.length <= 20 && /^[0-9]+$/.test(line);
                    if (line && !isValid) {
                        console.log('EAN invalido ignorado:', line, '(comprimento:', line.length, ')');
                    } else if (isValid) {
                        console.log('EAN valido encontrado:', line);
                    }
                    return isValid;
                });
                
                console.log('EANs apos validacao:', localEANs);
            }
        } catch (parseError) {
            console.error('Erro ao fazer parse:', parseError.message);
            console.error('Conteudo completo:', productsListContent);
            throw new Error('Erro ao fazer parse do productsList.txt: ' + parseError.message);
        }
        
        if (!Array.isArray(localEANs)) {
            console.error('Conteudo nao e um array');
            console.error('Tipo:', typeof localEANs);
            console.error('Conteudo:', localEANs);
            throw new Error('productsList.txt nao contem um array valido de EANs');
        }
        
        console.log(localEANs.length + ' EANs encontrados na lista local');
        
        if (localEANs.length === 0) {
            console.log('Nenhum EAN valido encontrado na lista local');
            return {
                processed: 0,
                success: 0,
                errors: 0,
                skipped: 0
            };
        }
        
        // Processar cada EAN
        let processedCount = 0;
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        
        for (const ean of localEANs) {
            processedCount++;
            
            console.log('Processando EAN ' + processedCount + '/' + localEANs.length + ': ' + ean);
            
            // Verificar se produto já existe
            const existingProduct = await checkProductExists(restClient, ean);
            
            if (existingProduct) {
                console.log('Produto ja existe na Shopify (SKU/EAN: ' + ean + ') - atualizando...');
                console.log('ID do produto existente:', existingProduct.id);
                console.log('Título do produto existente:', existingProduct.title);
                
                try {
                    const getProductFromSupplier = require('../supplierAPI/getProductFromSupplier');
                    console.log('Consultando API Suprides para atualizacao do EAN:', ean);
                    const productData = await getProductFromSupplier(ean);
                    
                    if (!productData) {
                        console.log('Produto nao encontrado na API Suprides para EAN:', ean);
                        errorCount++;
                        continue;
                    }
                    
                    console.log('Dados obtidos da Suprides para atualizacao:', productData.name || 'Nome nao disponivel');
                    
                    await updateProductViaREST(restClient, existingProduct, productData);
                    successCount++;
                    console.log('Produto atualizado com sucesso na Shopify!');
                    
                } catch (updateError) {
                    errorCount++;
                    console.log('Erro ao atualizar produto EAN ' + ean + ':', updateError.message);
                }
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }
            
            console.log('Produto nao existe na Shopify - obtendo dados da Suprides...');
            
            try {
                const getProductFr
