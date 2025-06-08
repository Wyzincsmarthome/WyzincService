require('colors');
const fs = require('fs');
const { getProductFromSupplier } = require('../supplierAPI');
const createProductToShopify = require('./createProductToShopify');

function generateProductTags(product) {
    const tags = [];
    
    if (!product) {
        console.log('Produto undefined - nao e possivel gerar tags');
        return [];
    }
    
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

function processProductPrices(product) {
    console.log('Processando precos...');
    console.log('   Preco original (price):', product.price);
    console.log('   PVP original (pvpr):', product.pvpr);
    
    let costPrice = 0;
    let retailPrice = 0;
    
    if (product.price) {
        const priceStr = String(product.price);
        console.log('   Processando price string:', JSON.stringify(priceStr));
        
        const cleanPrice = priceStr.replace(/[^0-9.,]/g, '').replace(',', '.');
        costPrice = parseFloat(cleanPrice) || 0;
        console.log('   Preco de custo final:', costPrice);
    }
    
    if (product.pvpr) {
        const pvprStr = String(product.pvpr);
        console.log('   Processando pvpr string:', JSON.stringify(pvprStr));
        
        const cleanPvpr = pvprStr.replace(/[^0-9.,]/g, '').replace(',', '.');
        retailPrice = parseFloat(cleanPvpr) || costPrice;
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
        stockLower.includes('esgotado') ||
        stockLower.includes('ruptura')
    ) {
        console.log('   Produto sem stock, definindo como 0');
        return 0;
    }
    
    if (stockLower.includes('disponivel') && stockLower.includes('< 10')) {
        console.log('   Stock disponivel < 10, definindo como 9');
        return 9;
    }
    
    if (stockLower.includes('reduzido') && stockLower.includes('< 2')) {
        console.log('   Stock reduzido < 2, definindo como 1');
        return 1;
    }
    
    if (stockLower.includes('brevemente')) {
        console.log('   Produto brevemente disponivel, definindo como 0');
        return 0;
    }
    
    // Stock padrão se não conseguir determinar
    console.log('   Stock indeterminado, definindo como 5');
    return 5;
}

// FUNÇÃO PRINCIPAL QUE ESTAVA EM FALTA!
async function getAllProductsFromShopify(shopifyClient) {
    const stats = {
        processed: 0,
        success: 0,
        errors: 0,
        skipped: 0
    };
    
    try {
        console.log('🚀 Iniciando processamento de produtos...'.green);
        
        // Ler lista de EANs
        const productsListPath = 'src/productsList.txt';
        if (!fs.existsSync(productsListPath)) {
            throw new Error(`Ficheiro ${productsListPath} não encontrado`);
        }
        
        const productsListContent = fs.readFileSync(productsListPath, 'utf8');
        
        // Parsing da lista de EANs
        let EANProductsList;
        if (productsListContent.trim().startsWith('[')) {
            // Formato JSON
            EANProductsList = JSON.parse(productsListContent);
        } else {
            // Formato simples (um EAN por linha)
            EANProductsList = productsListContent
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(line => line.length > 0 && /^[0-9]+$/.test(line));
        }
        
        console.log(`📊 Total de EANs para processar: ${EANProductsList.length}`.cyan);
        
        // Processar cada EAN
        for (let i = 0; i < EANProductsList.length; i++) {
            const ean = EANProductsList[i];
            stats.processed++;
            
            console.log(`\n📦 [${i + 1}/${EANProductsList.length}] Processando EAN: ${ean}`.yellow);
            
            try {
                // 1. Buscar produto da API do fornecedor
                console.log('   🔍 Consultando API do fornecedor...'.cyan);
                const supplierProduct = await getProductFromSupplier(ean);
                
                if (!supplierProduct) {
                    console.log('   ⚠️ Produto não encontrado na API do fornecedor'.yellow);
                    stats.skipped++;
                    continue;
                }
                
                // 2. Verificar se produto tem dados mínimos
                if (!supplierProduct.name || !supplierProduct.ean) {
                    console.log('   ⚠️ Produto com dados insuficientes (sem nome ou EAN)'.yellow);
                    stats.skipped++;
                    continue;
                }
                
                console.log('   ✅ Produto encontrado:', supplierProduct.name);
                
                // 3. Verificar se produto já existe na Shopify
                console.log('   🔍 Verificando se produto já existe na Shopify...'.cyan);
                const existingProduct = await checkIfProductExists(shopifyClient, ean);
                
                if (existingProduct) {
                    console.log('   ⚠️ Produto já existe na Shopify, pulando...'.yellow);
                    stats.skipped++;
                    continue;
                }
                
                // 4. Processar dados do produto
                console.log('   ⚙️ Processando dados do produto...'.cyan);
                
                // Processar preços
                const { costPrice, retailPrice } = processProductPrices(supplierProduct);
                
                // Processar stock
                const stockQuantity = processStock(supplierProduct.stock);
                
                // Criar objeto produto normalizado
                const normalizedProduct = {
                    name: supplierProduct.name || supplierProduct.title || `Produto ${ean}`,
                    ean: ean,
                    price: retailPrice, // Usar PVP como preço principal
                    pvpr: retailPrice,
                    cost_price: costPrice,
                    brand: supplierProduct.brand || '',
                    family: supplierProduct.family || '',
                    description: supplierProduct.description || '',
                    short_description: supplierProduct.short_description || '',
                    stock: supplierProduct.stock || 'Disponível',
                    stock_quantity: stockQuantity,
                    images: supplierProduct.images || []
                };
                
                console.log('   📄 Dados processados:');
                console.log('     • Nome:', normalizedProduct.name);
                console.log('     • EAN:', normalizedProduct.ean);
                console.log('     • Preço:', normalizedProduct.price);
                console.log('     • Marca:', normalizedProduct.brand);
                console.log('     • Stock:', stockQuantity);
                console.log('     • Imagens:', normalizedProduct.images.length);
                
                // 5. Criar produto na Shopify
                console.log('   🛍️ Criando produto na Shopify...'.green);
                await createProductToShopify(shopifyClient, normalizedProduct);
                
                console.log('   ✅ Produto criado com sucesso!'.green);
                stats.success++;
                
                // Delay entre produtos para não sobrecarregar as APIs
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (productError) {
                console.log(`   ❌ Erro ao processar produto ${ean}: ${productError.message}`.red);
                console.error('     Stack:', productError.stack);
                stats.errors++;
                
                // Continuar com próximo produto mesmo em caso de erro
                continue;
            }
        }
        
        console.log('\n🏁 Processamento concluído!'.green.bold);
        return stats;
        
    } catch (error) {
        console.log(`❌ Erro fatal em getAllProductsFromShopify: ${error.message}`.red.bold);
        throw error;
    }
}

// Função auxiliar para verificar se produto já existe
async function checkIfProductExists(shopifyClient, ean) {
    try {
        const query = `
            query getProductsBySku($query: String!) {
                products(first: 1, query: $query) {
                    edges {
                        node {
                            id
                            title
                            variants(first: 1) {
                                edges {
                                    node {
                                        sku
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;
        
        const variables = {
            query: `sku:${ean}`
        };
        
        const response = await shopifyClient.request(query, variables);
        
        if (response && response.data && response.data.products && response.data.products.edges.length > 0) {
            const product = response.data.products.edges[0].node;
            console.log('     Produto existente encontrado:', product.title);
            return product;
        }
        
        return null;
        
    } catch (error) {
        console.log('     Erro ao verificar produto existente:', error.message);
        // Em caso de erro, assumir que não existe para tentar criar
        return null;
    }
}

module.exports = getAllProductsFromShopify;
