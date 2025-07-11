require('colors');
const axios = require('axios');

// Funções auxiliares para processar os dados recebidos
function processProductPrices(product) {
    if (!product) return { retailPrice: 0 };
    let price = String(product.price || product.pvpr || '0').replace(/[^0-9.,]/g, '').replace(',', '.');
    return { retailPrice: parseFloat(price) || 0 };
}
function processStock(stockString) {
    if (!stockString) return 0;
    const stockLower = stockString.toLowerCase();
    if (stockLower.includes('sem stock') || stockLower.includes('indisponivel') || stockLower.includes('esgotado') || stockLower.includes('ruptura')) return 0;
    if (stockLower.includes('< 10')) return 9;
    if (stockLower.includes('< 2')) return 1;
    if (stockLower.includes('brevemente')) return 0;
    return 5;
}

// FUNÇÃO PRINCIPAL FINALÍSSIMA, AGORA EM 2 PASSOS
async function createProductToShopify(shopifyClient, product) {
    const storeUrl = process.env.SHOPIFY_STORE_URL;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    const locationId = process.env.SHOPIFY_LOCATION_ID;
    const apiVersion = '2025-07';
    const endpoint = `https://${storeUrl}/admin/api/${apiVersion}/graphql.json`;
    const headers = { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken };

    try {
        console.log(`🚀 Iniciando criação do produto em 2 passos: ${product.name}`);

        // --- PASSO 1: CRIAR O PRODUTO BÁSICO ---
        const productCreateMutation = `
            mutation productCreate($input: ProductInput!) {
                productCreate(input: $input) {
                    product { id, title }
                    userErrors { field, message }
                }
            }`;
        
        const productInput = {
            input: {
                title: product.name,
                vendor: product.brand || 'Genérico',
                productType: product.family || 'Geral',
                descriptionHtml: product.description || '',
                status: 'ACTIVE'
            }
        };

        console.log(`📤 Passo 1: Enviando dados básicos do produto...`);
        const productResponse = await axios.post(endpoint, { query: productCreateMutation, variables: productInput }, { headers });

        if (productResponse.data.errors) throw new Error(`Erro GraphQL no Passo 1: ${productResponse.data.errors[0].message}`);
        if (productResponse.data.data.productCreate.userErrors.length > 0) throw new Error(`Erro da API no Passo 1: ${productResponse.data.data.productCreate.userErrors[0].message}`);
        
        const createdProduct = productResponse.data.data.productCreate.product;
        if (!createdProduct || !createdProduct.id) throw new Error('Falha ao obter ID do produto criado no Passo 1.');
        
        console.log(`✅ Produto básico criado com ID: ${createdProduct.id}`.green);

        // --- PASSO 2: ADICIONAR A VARIANTE COM PREÇO, SKU E STOCK ---
        const { retailPrice } = processProductPrices(product);
        const stockQuantity = processStock(product.stock);

        // A mutação para adicionar uma variante a um produto existente
        const variantCreateMutation = `
            mutation productVariantCreate($input: ProductVariantInput!) {
                productVariantCreate(input: $input) {
                    productVariant { id, sku, price }
                    userErrors { field, message }
                }
            }`;

        const variantInput = {
            input: {
                productId: createdProduct.id,
                price: retailPrice.toString(),
                sku: product.ean,
                options: ["Default Title"], // Opção Padrão
                inventoryItem: { tracked: true, cost: { amount: "0.0", currencyCode: "EUR" } }, // Custo pode ser adicionado depois
                inventoryQuantities: [{
                    availableQuantity: stockQuantity,
                    locationId: `gid://shopify/Location/${locationId}`
                }]
            }
        };

        console.log(`📤 Passo 2: Adicionando variante ao produto ${createdProduct.id}...`);
        const variantResponse = await axios.post(endpoint, { query: variantCreateMutation, variables: variantInput }, { headers });
        
        if (variantResponse.data.errors) throw new Error(`Erro GraphQL no Passo 2: ${variantResponse.data.errors[0].message}`);
        if (variantResponse.data.data.productVariantCreate.userErrors.length > 0) throw new Error(`Erro da API no Passo 2: ${variantResponse.data.data.productVariantCreate.userErrors[0].message}`);
        
        const createdVariant = variantResponse.data.data.productVariantCreate.productVariant;
        if (!createdVariant) throw new Error('Falha ao criar a variante do produto no Passo 2.');

        console.log(`✅ Variante criada com SKU: ${createdVariant.sku} e Preço: ${createdVariant.price}`.green);
        console.log(`🎉 PROCESSO CONCLUÍDO COM SUCESSO PARA: ${createdProduct.title}`.green.bold);

    } catch (error) {
        if (error.response) { // Erros específicos do axios
            console.error('❌ Erro na resposta da API (Axios):', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(`❌ Erro fatal ao criar o produto ${product.name}: ${error.message}`.red);
        }
        throw error;
    }
}

module.exports = createProductToShopify;
