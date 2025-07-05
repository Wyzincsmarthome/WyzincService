// FICHEIRO COMPLETO E MODIFICADO: src/functions/shopifyAPI/getAllProductsFromShopify.js

require('colors');
const fs = require('fs');
const pLimit = require('p-limit');
const { getProductFromSupplier } = require('../supplierAPI');
const createProductToShopify = require('./createProductToShopify');

// As funções auxiliares não precisam de alteração
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
            const brandMap = { 'xiaomi': 'Xiaomi', 'baseus': 'Baseus', 'torras': 'Torras', 'apple': 'Apple', 'hutt': 'Hutt', 'petkit': 'Petkit', 'kingston': 'Kingston' };
            brandTag = brandMap[product.brand.toLowerCase()] || product.brand;
        }
        if (brandTag) tags.push(brandTag);
    }
    let categoryTag = '';
    const productName = (product.name || '').toLowerCase();
    const productDescription = (product.description || '').toLowerCase();
    const productFamily = (product.family || '').toLowerCase();
    if (productName.includes('aspirador robo') || productName.includes('robot vacuum') || productName.includes('mi robot')) { categoryTag = 'Aspirador Robo'; } else if (productName.includes('aspirador vertical') || productDescription.includes('aspirador vertical') || productDescription.includes('tipo aspirador vertical')) { categoryTag = 'Aspirador Vertical'; } else if (productName.includes('mini aspirador')) { categoryTag = 'Mini Aspirador'; } else if (productName.includes('aspirador') || productFamily.includes('aspiracao')) { categoryTag = 'Aspiradores'; } else if (productName.includes('smart tv') || productName.includes('televisao') || productFamily.includes('tvs') || productName.includes(' tv ') || productName.includes('qled') || productName.includes('oled')) { categoryTag = 'TVs'; } else if (productName.includes('camara') || productName.includes('camera') || productName.includes('webcam')) { categoryTag = 'Camaras'; } else if (productName.includes('sensor')) { categoryTag = 'Sensores Inteligentes'; } else if (productName.includes('fechadura') || productName.includes('lock')) { categoryTag = 'Fechaduras Inteligentes'; } else if (productName.includes('tomada') || productName.includes('socket') || productName.includes('plug')) { categoryTag = 'Tomadas'; } else if (productName.includes('controlo remoto') || productName.includes('comando') || productName.includes('remote')) { categoryTag = 'Controlo Remoto'; } else if (productName.includes('iluminacao') || productName.includes('luz') || productName.includes('lamp') || productName.includes('light')) { categoryTag = 'Iluminacao'; } else if (productName.includes('cortina') || productName.includes('curtain')) { categoryTag = 'Motor Cortinas'; } else if (productName.includes('campainha') || productName.includes('doorbell')) { categoryTag = 'Campainha Inteligente'; } else if (productName.includes('interruptor') || productName.includes('switch')) { categoryTag = 'Interruptor Inteligente'; } else if (productName.includes('hub') || productName.includes('gateway')) { categoryTag = 'Hubs Inteligentes'; } else if (productName.includes('assistente virtual') || productName.includes('alexa') || productName.includes('google assistant')) { categoryTag = 'Assistentes Virtuais'; } else if (productName.includes('painel')) { categoryTag = 'Painel Controlo'; } else if (productName.includes('acessorio') && productName.includes('aspirador')) { categoryTag = 'Acessorios Aspiradores'; } else if (productName.includes('inteligente') || productName.includes('smart')) { categoryTag = 'Gadgets Inteligentes'; } else { if (product.brand && product.brand.toLowerCase() === 'petkit') { categoryTag = 'Gadgets P/ Animais'; } else { categoryTag = 'Gadgets Diversos'; } }
    if (categoryTag) tags.push(categoryTag);
    console.log('Tags geradas para', product.name || 'produto sem nome', ':', tags);
    return tags;
}

function processProductPrices(product) {
    console.log('Processando precos...');
    let costPrice = 0, retailPrice = 0;
    if (product.price) { const priceStr = String(product.price); const cleanPrice = priceStr.replace(/[^0-9.,]/g, '').replace(',', '.'); costPrice = parseFloat(cleanPrice) || 0; }
    if (product.pvpr) { const pvprStr = String(product.pvpr); const cleanPvpr = pvprStr.replace(/[^0-9.,]/g, '').replace(',', '.'); retailPrice = parseFloat(cleanPvpr) || costPrice; } else { retailPrice = costPrice; }
    if (costPrice <= 0) costPrice = 1;
    if (retailPrice <= 0) retailPrice = costPrice;
    console.log('Precos finais processados: Custo:', costPrice, 'Venda:', retailPrice);
    return { costPrice, retailPrice };
}

