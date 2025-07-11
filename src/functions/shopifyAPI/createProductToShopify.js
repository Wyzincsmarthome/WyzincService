require('colors');

// FUNÇÕES AUXILIARES COMPLETAS (Para garantir que não falta nada)
function processProductPrices(product) {
    let costPrice = 0;
    let retailPrice = 0;
    if (product && product.price) {
        const priceStr = String(product.price);
        const cleanPrice = priceStr.replace(/[^0-9.,]/g, '').replace(',', '.');
        costPrice = parseFloat(cleanPrice) || 0;
    }
    if (product && product.pvpr) {
        const pvprStr = String(product.pvpr);
        const cleanPvpr = pvprStr.replace(/[^0-9.,]/g, '').replace(',', '.');
        retailPrice = parseFloat(cleanPvpr) || costPrice;
    } else {
        retailPrice = costPrice;
    }
    if (costPrice <= 0) costPrice = 1;
    if (retailPrice <= 0) retailPrice = costPrice;
    return { costPrice, retailPrice };
}

// FUNÇÃO PRINCIPAL FINAL E CORRIGIDA
async function createProductToShopify(shopifyClient, product) {
    try {
        console.log(`🚀 Iniciando criação do produto: ${product.name}`);

        // Processar os preços primeiro para garantir que temos valores válidos
        const { retailPrice } = processProductPrices(product);

        // A mutação mais simples possível que a Shopify aceita
        const productCreateMutation = `
            mutation productCreate($input: ProductInput!) {
                productCreate(input: $input) {
                    product {
                        id
                        title
                        variants(first: 1) {
                            edges {
                                node {
                                    id
                                    price
                                    sku
                                }
                            }
                        }
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        // Construir o input MAIS BÁSICO possível
        const variables = {
            input: {
                title: product.name,
                variants: [{
                    price: retailPrice.toString(),
                    sku: product.ean
                }]
            }
        };

        console.log(`📤 Enviando pedido MÍNIMO para Shopify para o produto: ${product.name}`.cyan);
        const response = await shopifyClient.request(productCreateMutation, variables);

        // Lógica de deteção de erros
        if (response.errors) {
            const errorMessages = response.errors.graphQLErrors.map(e => e.message).join('; ');
            throw new Error(`Erro de validação do GraphQL: ${errorMessages}`);
        }
        if (response.data?.productCreate?.userErrors?.length > 0) {
            const errors = response.data.productCreate.userErrors.map(e => `${e.field}: ${e.message}`).join(', ');
            throw new Error(`Erros da API Shopify: ${errors}`);
        }
        if (!response.data?.productCreate?.product) {
            console.error('RESPOSTA INESPERADA DA SHOPIFY:', JSON.stringify(response, null, 2));
            throw new Error('A API da Shopify não retornou um produto criado.');
        }

        const createdProduct = response.data.productCreate.product;
        console.log(`✅ PRODUTO BÁSICO CRIADO COM SUCESSO!`.green.bold);
        console.log(`   • ID: ${createdProduct.id}`);
        console.log(`   • Título: ${createdProduct.title}`);

        // Se chegámos aqui, o produto foi criado.
        // As outras informações (stock, imagens, etc.) podem ser adicionadas depois.

    } catch (error) {
        console.error(`❌ Erro fatal ao criar o produto ${product.name}: ${error.message}`.red);
        throw error;
    }
}

module.exports = createProductToShopify;
