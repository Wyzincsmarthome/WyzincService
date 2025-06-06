require('colors');
const axios = require('axios');

// Função para gerar tags automáticas CORRIGIDA
function generateProductTags(product) {
    const tags = [];
    
    // Validar se product existe
    if (!product) {
        console.log('⚠️ Produto undefined - não é possível gerar tags');
        return [];
    }
    
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
    
    // 2. TAG DE SUB-CATEGORIA CORRIGIDA
    let categoryTag = '';
    const productName = (product.name || '').toLowerCase();
    const productDescription = (product.description || '').toLowerCase();
    const productFamily = (product.family || '').toLowerCase();
    
    // CORREÇÃO: Verificar categorias específicas por ordem de prioridade
    if (productName.includes('aspirador robô') || productName.includes('robot vacuum') || productName.includes('mi robot')) {
        categoryTag = 'Aspirador Robô';
    } else if (productName.includes('aspirador vertical') || productDescription.includes('aspirador vertical') || productDescription.includes('tipo aspirador vertical')) {
        categoryTag = 'Aspirador Vertical';
    } else if (productName.includes('mini aspirador')) {
        categoryTag = 'Mini Aspirador';
    } else if (productName.includes('aspirador') || productFamily.includes('aspiração')) {
        categoryTag = 'Aspiradores';
    } else if (productName.includes('smart tv') || productName.includes('televisão') || productFamily.includes('tvs') || productName.includes(' tv ') || productName.includes('qled') || productName.includes('oled')) {
        categoryTag = 'TVs';  // CORREÇÃO: Priorizar TVs antes de assistentes
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
    } else if (productName.includes('assistente virtual') || productName.includes('alexa') || productName.includes('google assistant')) {
        categoryTag = 'Assistentes Virtuais';  // CORREÇÃO: Só para assistentes reais, não TVs com Google TV
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
            categoryTag = 'Gadgets Diversos';  // CORREÇÃO: Fallback para produtos que não se enquadram
        }
    }
    
    if (categoryTag) tags.push(categoryTag);
    
    console.log('🏷️ Tags geradas para', product.name || 'produto sem nome', ':', tags);
    return tags;
}

// Função para processar preços CORRIGIDA
function processProductPrices(product) {
    console.log('💰 Processando preços...');
    console.log('   • Preço original (price):', product.price);
    console.log('   • PVP original (pvpr):', product.pvpr);
    
    // CORREÇÃO DEFINITIVA: Múltiplas tentativas de parsing
    let costPrice = 0;
    let retailPrice = 0;
    
    // Processar preço de custo
    if (product.price) {
        const priceStr = String(product.price);
        console.log('   • Processando price string:', JSON.stringify(priceStr));
        
        // Tentar diferentes métodos de parsing
        const cleanPrice1 = priceStr.replace(',', '.');  // "1,004.05" → "1004.05"
        const cleanPrice2 = priceStr.replace(/,/g, '.');  // Substituir todas as vírgulas
        const cleanPrice3 = priceStr.replace(/[^0-9.,]/g, '').replace(',', '.'); // Remover caracteres não numéricos
        
        console.log('   • cleanPrice1:', cleanPrice1);
        console.log('   • cleanPrice2:', cleanPrice2);
        console.log('   • cleanPrice3:', cleanPrice3);
        
        costPrice = parseFloat(cleanPrice3) || parseFloat(cleanPrice2) || parseFloat(cleanPrice1) || 0;
        console.log('   • Preço de custo final:', costPrice);
    }
    
    // Processar PVP
    if (product.pvpr) {
        const pvprStr = String(product.pvpr);
        console.log('   • Processando pvpr string:', JSON.stringify(pvprStr));
        
        // Tentar diferentes métodos de parsing
        const cleanPvpr1 = pvprStr.replace(',', '.');
        const cleanPvpr2 = pvprStr.replace(/,/g, '.');
        const cleanPvpr3 = pvprStr.replace(/[^0-9.,]/g, '').replace(',', '.');
        
        console.log('   • cleanPvpr1:', cleanPvpr1);
        console.log('   • cleanPvpr2:', cleanPvpr2);
        console.log('   • cleanPvpr3:', cleanPvpr3);
        
        retailPrice = parseFloat(cleanPvpr3) || parseFloat(cleanPvpr2) || parseFloat(cleanPvpr1) || costPrice;
        console.log('   • PVP final:', retailPrice);
    } else {
        retailPrice = costPrice;
    }
    
    // Validação final
    if (costPrice <= 0) {
        console.log('⚠️ Preço de custo inválido, usando 1€');
        costPrice = 1;
    }
    if (retailPrice <= 0) {
        console.log('⚠️ PVP inválido, usando preço de custo');
        retailPrice = costPrice;
    }
    
    console.log('💰 Preços finais processados:');
    console.log('   • Preço de custo:', costPrice + '€');
    console.log('   • PVP (preço de venda):', retailPrice + '€');
    
    return { costPrice, retailPrice };
}

