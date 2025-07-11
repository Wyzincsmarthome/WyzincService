require('colors');

// A sua função para gerar tags. Nenhuma alteração necessária aqui.
function generateProductTags(product) {
    const tags = [];
    if (!product) { return []; }
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
    if (productName.includes('aspirador robô') || productName.includes('robot vacuum')) { categoryTag = 'Aspirador Robô'; } else if (productName.includes('aspirador vertical')) { categoryTag = 'Aspirador Vertical'; } else if (productName.includes('mini aspirador')) { categoryTag = 'Mini Aspirador'; } else if (productName.includes('câmara') || productName.includes('camera') || productName.includes('webcam')) { categoryTag = 'Câmaras'; } else if (productName.includes('sensor')) { categoryTag = 'Sensores Inteligentes'; } else if (productName.includes('fechadura') || productName.includes('lock')) { categoryTag = 'Fechaduras Inteligentes'; } else if (productName.includes('tomada') || productName.includes('socket') || productName.includes('plug')) { categoryTag = 'Tomadas'; } else if (productName.includes('controlo remoto') || productName.includes('comando') || productName.includes('remote')) { categoryTag = 'Controlo Remoto'; } else if (productName.includes('iluminação') || productName.includes('luz') || productName.includes('lamp') || productName.includes('light')) { categoryTag = 'Iluminação'; } else if (productName.includes('cortina') || productName.includes('curtain')) { categoryTag = 'Motor Cortinas'; } else if (productName.includes('campainha') || productName.includes('doorbell')) { categoryTag = 'Campainha Inteligente'; } else if (productName.includes('interruptor') || productName.includes('switch')) { categoryTag = 'Interruptor Inteligente'; } else if (productName.includes('hub') || productName.includes('gateway')) { categoryTag = 'Hubs Inteligentes'; } else if (productName.includes('assistente') || productName.includes('alexa') || productName.includes('google')) { categoryTag = 'Assistentes Virtuais'; } else if (productName.includes('painel')) { categoryTag = 'Painel Controlo'; } else if (productName.includes('acessório') && productName.includes('aspirador')) { categoryTag = 'Acessórios Aspiradores'; } else if (productName.includes('inteligente') || productName.includes('smart')) { categoryTag = 'Gadgets Inteligentes'; } else { if (product.brand && product.brand.toLowerCase() === 'petkit') { categoryTag = 'Gadgets P/ Animais'; } else { categoryTag = 'Gadgets Diversos'; } }
    if (categoryTag) tags.push(categoryTag);
    return tags;
}


// FUNÇÃO PRINCIPAL REESCRITA PARA MÁXIMA EFICIÊNCIA
async function createProductToShopify(shopifyClient, product) {
    try {
        console.log('🚀 Iniciando criação de produto:', product.name);

        // Validar inputs essenciais
        if (!product || !product.name || !product.ean) {
            throw new Error('Dados do produto inválidos (nome ou EAN em falta)');
        }
        if (!shopifyClient || typeof shopifyClient.request !== 'function') {
            throw new Error('Cliente Shopify inválido');
        }

        const locationId = process.env.SHOPIFY_LOCATION_ID;
        if (!locationId) {
            throw new Error('SHOPIFY_LOCATION_ID não está definido nos secrets do repositório.');
        }

        // Construir o GID (Global ID) da localização
        const shopifyLocationGid = `gid://shopify/Location/${locationId}`;

        // Gerar tags e processar imagens
        const productTags = generateProductTags(product);
        const imageList = (product.images || []).map(img => ({ src: img }));

        // Definir a mutação GraphQL que cria TUDO de uma só vez
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

        // Construir o objeto de input completo para a mutação
        const variables = {
            input: {
                title: product.name,
                descriptionHtml: (product.short_description || '') + "<br><br>" + (product.description || ''),
                vendor: product.brand || 'Genérico',
                productType: product.family || 'Geral',
                status: 'ACTIVE',
                tags: productTags,
                images: imageList, // Adicionar imagens diretamente na criação
                variants: [ // Adicionar a variante principal com preço, SKU e stock
                    {
                        price: product.price.toString(),
                        sku: product.ean,
                        inventoryItem: {
                            cost: product.cost_price ? product.cost_price.toString() : null,
                            tracked: true,
                        },
                        inventoryQuantities: [
                            {
                                availableQuantity: product.stock_quantity,
                                locationId: shopifyLocationGid,
                            },
                        ],
                    },
                ],
            },
        };

        console.log(`📤 Enviando pedido completo para Shopify para o produto: ${product.name}`.cyan);
        const response = await shopifyClient.request(productCreateMutation, variables);

        // Validar a resposta
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
        console.log(`   • Título: ${createdProduct.title}`);

    } catch (error) {
        console.error(`❌ Erro fatal ao criar o produto ${product.name}: ${error.message}`.red);
        // Lançar o erro para que o catch superior o possa registar nas estatísticas
        throw error;
    }
}

module.exports = createProductToShopify;
