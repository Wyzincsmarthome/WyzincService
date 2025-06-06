require('colors');
const axios = require('axios');

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
            localEANs = JSON.parse(productsListContent);
        } catch (parseError) {
            console.error('❌ Erro ao fazer parse do JSON:', parseError.message);
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
        
        // Processar cada EAN da lista local (SISTEMA ORIGINAL RESTAURADO)
        let processedCount = 0;
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        
        for (const ean of localEANs) {
            processedCount++;
            
            // VALIDAÇÃO: Verificar se EAN é válido
            if (!ean || typeof ean !== 'string') {
                console.log('⚠️ EAN ' + processedCount + ' inválido - ignorando:', ean);
                skippedCount++;
                continue;
            }
            
            console.log('🔍 Processando EAN ' + processedCount + '/' + localEANs.length + ': ' + ean);
            
            // Verificar se produto já existe na Shopify
            const existingProduct = allProducts.find(shopifyProduct => {
                return shopifyProduct.variants && shopifyProduct.variants.some(variant => 
                    variant.sku === ean
                );
            });
            
            if (existingProduct) {
                console.log('✅ Produto já existe na Shopify (SKU: ' + ean + ') - ignorando');
                skippedCount++;
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

// Função para criar produto via REST API
async function createProductViaREST(restClient, product) {
    try {
        console.log('🚀 Criando produto via REST API:', product.name);
        
        // Gerar tags automáticas
        const tags = [];
        if (product.brand) {
            tags.push(product.brand);
        }
        tags.push('Gadgets Diversos');
        
        // Mapear stock
        let inventory_quantity = 0;
        switch(product.stock) {
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
        
        // Preparar dados do produto para REST API
        const productData = {
            product: {
                title: product.name,
                body_html: (product.short_description || '') + "\\n\\n" + (product.description || ''),
                vendor: product.brand || '',
                product_type: product.family || '',
                tags: tags.join(', '),
                status: 'active',
                variants: [
                    {
                        price: product.price || product.pvpr || '0.00',
                        sku: product.ean,
                        inventory_management: 'shopify',
                        inventory_policy: 'deny',
                        inventory_quantity: inventory_quantity
                    }
                ]
            }
        };
        
        // Adicionar imagens se existirem
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            productData.product.images = product.images.map((img, index) => ({
                src: img,
                alt: `${product.name} - Imagem ${index + 1}`
            }));
        }
        
        console.log('📤 Enviando produto via REST API...');
        console.log('   • Título:', productData.product.title);
        console.log('   • Preço:', productData.product.variants[0].price);
        console.log('   • SKU:', productData.product.variants[0].sku);
        console.log('   • Stock:', productData.product.variants[0].inventory_quantity);
        console.log('   • Imagens:', productData.product.images ? productData.product.images.length : 0);
        
        const response = await restClient.post('/products.json', productData);
        
        if (response.data && response.data.product) {
            console.log('✅ Produto criado com sucesso via REST API!');
            console.log('   • ID:', response.data.product.id);
            console.log('   • Handle:', response.data.product.handle);
            return response.data.product;
        } else {
            throw new Error('Resposta inválida da REST API');
        }
        
    } catch (error) {
        console.log('❌ Erro na criação via REST API:', error.message);
        if (error.response && error.response.data) {
            console.log('📄 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

module.exports = getAllProductsFromShopify;
                    
