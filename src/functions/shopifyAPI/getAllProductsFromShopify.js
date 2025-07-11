require('colors');
const fs = require('fs');
const { getProductFromSupplier } = require('../supplierAPI/getProductFromSupplier.js'); // CAMINHO CORRIGIDO
const createProductToShopify = require('./createProductToShopify');

// ... (as suas funções auxiliares generateProductTags, processProductPrices, etc. permanecem aqui inalteradas)
function generateProductTags(product) { /* ... o seu código aqui ... */ }
function processProductPrices(product) { /* ... o seu código aqui ... */ }
function processStock(stockString) { /* ... o seu código aqui ... */ }
// ...

async function processSingleEan(ean, shopifyClient) {
    // Esta função agora só contém a lógica para um produto
    try {
        const supplierProduct = await getProductFromSupplier(ean);
        if (!supplierProduct || !supplierProduct.name || !supplierProduct.ean) return { status: 'skipped' };
        
        const existingProduct = await checkIfProductExists(shopifyClient, ean);
        if (existingProduct) return { status: 'skipped' };
        
        const { costPrice, retailPrice } = processProductPrices(supplierProduct);
        const stockQuantity = processStock(supplierProduct.stock);
        const normalizedProduct = {
            name: supplierProduct.name || `Produto ${ean}`,
            ean: ean,
            price: retailPrice,
            pvpr: retailPrice,
            cost_price: costPrice,
            brand: supplierProduct.brand || '',
            family: supplierProduct.family || '',
            description: supplierProduct.description || '',
            short_description: supplierProduct.short_description || '',
            stock_quantity: stockQuantity,
            images: supplierProduct.images || []
        };
        
        await createProductToShopify(shopifyClient, normalizedProduct);
        return { status: 'success' };
    } catch (productError) {
        console.log(`  ❌ [${ean}] Erro ao processar: ${productError.message}`.red);
        return { status: 'error' };
    }
}

async function getAllProductsFromShopify(shopifyClient) {
    try {
        console.log('🚀 Iniciando processamento de produtos...'.green);
        const productsListPath = 'src/productsList.txt';
        if (!fs.existsSync(productsListPath)) throw new Error(`Ficheiro ${productsListPath} não encontrado`);
        const EANProductsList = fs.readFileSync(productsListPath, 'utf8')
            .split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0 && /^[0-9]+$/.test(line));
        
        console.log(`📊 Total de EANs para processar: ${EANProductsList.length}`.cyan);

        // LÓGICA DE CONCORRÊNCIA NATIVA (SEM P-LIMIT)
        const concurrencyLimit = 5;
        const results = [];
        const queue = [...EANProductsList];

        const runTask = async (ean) => {
            const result = await processSingleEan(ean, shopifyClient);
            results.push(result);
            if (queue.length > 0) {
                await runTask(queue.shift());
            }
        };

        const workers = [];
        for (let i = 0; i < concurrencyLimit; i++) {
            if (queue.length > 0) {
                workers.push(runTask(queue.shift()));
            }
        }
        
        await Promise.all(workers);

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

async function checkIfProductExists(shopifyClient, ean) { /* ... o seu código aqui ... */ }

module.exports = getAllProductsFromShopify;
