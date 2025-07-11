require('colors');
const axios = require('axios'); // Usaremos axios diretamente

// A sua função de processamento de preços
function processProductPrices(product) {
    let costPrice = 0;
    let retailPrice = 0;
    if (product && product.price) {
        const priceStr = String(product.price);
        const cleanPrice = priceStr.replace(/[^0-9.,]/g, '').replace(',', '.');
        retailPrice = parseFloat(cleanPrice) || 0;
    }
    // Assegura que retailPrice tem um valor, usando pvpr ou costPrice como fallback
    if (retailPrice === 0 && product && product.pvpr) {
        const pvprStr = String(product.pvpr);
        const cleanPvpr = pvprStr.replace(/[^0-9.,]/g, '').replace(',', '.');
        retailPrice = parseFloat(cleanPvpr) || 0;
    }
    if (retailPrice === 0) {
        retailPrice = costPrice;
    }
    return { costPrice: 0, retailPrice }; // Simplificado para garantir que retorna sempre algo
}


// FUNÇÃO PRINCIPAL FINALÍSSIMA
async function createProductToShopify(shopifyClient, product) { // shopifyClient não será usado, mas mantemos para consistência
    try {
        console.log(`🚀 Iniciando criação do produto: ${product.name}`);

        const { retailPrice } = processProductPrices(product);

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
                variants: [{
                    price: retailPrice.toString(),
                    sku: product.ean
                }]
            }
        };

        const storeUrl = process.env.SHOPIFY_STORE_URL;
        const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
        const apiVersion = '2025-07'; // A versão que já tínhamos corrigido

        const endpoint = `https://${storeUrl}/admin/api/${apiVersion}/graphql.json`;

        console.log(`📤 Enviando pedido direto com AXIOS para: ${endpoint}`.cyan);
        
        const response = await axios.post(endpoint, {
            query: productCreateMutation,
            variables: variables
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken
            }
        });

        // A estrutura da resposta do axios é diferente, os dados estão em response.data
        const responseData = response.data;

        if (responseData.errors) {
            const errorMessages = responseData.errors.map(e => e.message).join('; ');
            throw new Error(`Erro de validação do GraphQL: ${errorMessages}`);
        }
        if (responseData.data?.productCreate?.userErrors?.length > 0) {
            const errors = responseData.data.productCreate.userErrors.map(e => `${e.field}: ${e.message}`).join(', ');
            throw new Error(`Erros da API Shopify: ${errors}`);
        }
        if (!responseData.data?.productCreate?.product) {
            console.error('RESPOSTA INESPERADA DA SHOPIFY:', JSON.stringify(responseData, null, 2));
            throw new Error('A API da Shopify não retornou um produto criado.');
        }

        const createdProduct = responseData.data.productCreate.product;
        console.log(`✅ PRODUTO CRIADO COM SUCESSO!`.green.bold);
        console.log(`   • ID: ${createdProduct.id}`);
        console.log(`   • Título: ${createdProduct.title}`);

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
