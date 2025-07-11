require('colors');

// A sua função para gerar tags. Nenhuma alteração necessária aqui.
function generateProductTags(product) { /* ... o seu código completo aqui ... */ }

// FUNÇÃO PRINCIPAL REESCRITA COM DIAGNÓSTICO ADICIONAL
async function createProductToShopify(shopifyClient, product) {
    try {
        console.log('🚀 Iniciando criação de produto:', product.name);

        const locationId = process.env.SHOPIFY_LOCATION_ID;
        if (!locationId) {
            throw new Error('SHOPIFY_LOCATION_ID não está definido nos secrets do repositório.');
        }
        const shopifyLocationGid = `gid://shopify/Location/${locationId}`;

        const productTags = generateProductTags(product);
        const imageList = (product.images || []).map(img => ({ src: img }));

        const productCreateMutation = `
            mutation productCreate($input: ProductInput!) {
                productCreate(input: $input) {
                    product {
                        id
                        title
                        handle
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const variables = {
            input: {
                title: product.name,
                descriptionHtml: (product.short_description || '') + "<br><br>" + (product.description || ''),
                vendor: product.brand || 'Genérico',
                productType: product.family || 'Geral',
                status: 'ACTIVE',
                tags: productTags,
                images: imageList,
                variants: [{
                    price: product.price.toString(),
                    sku: product.ean,
                    inventoryItem: {
                        cost: product.cost_price ? product.cost_price.toString() : null,
                        tracked: true,
                    },
                    inventoryQuantities: [{
                        availableQuantity: product.stock_quantity,
                        locationId: shopifyLocationGid,
                    }],
                }],
            },
        };

        console.log(`📤 Enviando pedido completo para Shopify para o produto: ${product.name}`.cyan);
        const response = await shopifyClient.request(productCreateMutation, variables);
        
        // =================================================================================
        //  DIAGNÓSTICO FINAL: VAMOS IMPRIMIR A RESPOSTA COMPLETA DA SHOPIFY
        // =================================================================================
        console.log('📄 RESPOSTA COMPLETA DA SHOPIFY:', JSON.stringify(response, null, 2));
        // =================================================================================

        if (response.data?.productCreate?.userErrors?.length > 0) {
            const errors = response.data.productCreate.userErrors.map(e => `${e.field}: ${e.message}`).join(', ');
            throw new Error(`Erros da API Shopify: ${errors}`);
        }

        if (!response.data?.productCreate?.product) {
            throw new Error('A API da Shopify não retornou um produto criado.');
        }

        const createdProduct = response.data.productCreate.product;
        console.log(`✅ Produto criado com sucesso na Shopify!`.green.bold);
        console.log(`   • ID: ${createdProduct.id}`);

    } catch (error) {
        console.error(`❌ Erro fatal ao criar o produto ${product.name}: ${error.message}`.red);
        throw error;
    }
}

module.exports = createProductToShopify;
