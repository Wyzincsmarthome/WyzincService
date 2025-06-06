require('colors');

// Função para gerar tags automáticas baseadas no produto
function generateProductTags(product) {
    const tags = [];
    
    // 1. TAG DE MARCA
    let brandTag = '';
    if (product.brand) {
        // Lógica especial para Yeelight
        if (product.brand.toLowerCase() === 'xiaomi' && product.name && product.name.toLowerCase().includes('yeelight')) {
            brandTag = 'Yeelight';
        } else {
            // Mapear marcas conhecidas
            const brandMap = {
                'xiaomi': 'Xiaomi',
                'baseus': 'Baseus',
                'torras': 'Torras',
                'apple': 'Apple',
                'hutt': 'Hutt',
                'petkit': 'Petkit',
                'kingston': 'Kingston'
            };
            brandTag = brandMap[product.brand.toLowerCase()] || product.brand;
        }
        if (brandTag) tags.push(brandTag);
    }
    
    // 2. TAG DE SUB-CATEGORIA (baseada no título)
    let categoryTag = '';
    const productName = (product.name || '').toLowerCase();
    
    // Verificar categorias específicas por ordem de prioridade
    if (productName.includes('aspirador robô') || productName.includes('robot vacuum')) {
        categoryTag = 'Aspirador Robô';
    } else if (productName.includes('aspirador vertical')) {
        categoryTag = 'Aspirador Vertical';
    } else if (productName.includes('mini aspirador')) {
        categoryTag = 'Mini Aspirador';
    } else if (productName.includes('câmara') || productName.includes('camera') || productName.includes('webcam')) {
        categoryTag = 'Câmaras';
    } else if (productName.includes('sensor')) {
        categoryTag = 'Sensores Inteligentes';
    } else if (productName.includes('fechadura') || productName.includes('lock')) {
        categoryTag = 'Fechaduras Inteligentes';
    } else if (productName.includes('tomada') || productName.includes('socket') || productName.includes('plug')) {
        categoryTag = 'Tomadas';
    } else if (productName.includes('controlo remoto') || productName.includes('comando') || productName.includes('remote')) {
        categoryTag = 'Controlo Remoto';
    } else if (productName.includes('iluminação') || productName.includes('luz') || productName.includes('lamp') || productName.includes('light')) {
        categoryTag = 'Iluminação';
    } else if (productName.includes('cortina') || productName.includes('curtain')) {
        categoryTag = 'Motor Cortinas';
    } else if (productName.includes('campainha') || productName.includes('doorbell')) {
        categoryTag = 'Campainha Inteligente';
    } else if (productName.includes('interruptor') || productName.includes('switch')) {
        categoryTag = 'Interruptor Inteligente';
    } else if (productName.includes('hub') || productName.includes('gateway')) {
        categoryTag = 'Hubs Inteligentes';
    } else if (productName.includes('assistente') || productName.includes('alexa') || productName.includes('google')) {
        categoryTag = 'Assistentes Virtuais';
    } else if (productName.includes('painel')) {
        categoryTag = 'Painel Controlo';
    } else if (productName.includes('acessório') && productName.includes('aspirador')) {
        categoryTag = 'Acessórios Aspiradores';
    } else if (productName.includes('inteligente') || productName.includes('smart')) {
        categoryTag = 'Gadgets Inteligentes';
    } else {
        // Fallback inteligente
        if (product.brand && product.brand.toLowerCase() === 'petkit') {
            categoryTag = 'Gadgets P/ Animais';
        } else {
            categoryTag = 'Gadgets Diversos';
        }
    }
    
    if (categoryTag) tags.push(categoryTag);
    
    console.log('🏷️ Tags geradas para', product.name, ':', tags);
    return tags;
}

