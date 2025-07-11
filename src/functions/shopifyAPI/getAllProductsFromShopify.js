require('colors');
const fs = require('fs');
const { getProductFromSupplier } = require('../supplierAPI/getProductFromSupplier.js');
const createProductToShopify = require('./createProductToShopify');

// As suas funções auxiliares (generateProductTags, etc.) permanecem aqui...
// Cole aqui as suas funções generateProductTags, processProductPrices, e processStock
function generateProductTags(product) { /* ... o seu código aqui ... */ }
function processProductPrices(product) { /* ... o seu código aqui ... */ }
function processStock(stockString) { /* ... o seu código aqui ... */ }


// A única alteração está nesta função
async function processSingleEan(ean, shopifyClient) {
    try {
        const supplierProduct = await getProductFromSupplier(ean);

        if (!supplierProduct || !supplierProduct.name || !supplierProduct.ean) {
            if (!supplierProduct) console.log(`  ⚠️ [${ean}] Resposta da API do fornecedor foi nula ou vazia.`.yellow);
            else console.log(`  ⚠️ [${ean}] Produto com dados insuficientes (sem nome ou EAN)`.yellow);
            return { status: 'skipped' };
        }

        const existingProduct = await checkIfProductExists(shopifyClient, ean);
        if (existingProduct) {
            console.log(`  ⚠️ [${ean}] Produto já existe na Shopify, pulando...`.yellow);
            return { status: 'skipped' };
        }

        // =================================================================
        //  NOVA LINHA DE DIAGNÓSTICO: VAMOS VER O QUE A API DEVOLVEU
        // =================================================================
        console.log(`  🔎 [${ean}] DADOS RECEBIDOS DA API:`, JSON.stringify(supplierProduct, null, 2));
        // =================================================================

        const { costPrice, retailPrice } = processProductPrices(supplierProduct);
        const stockQuantity = processStock(supplierProduct.stock);

        const normalizedProduct = {
            name: supplierProduct.name || `Produto ${ean}`,
            ean: ean,
            price: retailPrice,
            cost_price: costPrice,
            // ... resto dos seus campos
        };
        
        await createProductToShopify(shopifyClient, normalizedProduct);
        return { status: 'success' };

    } catch (productError) {
        console.log(`  ❌ [${ean}] Erro ao processar: ${productError.message}`.red);
        // Adicionar o stack trace para mais detalhes
        console.error(productError.stack); 
        return { status: 'error' };
    }
}


// O resto do seu ficheiro (a função getAllProductsFromShopify, etc.) permanece igual
// Cole aqui o resto do seu ficheiro a partir da função getAllProductsFromShopify
async function getAllProductsFromShopify(shopifyClient) { /* ... o seu código aqui ... */ }
async function checkIfProductExists(shopifyClient, ean) { /* ... o seu código aqui ... */ }
module.exports = getAllProductsFromShopify;