// Função para obter produtos da Shopify via REST API
async function getAllProductsFromShopify(shopifyClient) {
    try {
        console.log('🛍️ Obtendo produtos da Shopify via REST API...');
        
        // Extrair configurações do cliente GraphQL
        const storeUrl = process.env.SHOPIFY_STORE_URL;
        const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
        
        if (!storeUrl || !accessToken) {
            throw new Error('Variáveis de ambiente SHOPIFY_STORE_URL ou SHOPIFY_ACCESS_TOKEN não definidas');
        }
        
        // Extrair domain da URL
        let storeDomain = storeUrl;
        if (storeUrl.includes('://')) {
            storeDomain = storeUrl.split('://')[1];
        }
        if (!storeDomain.includes('.myshopify.com')) {
            storeDomain = storeDomain + '.myshopify.com';
        }
        
        // Configurar cliente REST
        const restClient = axios.create({
            baseURL: `https://${storeDomain}/admin/api/2024-07`,
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Obtendo produtos via REST API...');
        
        let allProducts = [];
        let page = 1;
        const limit = 50;
        
        try {
            // Obter produtos com paginação REST
            while (true) {
                const response = await restClient.get('/products.json', {
                    params: {
                        limit: limit,
                        page: page,
                        fields: 'id,title,handle,variants'
                    }
                });
                
                if (!response.data || !response.data.products) {
                    console.log('❌ Resposta inválida da REST API');
                    break;
                }
                
                const products = response.data.products;
                allProducts = allProducts.concat(products);
                
                console.log('📦 Produtos obtidos na página', page + ':', products.length);
                
                // Se obteve menos que o limite, chegou ao fim
                if (products.length < limit) {
                    break;
                }
                
                page++;
            }
            
        } catch (restError) {
            console.log('⚠️ Erro na REST API, continuando sem produtos existentes:', restError.message);
            // Continuar mesmo sem conseguir obter produtos existentes
            allProducts = []; // CORREÇÃO: Garantir que é array
        }
        
        console.log('📊 Total de produtos na Shopify:', allProducts.length);
        
        // Ler lista de EANs local (SISTEMA ORIGINAL)
        const fs = require('fs');
        const path = require('path');
        
        const productsListPath = path.join(__dirname, '../../productsList.txt');
        
        console.log('📄 Procurando lista de EANs em:', productsListPath);
        
        if (!fs.existsSync(productsListPath)) {
            console.error('❌ Ficheiro productsList.txt não encontrado em:', productsListPath);
            throw new Error('Ficheiro productsList.txt não encontrado em: ' + productsListPath);
        }
        
        const productsListContent = fs.readFileSync(productsListPath, 'utf8');
        console.log('📄 Lendo lista de EANs...');
        console.log('📄 Conteúdo (primeiros 200 chars):', productsListContent.substring(0, 200));
        
        let localEANs;
        try {
            // CORREÇÃO: Suportar formato simples (um EAN por linha) E formato JSON
            if (productsListContent.trim().startsWith('[')) {
                // Formato JSON (compatibilidade com formato atual)
                console.log('📄 Detectado formato JSON');
                localEANs = JSON.parse(productsListContent);
            } else {
                // Formato simples (um EAN por linha) - NOVO FORMATO PREFERIDO
                console.log('📄 Detectado formato simples (um EAN por linha)');
                
                // CORREÇÃO: Split correto por quebras de linha
                const lines = productsListContent
                    .split(/\r?\n/)  // CORREÇÃO: Split por \n ou \r\n (Windows/Unix)
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                
                console.log('📄 Linhas após split:', lines);
                
                localEANs = lines.filter(line => {
                    // CORREÇÃO: Validação mais permissiva
                    const isValid = line && line.length >= 8 && line.length <= 20 && /^[0-9]+$/.test(line);
                    if (line && !isValid) {
                        console.log('⚠️ EAN inválido ignorado:', line, '(comprimento:', line.length, ')');
                    } else if (isValid) {
                        console.log('✅ EAN válido encontrado:', line);
                    }
                    return isValid;
                });
                
                console.log('📄 EANs após validação:', localEANs);
            }
        } catch (parseError) {
            console.error('❌ Erro ao fazer parse:', parseError.message);
            console.error('📄 Conteúdo completo:', productsListContent);
            throw new Error('Erro ao fazer parse do productsList.txt: ' + parseError.message);
        }
        
        if (!Array.isArray(localEANs)) {
            console.error('❌ Conteúdo não é um array');
            console.error('📄 Tipo:', typeof localEANs);
            console.error('📄 Conteúdo:', localEANs);
            throw new Error('productsList.txt não contém um array válido de EANs');
        }
        
        console.log('📊 ' + localEANs.length + ' EANs encontrados na lista local');
        
        // CORREÇÃO: Se não há EANs válidos, terminar aqui
        if (localEANs.length === 0) {
            console.log('⚠️ Nenhum EAN válido encontrado na lista local');
            return {
                processed: 0,
                success: 0,
                errors: 0,
                skipped: 0
            };
        }
        
        // Processar cada EAN da lista local (SISTEMA ORIGINAL RESTAURADO)
        let processedCount = 0;
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        
        for (const ean of localEANs) {
            processedCount++;
            
            console.log('🔍 Processando EAN ' + processedCount + '/' + localEANs.length + ': ' + ean);
            
            // CORREÇÃO: Verificar se produto já existe na Shopify (allProducts é garantidamente array)
            const existingProduct = allProducts.find(shopifyProduct => {
                return shopifyProduct.variants && shopifyProduct.variants.some(variant => 
                    variant.sku === ean || variant.barcode === ean
                );
            });
            
            if (existingProduct) {
                console.log('🔄 Produto já existe na Shopify (SKU/EAN: ' + ean + ') - atualizando...');
                
                try {
                    // Obter dados atualizados da API Suprides
                    const getProductFromSupplier = require('../supplierAPI/getProductFromSupplier');
                    console.log('🔍 Consultando API Suprides para atualização do EAN:', ean);
                    const productData = await getProductFromSupplier(ean);
                    
                    if (!productData) {
                        console.log('❌ Produto não encontrado na API Suprides para EAN:', ean);
                        errorCount++;
                        continue;
                    }
                    
                    console.log('✅ Dados obtidos da Suprides para atualização:', productData.name || 'Nome não disponível');
                    
                    // Atualizar produto existente
                    await updateProductViaREST(restClient, existingProduct, productData);
                    successCount++;
                    console.log('✅ Produto atualizado com sucesso na Shopify!');
                    
                } catch (updateError) {
                    errorCount++;
                    console.log('❌ Erro ao atualizar produto EAN ' + ean + ':', updateError.message);
                }
                
                // Delay entre operações
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }
            
            // Produto não existe - obter dados da API Suprides
            console.log('🆕 Produto não existe na Shopify - obtendo dados da Suprides...');
            
            try {
                // SISTEMA ORIGINAL: Obter dados da API Suprides
                const getProductFromSupplier = require('../supplierAPI/getProductFromSupplier');
                console.log('🔍 Consultando API Suprides para EAN:', ean);
                const productData = await getProductFromSupplier(ean);
                
                if (!productData) {
                    console.log('❌ Produto não encontrado na API Suprides para EAN:', ean);
                    errorCount++;
                    continue;
                }
                
                console.log('✅ Dados obtidos da Suprides:', productData.name || 'Nome não disponível');
                
                // Criar produto na Shopify via REST API
                await createProductViaREST(restClient, productData);
                successCount++;
                console.log('✅ Produto criado com sucesso na Shopify!');
                
                // Delay entre criações para evitar rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (createError) {
                errorCount++;
                console.log('❌ Erro ao processar EAN ' + ean + ':', createError.message);
                
                // Log detalhado do erro
                if (createError.message.includes('API do fornecedor')) {
                    console.log('💡 Sugestão: Verificar credenciais da API Suprides (API_USER, API_PASSWORD, API_TOKEN)');
                }
                
                // Continuar com próximo EAN
            }
        }
        
        // Relatório final
        console.log('📊 Sincronização concluída!');
        console.log('   • Total processados:', processedCount);
        console.log('   • Sucessos:', successCount);
        console.log('   • Erros:', errorCount);
        console.log('   • Ignorados (vazios/existentes):', skippedCount);
        console.log('   • Taxa de sucesso:', ((successCount / Math.max(processedCount - skippedCount, 1)) * 100).toFixed(1) + '%');
        
        return {
            processed: processedCount,
            success: successCount,
            errors: errorCount,
            skipped: skippedCount
        };
        
    } catch (error) {
        console.log('🚨 Erro fatal na sincronização:', error.message);
        throw error;
    }
}

// Função para atualizar produto via REST API
async function updateProductViaREST(restClient, existingProduct, productData) {
    try {
        console.log('🔄 Atualizando produto via REST API:', productData.name);
        
        // Processar preços CORRIGIDOS
        const { costPrice, retailPrice } = processProductPrices(productData);
        
        // Gerar tags automáticas CORRIGIDAS
        const tags = generateProductTags(productData);
        
        // Mapear stock
        let inventory_quantity = 0;
        switch(productData.stock) {
            case 'Disponível ( < 10 UN )':
            case 'Disponível ( < 10 Un )':
                inventory_quantity = 9;
                break;
            case 'Stock Reduzido ( < 2 UN )':
            case 'Stock Reduzido ( < 2 Un )':
                inventory_quantity = 1;
                break;
            default:
                inventory_quantity = 10;
                break;
        }
        
        // Atualizar produto
        const productUpdateData = {
            product: {
                id: existingProduct.id,
                title: productData.name,
                body_html: (productData.short_description || '') + "\\n\\n" + (productData.description || ''),
                vendor: productData.brand || '',
                product_type: productData.family || '',
                tags: tags.join(', ')
            }
        };
        
        console.log('📤 Atualizando produto via REST API...');
        console.log('   •
