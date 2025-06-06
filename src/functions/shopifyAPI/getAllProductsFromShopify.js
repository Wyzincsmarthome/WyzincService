require('colors');
const createProductToShopify = require('./createProductToShopify');

// Função principal que obtém produtos da Shopify e processa a lista local
async function getAllProductsFromShopify(shopifyClient) {
    try {
        console.log('🛍️ Obtendo produtos da Shopify...');
        
        // Validar cliente Shopify
        if (!shopifyClient) {
            throw new Error('Cliente Shopify não fornecido para getAllProductsFromShopify');
        }
        
        if (typeof shopifyClient.request !== 'function') {
            throw new Error('Cliente Shopify inválido - método request não encontrado');
        }
        
        // Query GraphQL para obter produtos
        const query = `
            query getProducts($first: Int!, $after: String) {
                products(first: $first, after: $after) {
                    edges {
                        node {
                            id
                            title
                            handle
                            variants(first: 1) {
                                edges {
                                    node {
                                        sku
                                    }
                                }
                            }
                        }
                        cursor
                    }
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                }
            }
        `;
        
        let allProducts = [];
        let hasNextPage = true;
        let cursor = null;
        
        // Obter todos os produtos com paginação
        while (hasNextPage) {
            const variables = {
                first: 50,
                after: cursor
            };
            
            console.log('📊 Obtendo página de produtos...');
            
            try {
                const response = await shopifyClient.request(query, variables);
                
                if (!response || !response.data || !response.data.products) {
                    console.error('❌ Resposta inválida da API Shopify');
                    console.error('📄 Resposta:', JSON.stringify(response, null, 2));
                    break;
                }
                
                const products = response.data.products.edges.map(edge => edge.node);
                allProducts = allProducts.concat(products);
                
                hasNextPage = response.data.products.pageInfo.hasNextPage;
                cursor = response.data.products.pageInfo.endCursor;
                
                console.log('📦 Produtos obtidos nesta página:', products.length);
                
            } catch (queryError) {
                console.error('❌ Erro na query de produtos:', queryError.message);
                if (queryError.response) {
                    console.error('📄 Detalhes:', JSON.stringify(queryError.response, null, 2));
                }
                break;
            }
        }
        
        console.log('📊 Total de produtos na Shopify:', allProducts.length);
        
        // Ler lista de produtos local
        const fs = require('fs');
        const path = require('path');
        
        const productsListPath = path.join(__dirname, '../../productsList.txt');
        
        if (!fs.existsSync(productsListPath)) {
            throw new Error('Ficheiro productsList.txt não encontrado em: ' + productsListPath);
        }
        
        const productsListContent = fs.readFileSync(productsListPath, 'utf8');
        console.log('📄 Lendo lista de produtos...');
        
        let localProducts;
        try {
            localProducts = JSON.parse(productsListContent);
        } catch (parseError) {
            throw new Error('Erro ao fazer parse do productsList.txt: ' + parseError.message);
        }
        
        if (!Array.isArray(localProducts)) {
            throw new Error('productsList.txt não contém um array válido');
        }
        
        console.log('📊 ' + localProducts.length + ' produtos encontrados na lista local');
        
        // Processar cada produto da lista local
        let processedCount = 0;
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        
        for (const localProduct of localProducts) {
            processedCount++;
            
            // VALIDAÇÃO CRÍTICA: Verificar se localProduct existe e tem estrutura válida
            if (!localProduct) {
                console.log('⚠️ Produto ' + processedCount + ' é null/undefined - ignorando');
                skippedCount++;
                continue;
            }
            
            if (typeof localProduct !== 'object') {
                console.log('⚠️ Produto ' + processedCount + ' não é um objeto válido - ignorando');
                skippedCount++;
                continue;
            }
            
            if (!localProduct.ean) {
                console.log('⚠️ Produto ' + processedCount + ' não tem EAN - ignorando');
                skippedCount++;
                continue;
            }
            
            console.log('🔍 Processando produto ' + processedCount + '/' + localProducts.length + ': ' + (localProduct.name || 'Nome não definido'));
            
            // Verificar se produto já existe na Shopify
            const existingProduct = allProducts.find(shopifyProduct => {
                return shopifyProduct.variants.edges.some(variant => 
                    variant.node.sku === localProduct.ean
                );
            });
            
            if (existingProduct) {
                console.log('✅ Produto já existe na Shopify (SKU: ' + localProduct.ean + ') - ignorando');
                skippedCount++;
                continue;
            }
            
            // Produto não existe - criar
            console.log('🆕 Produto não existe na Shopify - criando...');
            
            try {
                // CORREÇÃO CRÍTICA: Usar função importada e passar localProduct validado
                await createProductToShopify(shopifyClient, localProduct);
                successCount++;
                console.log('✅ Produto criado com sucesso!');
                
                // Delay entre criações para evitar rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (createError) {
                errorCount++;
                console.log('❌ Erro ao criar produto:', createError.message);
                // Continuar com próximo produto
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

module.exports = getAllProductsFromShopify;