async function createProductToShopify(shopifyClient, product) {
    try {
        console.log('🚀 Iniciando criação de produto:', product.name);
        console.log('📦 EAN:', product.ean);
        
        // Validar cliente Shopify
        if (!shopifyClient) {
            throw new Error('Cliente Shopify não fornecido');
        }
        
        if (typeof shopifyClient.request !== 'function') {
            throw new Error('Cliente Shopify inválido - método request não encontrado');
        }
        
        // Validar dados do produto
        if (!product.name || !product.ean) {
            throw new Error('Dados do produto incompletos - nome e EAN são obrigatórios');
        }
        
        // Gerar tags automáticas
        const productTags = generateProductTags(product);
        
        let tempStock = 0;
        
        // Mapeamento corrigido de stock
        console.log('📦 Processando stock:', product.stock);
        switch(product.stock) {
            case 'Disponível ( < 10 UN )':
            case 'Disponível ( < 10 Un )':
                tempStock = 9;
                console.log('✅ Stock mapeado: Disponível ( < 10 Un ) → 9 unidades');
                break;
            case 'Stock Reduzido ( < 2 UN )':
            case 'Stock Reduzido ( < 2 Un )':
                tempStock = 1;
                console.log('⚠️ Stock mapeado: Stock Reduzido < 2 Un → 1 unidade');
                break;
            case 'Disponível ( < 2 UN )':
            case 'Disponível ( < 2 Un )':
                tempStock = 1;
                console.log('⚠️ Stock mapeado: Disponível < 2 Un → 1 unidade');
                break;
            case 'Brevemente':
                tempStock = 0;
                console.log('❌ Stock mapeado: Brevemente → 0 unidades');
                break;
            case 'Esgotado':
                tempStock = 0;
                console.log('❌ Stock mapeado: Esgotado → 0 unidades');
                break;
            default:
                tempStock = 10;
                console.log('📦 Stock mapeado: Default (' + product.stock + ') → 10 unidades');
                break;
        }
        
        // Preparar array de imagens
        const imageList = product.images && Array.isArray(product.images) 
            ? product.images.map(img => ({ src: img })) 
            : [];
        console.log('🖼️ Imagens processadas:', imageList.length);
        
        // PASSO 1: Criar produto básico (SEM variants e images)
        console.log('📝 Passo 1: Criando produto básico...');
        
        const productMutation = `
            mutation productCreate($input: ProductInput!) {
                productCreate(input: $input) {
                    product {
                        id
                        title
                        handle
                        status
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;
        
        const productInput = {
            input: {
                title: product.name,
                descriptionHtml: (product.short_description || '') + "\\n\\n" + (product.description || ''),
                productType: product.family || '',
                status: "ACTIVE",
                tags: productTags,
                vendor: product.brand || ''
            }
        };
        
        console.log('📤 Criando produto básico...');
        console.log('   • Título:', productInput.input.title);
        console.log('   • Tipo:', productInput.input.productType);
        console.log('   • Tags:', productInput.input.tags);
        console.log('   • Vendor:', productInput.input.vendor);
        
        let productResponse;
        try {
            productResponse = await shopifyClient.request(productMutation, productInput);
            console.log('📄 Resposta do produto básico recebida');
            
        } catch (productError) {
            console.error('❌ Erro na criação do produto básico:', productError.message);
            if (productError.response) {
                console.error('📄 Detalhes:', JSON.stringify(productError.response, null, 2));
            }
            throw productError;
        }
        
        // Validar resposta do produto
        if (!productResponse || !productResponse.data) {
            console.error('❌ Resposta inválida do produto básico');
            console.error('📄 Resposta:', JSON.stringify(productResponse, null, 2));
            throw new Error('Falha na criação do produto básico - resposta inválida');
        }
        
        if (!productResponse.data.productCreate) {
            console.error('❌ productCreate não encontrado na resposta');
            console.error('📄 Data:', JSON.stringify(productResponse.data, null, 2));
            throw new Error('Falha na criação do produto básico - productCreate não encontrado');
        }
        
        // Verificar erros na criação do produto
        if (productResponse.data.productCreate.userErrors && productResponse.data.productCreate.userErrors.length > 0) {
            console.log('❌ Erros na criação do produto básico:'.red);
            productResponse.data.productCreate.userErrors.forEach(error => {
                console.log(`   • ${error.field}: ${error.message}`.red);
            });
            throw new Error(`Erros na criação do produto: ${productResponse.data.productCreate.userErrors.map(e => e.message).join(', ')}`);
        }
        
        if (!productResponse.data.productCreate.product) {
            console.error('❌ Produto não foi criado');
            console.error('📄 productCreate:', JSON.stringify(productResponse.data.productCreate, null, 2));
            throw new Error('Produto básico não foi criado');
        }
        
        const createdProduct = productResponse.data.productCreate.product;
        console.log('✅ Produto básico criado com sucesso!'.green);
        console.log('   • ID:', createdProduct.id);
        console.log('   • Handle:', createdProduct.handle);
        
        // PASSO 2: Adicionar variant
        console.log('📝 Passo 2: Adicionando variant...');
        
        const variantMutation = `
            mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
                productVariantsBulkCreate(productId: $productId, variants: $variants) {
                    productVariants {
                        id
                        price
                        sku
                        inventoryQuantity
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;
        
        const variantInput = {
            productId: createdProduct.id,
            variants: [
                {
                    price: (product.optFinalPrice || product.pvpr || 0).toString(),
                    sku: product.ean,
                    inventoryPolicy: "DENY",
                    inventoryManagement: "SHOPIFY",
                    inventoryQuantities: [
                        {
                            availableQuantity: tempStock,
                            locationId: "gid://shopify/Location/84623851786"
                        }
                    ]
                }
            ]
        };
        
        console.log('📤 Adicionando variant...');
        console.log('   • Preço:', variantInput.variants[0].price);
        console.log('   • SKU:', variantInput.variants[0].sku);
        console.log('   • Stock:', variantInput.variants[0].inventoryQuantities[0].availableQuantity);
        
        let variantResponse;
        try {
            variantResponse = await shopifyClient.request(variantMutation, variantInput);
            console.log('📄 Resposta da variant recebida');
            
        } catch (variantError) {
            console.error('❌ Erro na criação da variant:', variantError.message);
            if (variantError.response) {
                console.error('📄 Detalhes:', JSON.stringify(variantError.response, null, 2));
            }
            // Continuar mesmo com erro na variant
            console.log('⚠️ Continuando sem variant...');
        }
        
        // Validar resposta da variant
        if (variantResponse && variantResponse.data && variantResponse.data.productVariantsBulkCreate) {
            if (variantResponse.data.productVariantsBulkCreate.userErrors && variantResponse.data.productVariantsBulkCreate.userErrors.length > 0) {
                console.log('❌ Erros na criação da variant:'.yellow);
                variantResponse.data.productVariantsBulkCreate.userErrors.forEach(error => {
                    console.log(`   • ${error.field}: ${error.message}`.yellow);
                });
            } else if (variantResponse.data.productVariantsBulkCreate.productVariants && variantResponse.data.productVariantsBulkCreate.productVariants.length > 0) {
                console.log('✅ Variant criada com sucesso!'.green);
                console.log('   • ID:', variantResponse.data.productVariantsBulkCreate.productVariants[0].id);
                console.log('   • Preço:', variantResponse.data.productVariantsBulkCreate.productVariants[0].price);
            }
        }
        
        // PASSO 3: Adicionar imagens (se existirem)
        if (imageList.length > 0) {
            console.log('📝 Passo 3: Adicionando imagens...');
            
            const imageMutation = `
                mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
                    productCreateMedia(productId: $productId, media: $media) {
                        media {
                            id
                            alt
                            ... on MediaImage {
                                image {
                                    url
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
            
            const mediaInput = {
                productId: createdProduct.id,
                media: imageList.map((img, index) => ({
                    originalSource: img.src,
                    alt: `${product.name} - Imagem ${index + 1}`,
                    mediaContentType: "IMAGE"
                }))
            };
            
            console.log('📤 Adicionando', imageList.length, 'imagens...');
            
            try {
                const imageResponse = await shopifyClient.request(imageMutation, mediaInput);
                console.log('📄 Resposta das imagens recebida');
                
                if (imageResponse && imageResponse.data && imageResponse.data.productCreateMedia) {
                    if (imageResponse.data.productCreateMedia.userErrors && imageResponse.data.productCreateMedia.userErrors.length > 0) {
                        console.log('❌ Erros na criação das imagens:'.yellow);
                        imageResponse.data.productCreateMedia.userErrors.forEach(error => {
                            console.log(`   • ${error.field}: ${error.message}`.yellow);
                        });
                    } else if (imageResponse.data.productCreateMedia.media && imageResponse.data.productCreateMedia.media.length > 0) {
                        console.log('✅ Imagens adicionadas com sucesso!'.green);
                        console.log('   • Total:', imageResponse.data.productCreateMedia.media.length);
                    }
                }
                
            } catch (imageError) {
                console.error('❌ Erro na criação das imagens:', imageError.message);
                if (imageError.response) {
                    console.error('📄 Detalhes:', JSON.stringify(imageError.response, null, 2));
                }
                // Continuar mesmo com erro nas imagens
                console.log('⚠️ Continuando sem imagens...');
            }
        } else {
            console.log('📝 Passo 3: Sem imagens para adicionar');
        }
        
        console.log('✅ Produto com EAN ' + product.ean + ' foi criado com sucesso!'.green);
        console.log('   • ID:', createdProduct.id);
        console.log('   • Handle:', createdProduct.handle);
        console.log('   • Status:', createdProduct.status);
        
        return createdProduct;
        
    } catch (error) {
        console.log("=".repeat(50).yellow);
        console.log("ERRO (createProduct) [EAN: " + (product.ean || 'N/A') + " ]: " + error.message.yellow);
        console.log("=".repeat(50).yellow);
        
        // Logs adicionais para debugging
        if (error.stack) {
            console.log('📄 Stack trace:', error.stack);
        }
        
        // Sugestões baseadas no tipo de erro
        if (error.message.includes('Field is not defined')) {
            console.log('💡 Sugestão: Problema na estrutura GraphQL - campos não suportados');
        }
        
        if (error.message.includes('productCreate')) {
            console.log('💡 Sugestão: Verifique se a mutation GraphQL está correta');
        }
        
        if (error.message.includes('undefined')) {
            console.log('💡 Sugestão: Possível problema de estrutura de resposta ou permissões');
        }
        
        throw error;
    }
}

module.exports = createProductToShopify;

