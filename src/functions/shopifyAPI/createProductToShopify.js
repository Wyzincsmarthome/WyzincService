require('colors');
const axios = require('axios');

// Funções auxiliares para processar os dados recebidos
function processProductPrices(product) {
    if (!product) return { retailPrice: 0, costPrice: 0 };
    let retailPrice = parseFloat(String(product.pvpr || product.price || '0').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
    let costPrice = parseFloat(String(product.price || '0').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
    return { retailPrice, costPrice };
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

// A função createProductToShopify final, com a lógica correta de 3 passos
async function createProductToShopify(shopifyClient, product, tags) {
    const storeUrl = process.env.SHOPIFY_STORE_URL;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    const locationId = process.env.SHOPIFY_LOCATION_ID;
    const apiVersion = '2025-07';
    const endpoint = `https://${storeUrl}/admin/api/${apiVersion}/graphql.json`;
    const headers = { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken };

    try {
        console.log(`🚀 Iniciando criação do produto: ${product.name}`);

        // --- PASSO 1: Criar o produto com o mínimo para obter os IDs ---
        const createMutation = `
            mutation productCreate($input: ProductInput!) {
                productCreate(input: $input) {
                    product { id, variants(first: 1) { edges { node { id } } } }
                    userErrors { field, message }
                }
            }`;
        const createInput = { input: { title: product.name } };
        const createResponse = await axios.post(endpoint, { query: createMutation, variables: createInput }, { headers });

        if (createResponse.data.errors) throw new Error(`Erro GraphQL no Passo 1: ${createResponse.data.errors[0].message}`);
        if (createResponse.data.data.productCreate.userErrors.length > 0) throw new Error(`Erro da API no Passo 1: ${createResponse.data.data.productCreate.userErrors[0].message}`);
        
        const createdProduct = createResponse.data.data.productCreate.product;
        if (!createdProduct?.id || !createdProduct.variants.edges[0]?.node?.id) throw new Error('Falha ao obter IDs do produto/variante no Passo 1.');
        
        const productId = createdProduct.id;
        const variantId = createdProduct.variants.edges[0].node.id;
        console.log(`✅ Produto base criado com ID: ${productId}`.green);

        // --- PASSO 2: ATUALIZAR o produto com todos os restantes detalhes ---
        const { retailPrice, costPrice } = processProductPrices(product);
        const stockQuantity = processStock(product.stock);

        const productUpdateMutation = `
            mutation productUpdate($input: ProductInput!) {
                productUpdate(input: $input) {
                    product { id, title }
                    userErrors { field, message }
                }
            }`;
        
        const updateInput = {
            input: {
                id: productId,
                descriptionHtml: product.description || '',
                vendor: product.brand || 'Genérico',
                productType: product.family || 'Geral',
                tags: tags,
                images: (product.images || []).map(img => ({ src: img })),
                variants: [{
                    id: variantId,
                    price: retailPrice.toString(),
                    sku: product.ean,
                    inventoryItem: { cost: costPrice.toString(), tracked: true },
                    inventoryQuantities: [{ availableQuantity: stockQuantity, locationId: `gid://shopify/Location/${locationId}` }]
                }]
            }
        };

        console.log(`📤 Passo 2: Atualizando produto ${productId} com todos os detalhes...`);
        const updateResponse = await axios.post(endpoint, { query: productUpdateMutation, variables: updateInput }, { headers });
        
        if (updateResponse.data.errors) throw new Error(`Erro GraphQL no Passo 2: ${updateResponse.data.errors[0].message}`);
        if (updateResponse.data.data.productUpdate.userErrors.length > 0) throw new Error(`Erro API no Passo 2: ${updateResponse.data.data.productUpdate.userErrors[0].message}`);
        
        console.log(`🎉 PRODUTO COMPLETO "${product.name}" CRIADO E ATUALIZADO COM SUCESSO!`.green.bold);

    } catch (error) {
        if (error.response) { console.error('❌ Erro na resposta da API (Axios):', JSON.stringify(error.response.data, null, 2)); } 
        else { console.error(`❌ Erro fatal ao criar o produto ${product.name}: ${error.message}`.red); }
        throw error;
    }
}

module.exports = createProductToShopify;
