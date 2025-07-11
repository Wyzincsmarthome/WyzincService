require('colors');

// A sua função para gerar tags. Nenhuma alteração necessária aqui.
function generateProductTags(product) {
    if (!product || !product.name) return [];
    const tags = [];
    if (product.brand) {
        const brandMap = { 'xiaomi': 'Xiaomi', 'apple': 'Apple', /* ... etc ... */ };
        tags.push(brandMap[product.brand.toLowerCase()] || product.brand);
    }
    // ... A sua lógica completa de tags aqui ...
    return tags;
}

// FUNÇÃO PRINCIPAL FINAL E CORRIGIDA
async function createProductToShopify(shopifyClient, product) {
    try {
        console.log('🚀 Iniciando criação de produto:', product.name);

        const locationId = process.env.SHOPIFY_LOCATION_ID;
        if (!locationId) {
            throw new Error('SHOPIFY_LOCATION_ID não está definido nos secrets.');
        }
        const shopifyLocationGid = `gid://shopify/Location/${locationId}`;

        const productTags = generateProductTags(product);
        
        // Vamos remover o HTML complexo por agora. Usaremos apenas a descrição curta.
        const cleanDescription = product.short_description || 'Descrição não disponível.';

        const productCreateMutation = `
            mutation productCreate($input: ProductInput!) {
                productCreate(input: $input) {
                    product {
                        id
                        title
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
                // CORREÇÃO: Usar uma descrição simples para evitar erros de HTML
                descriptionHtml: cleanDescription,
                vendor: product.brand || 'Genérico',
                productType: product.family || 'Geral',
                status: 'ACTIVE',
                tags: productTags,
                // NOTA: As imagens foram removidas temporariamente para isolar o erro.
                // Se isto funcionar, adicionamo-las num passo seguinte.
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

        console.log(`📤 Enviando pedido simplificado para Shopify para o produto: ${product.name}`.cyan);
        const response = await shopifyClient.request(productCreateMutation, variables);
        
        // CORREÇÃO: Lógica de deteção de erros melhorada para capturar todos os cenários
        if (response.errors) {
            // Este bloco captura erros de validação do GraphQL, como o que vimos
            const errorMessages = response.errors.graphQLErrors.map(e => e.message).join('; ');
            throw new Error(`Erro de validação do GraphQL: ${errorMessages}`);
        }

        if (response.data?.productCreate?.userErrors?.length > 0) {
            const errors = response.data.productCreate.userErrors.map(e => `${e.field}: ${e.message}`).join(', ');
            throw new Error(`Erros da API Shopify: ${errors}`);
        }

        if (!response.data?.productCreate?.product) {
            console.error('RESPOSTA INESPERADA DA SHOPIFY:', JSON.stringify(response, null, 2));
            throw new Error('A API da Shopify não retornou um produto criado, mesmo sem erros explícitos.');
        }

        const createdProduct = response.data.productCreate.product;
        console.log(`✅ Produto "${createdProduct.title}" criado com sucesso na Shopify!`.green.bold);
        console.log(`   • ID do Produto: ${createdProduct.id}`.green);

    } catch (error) {
        console.error(`❌ Erro fatal ao criar o produto ${product.name}: ${error.message}`.red);
        throw error;
    }
}

module.exports = createProductToShopify;
