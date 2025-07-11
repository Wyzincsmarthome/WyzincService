require('colors');
const fs = require('fs');
const { getProductFromSupplier } = require('../supplierAPI/getProductFromSupplier.js');
const createProductToShopify = require('./createProductToShopify');

// Função para verificar se o produto já existe (reintroduzida)
async function checkIfProductExists(shopifyClient, ean) {
    try {
        const query = `query getProductsBySku($query: String!) { products(first: 1, query: $query) { edges { node { id } } } }`;
        const variables = { query: `sku:${ean}` };
        const response = await shopifyClient.request(query, variables);
        return response?.data?.products?.edges?.length > 0;
    } catch (error) {
        console.log('      ⚠️ Erro ao verificar se produto existe:', error.message);
        return false; // Assumir que não existe em caso de erro, para tentar criar
    }
}

// Função para gerar tags
function generateProductTags(product) {
    const tags = [];
    if (!product || !product.name) return [];
    if (product.brand) {
        const brandMap = { 'xiaomi': 'Xiaomi', 'apple': 'Apple', 'baseus': 'Baseus', 'torras': 'Torras', 'hutt': 'Hutt', 'petkit': 'Petkit', 'kingston': 'Kingston' };
        let brandTag = brandMap[product.brand.toLowerCase()] || product.brand;
        if (product.brand.toLowerCase() === 'xiaomi' && product.name.toLowerCase().includes('yeelight')) {
            brandTag = 'Yeelight';
        }
        tags.push(brandTag);
    }
    // ... adicione a sua lógica completa de tags de categoria aqui ...
    return tags;
}

// Lógica para processar um único EAN
async function processSingleEan(ean, shopifyClient) {
    try {
        // VERIFICAR SE JÁ EXISTE PRIMEIRO
        if (await checkIfProductExists(shopifyClient, ean)) {
            console.log(`  🟡 [${ean}] Produto já existe na Shopify. Pulando...`.yellow);
            return { status: 'skipped_exists' };
        }

        const supplierProduct = await getProductFromSupplier(ean);
        if (!supplierProduct) {
            console.log(`  ⚠️ [${ean}] Produto não encontrado no fornecedor. Pulando...`.yellow);
            return { status: 'skipped_not_found' };
        }
        
        const tags = generateProductTags(supplierProduct);
        await createProductToShopify(shopifyClient, supplierProduct, tags);
        
        return { status: 'success' };
    } catch (productError) {
        console.log(`  ❌ [${ean}] Erro ao processar: ${productError.message}`.red);
        return { status: 'error' };
    }
}

// Função principal com a lógica de concorrência
async function getAllProductsFromShopify(shopifyClient) {
    try {
        console.log('🚀 Iniciando processamento de produtos...'.green);
        const EANProductsList = fs.readFileSync('src/productsList.txt', 'utf8')
            .split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        
        console.log(`📊 Total de EANs para processar: ${EANProductsList.length}`.cyan);

        const concurrencyLimit = 5;
        const results = [];
        const queue = [...EANProductsList];

        async function worker() {
            while (queue.length > 0) {
                const ean = queue.shift();
                if (ean) {
                    console.log(`\n📦 Processando EAN: ${ean}`.magenta);
                    const result = await processSingleEan(ean, shopifyClient);
                    results.push(result);
                }
            }
        }

        const workers = Array(concurrencyLimit).fill(worker());
        await Promise.all(workers);

        const stats = {
            processed: EANProductsList.length,
            success: results.filter(r => r.status === 'success').length,
            errors: results.filter(r => r.status === 'error').length,
            skipped_exists: results.filter(r => r.status === 'skipped_exists').length,
            skipped_not_found: results.filter(r => r.status === 'skipped_not_found').length
        };

        console.log('\n🏁 Processamento concluído!'.green.bold);
        return stats;
    } catch (error) {
        console.log(`❌ Erro fatal em getAllProductsFromShopify: ${error.message}`.red.bold);
        throw error;
    }
}

module.exports = getAllProductsFromShopify;
