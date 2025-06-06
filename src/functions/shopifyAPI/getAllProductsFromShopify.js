require('colors');
const getProductFromSupplier = require('../supplierAPI/getProductFromSupplier');

// Função principal que obtém produtos da Shopify e processa a lista local de EANs
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
        
        // Query GraphQL para obter produtos CORRIGIDA
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
            // CORREÇÃO CRÍTICA: Garantir que variables é um objeto válido
            const variables = {
                first: 50, // Valor fixo válido
                after: cursor
            };
            
            console.log('📊 Obtendo página de produtos...');
            console.log('📄 Variáveis enviadas:', JSON.stringify(variables, null, 2));
            
            try {
                // CORREÇÃO CRÍTICA: Passar variables diretamente, não como objeto aninhado
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
                return shopifyProduct.variants.edges.some(variant => 
                    variant.node.sku === ean
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
                console.log('🔍 Consultando API Suprides para EAN:', ean);
                const productData = await getProductFromSupplier(ean);
                
                if (!productData) {
                    console.log('❌ Produto não encontrado na API Suprides para EAN:', ean);
                    errorCount++;
                    continue;
                }
                
                console.log('✅ Dados obtidos da Suprides:', productData.name || 'Nome não disponível');
                
                // Importar função de criação de produtos
                const createProductToShopify = require('./createProductToShopify');
                
                // Criar produto na Shopify com dados da Suprides
                await createProductToShopify(shopifyClient, productData);
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

module.exports = getAllProductsFromShopify;