function processStock(stockString) {
    console.log('Processando stock:', stockString);
    if (!stockString) return 0;
    const stockLower = stockString.toLowerCase();
    if (stockLower.includes('sem stock') || stockLower.includes('indisponivel') || stockLower.includes('esgotado') || stockLower.includes('ruptura')) return 0;
    if (stockLower.includes('disponivel') && stockLower.includes('< 10')) return 9;
    if (stockLower.includes('reduzido') && stockLower.includes('< 2')) return 1;
    if (stockLower.includes('brevemente')) return 0;
    return 5;
}

// NOVO: Função para processar um único produto, para ser usada com p-limit
async function processSingleEan(ean, index, total, shopifyClient) {
    console.log(`\n📦 [${index + 1}/${total}] Iniciando EAN: ${ean}`.yellow);
    try {
        // 1. Buscar produto da API do fornecedor
        console.log(`  🔍 [${ean}] Consultando API do fornecedor...`.cyan);
        const supplierProduct = await getProductFromSupplier(ean);

        if (!supplierProduct) {
            console.log(`  ⚠️ [${ean}] Produto não encontrado na API do fornecedor`.yellow);
            return { status: 'skipped' };
        }
        if (!supplierProduct.name || !supplierProduct.ean) {
            console.log(`  ⚠️ [${ean}] Produto com dados insuficientes (sem nome ou EAN)`.yellow);
            return { status: 'skipped' };
        }
        console.log(`  ✅ [${ean}] Produto encontrado:`, supplierProduct.name);

        // 2. Verificar se produto já existe na Shopify
        console.log(`  🔍 [${ean}] Verificando existência na Shopify...`.cyan);
        const existingProduct = await checkIfProductExists(shopifyClient, ean);
        if (existingProduct) {
            console.log(`  ⚠️ [${ean}] Produto já existe na Shopify, pulando...`.yellow);
            return { status: 'skipped' };
        }

        // 3. Processar dados do produto
        console.log(`  ⚙️ [${ean}] Processando dados...`.cyan);
        const { costPrice, retailPrice } = processProductPrices(supplierProduct);
        const stockQuantity = processStock(supplierProduct.stock);
        const normalizedProduct = {
            name: supplierProduct.name || supplierProduct.title || `Produto ${ean}`,
            ean: ean,
            price: retailPrice,
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

        // 4. Criar produto na Shopify
        console.log(`  🛍️ [${ean}] Criando produto na Shopify...`.green);
        await createProductToShopify(shopifyClient, normalizedProduct);
        console.log(`  ✅ [${ean}] Produto criado com sucesso!`.green);
        return { status: 'success' };

    } catch (productError) {
        console.log(`  ❌ [${ean}] Erro ao processar: ${productError.message}`.red);
        console.error('     Stack:', productError.stack);
        return { status: 'error' };
    }
}

// FUNÇÃO PRINCIPAL REESCRITA PARA USAR PROCESSAMENTO PARALELO
async function getAllProductsFromShopify(shopifyClient) {
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
            EANProductsList = JSON.parse(productsListContent);
        } else {
            EANProductsList = productsListContent
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(line => line.length > 0 && /^[0-9]+$/.test(line));
        }
        
        console.log(`📊 Total de EANs para processar: ${EANProductsList.length}`.cyan);

        // NOVO: Configurar o limite de concorrência
        const limit = pLimit(5);

        // NOVO: Mapear cada EAN para uma tarefa de processamento controlada pelo p-limit
        const tasks = EANProductsList.map((ean, index) => {
            return limit(() => processSingleEan(ean, index, EANProductsList.length, shopifyClient));
        });

        // NOVO: Executar todas as tarefas em paralelo e esperar pela sua conclusão
        const results = await Promise.all(tasks);

        // NOVO: Calcular as estatísticas a partir dos resultados
        const stats = {
            processed: EANProductsList.length,
            success: results.filter(r => r.status === 'success').length,
            errors: results.filter(r => r.status === 'error').length,
            skipped: results.filter(r => r.status === 'skipped').length
        };

        console.log('\n🏁 Processamento concluído!'.green.bold);
        return stats;

    } catch (error) {
        console.log(`❌ Erro fatal em getAllProductsFromShopify: ${error.message}`.red.bold);
        throw error;
    }
}

// Função auxiliar para verificar se produto já existe (sem alterações)
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
        const variables = { query: `sku:${ean}` };
        const response = await shopifyClient.request(query, variables);
        if (response && response.data && response.data.products && response.data.products.edges.length > 0) {
            const product = response.data.products.edges[0].node;
            console.log('     Produto existente encontrado:', product.title);
            return product;
        }
        return null;
    } catch (error) {
        console.log('     Erro ao verificar produto existente:', error.message);
        return null;
    }
}

module.exports = getAllProductsFromShopify;

// FIM DO FICHEIRO - VERIFIQUE SE ESTA LINHA EXISTE
