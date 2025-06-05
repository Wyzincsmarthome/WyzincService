require('colors');

// Função para gerar tags automáticas baseadas no produto
function generateProductTags(product) {
    const tags = [];
    
    // 1. TAG DE MARCA
    let brandTag = '';
    if (product.brand) {
        // Lógica especial para Yeelight
        if ((product.brand.toLowerCase() === 'xiaomi' && 
             product.name && product.name.toLowerCase().includes('yeelight')) {
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
    if ((productName.includes('aspirador robô') || productName.includes('robot vacuum')) {
        categoryTag = 'Aspirador Robô';
    } else if (productName.includes('aspirador vertical')) {
        categoryTag = 'Aspirador Vertical';
    } else if (productName.includes('mini aspirador')) {
        categoryTag = 'Mini Aspirador';
    } else if ((productName.includes('câmara') || productName.includes('camera') || productName.includes('webcam')) {
        categoryTag = 'Câmaras';
    } else if (productName.includes('sensor')) {
        categoryTag = 'Sensores Inteligentes';
    } else if ((productName.includes('fechadura') || productName.includes('lock')) {
        categoryTag = 'Fechaduras Inteligentes';
    } else if ((productName.includes('tomada') || productName.includes('socket') || productName.includes('plug')) {
        categoryTag = 'Tomadas';
    } else if ((productName.includes('controlo remoto') || productName.includes('comando') || productName.includes('remote'))) {
        categoryTag = 'Controlo Remoto';
    } else if ((productName.includes('iluminação') || productName.includes('luz') || productName.includes('lamp') || 
               productName.includes('light') || productName.includes('lamp'))) {
        categoryTag = 'Iluminação';
    } else if ((productName.includes('cortina') || productName.includes('curtain')) {
        categoryTag = 'Motor Cortinas';
    } else if ((productName.includes('campainha') || productName.includes('doorbell')) {
        categoryTag = 'Campainha Inteligente';
    } else if ((productName.includes('interruptor') || productName.includes('switch')) {
        categoryTag = 'Interruptor Inteligente';
    } else if ((productName.includes('hub') || productName.includes('gateway')) {
        categoryTag = 'Hubs Inteligentes';
    } else if ((productName.includes('assistente') || productName.includes('alexa') || productName.includes('google'))) {
        categoryTag = 'Assistentes Virtuais';
    } else if (productName.includes('painel')) {
        categoryTag = 'Painel Controlo';
    } else if ((productName.includes('acessório') && productName.includes('aspirador')) {
        categoryTag = 'Acessórios Aspiradores';
    } else if ((productName.includes('inteligente') || productName.includes('smart')) {
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
    
    // Gerar tags automáticas
    const productTags = generateProductTags(product);
    
    let tempStock = 0;
    
    // Mapeamento corrigido de stock (com "UN" maiúsculo)
    console.log('📦 Processando stock:', product.stock);
    
    switch(product.stock) {
        case 'Disponível ( < 10 UN )':
            tempStock = 9;
            console.log('✅ Stock mapeado: Disponível ( < 10 UN ) → 9 unidades');
            break;
        case 'Stock Reduzido ( < 2 UN )':
            tempStock = 1;
            console.log('⚠️ Stock mapeado: Stock Reduzido < 2 UN → 1 unidade');
            break;
        case 'Disponível ( < 2 UN )':
            tempStock = 1;
            console.log('⚠️ Stock mapeado: Disponível < 2 UN → 1 unidade');
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

    // Preparar array de imagens corrigido
    const imageList = product.images && Array.isArray(product.images) ? 
        product.images.map(img => ({ src: img })) : [];

    const response = await shopifyClient.post('/products', {
        data: {
            product: {
                title: product.name,
                body_html: product.short_description + "\n\n" + product.description,
                product_type: product.family,
                status: 'active',
                tags: productTags.join(', '), // Adicionar tags automáticas
                variants: [
                    {
                        price: product.optFinalPrice,
                        sku: product.ean,
                        position: 1,
                        inventory_policy: 'deny',
                        inventory_management: 'shopify',
                        inventory_quantity: tempStock,
                    }
                ],
                images: imageList
            }
        }
    });

    if(response) {
        console.log('✅ Produto com EAN $' + product.ean + ' foi criado!'.green);
    } else {
        console.log("=".repeat(50).yellow);
        console.log("ERRO (updateProduct) [EAN: " + product.ean + " ]: " + product.ean);
        console.log(error.message.yellow);
        console.log("=".repeat(50).yellow);
    }
}

module.exports = createProductToShopify;

