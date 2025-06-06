async function getAllProductsFromShopify(shopifyClient) {
    try {
        console.log('🛍️ Obtendo produtos da Shopify...');
        
        // Validar cliente
        if (!shopifyClient) {
            throw new Error('Cliente Shopify não fornecido');
        }
        
        if (typeof shopifyClient.request !== 'function') {
            throw new Error('Cliente Shopify inválido - método request não encontrado');
        }
        
        let allProducts = [];
        
        // Query GraphQL simplificada para teste inicial
        const simpleTestQuery = `
            query {
                shop {
                    name
                    domain
                }
            }
        `;
        
        console.log('🔍 Testando conectividade básica...');
        
        let testResponse;
        try {
            testResponse = await shopifyClient.request(simpleTestQuery);
            console.log('📄 Resposta do teste:', JSON.stringify(testResponse, null, 2));
            
            if (testResponse && testResponse.data && testResponse.data.shop) {
                console.log('✅ Conectividade confirmada com:', testResponse.data.shop.name);
            } else {
                console.log('⚠️ Resposta de teste inesperada');
            }
        } catch (testError) {
            console.error('❌ Erro no teste de conectividade:', testError.message);
            if (testError.response) {
                console.error('📄 Detalhes do erro:', JSON.stringify(testError.response, null, 2));
            }
            throw new Error(`Falha no teste de conectividade: ${testError.message}`);
        }
        
        // Query para contagem de produtos (versão robusta)
        const countQuery = `
            query {
                products(first: 1) {
                    edges {
                        node {
                            id
                        }
                    }
                    pageInfo {
                        hasNextPage
                    }
                }
            }
        `;
        
        console.log('📊 Obtendo informações de produtos...');
        
        let countResponse;
        try {
            countResponse = await shopifyClient.request(countQuery);
            console.log('📄 Resposta da contagem:', JSON.stringify(countResponse, null, 2));
            
            // Validação robusta da resposta
            if (!countResponse) {
                throw new Error('Resposta vazia da API');
            }
            
            if (!countResponse.data) {
                console.error('❌ response.data é undefined');
                console.error('📄 Resposta completa:', JSON.stringify(countResponse, null, 2));
                throw new Error('response.data é undefined - possível problema de permissões ou API version');
            }
            
            if (!countResponse.data.products) {
                console.error('❌ response.data.products é undefined');
                console.error('📄 response.data:', JSON.stringify(countResponse.data, null, 2));
                throw new Error('response.data.products é undefined - verifique permissões de leitura de produtos');
            }
            
            console.log('✅ Estrutura de resposta válida');
            
        } catch (countError) {
            console.error('❌ Erro na query de contagem:', countError.message);
            if (countError.response) {
                console.error('📄 Detalhes do erro:', JSON.stringify(countError.response, null, 2));
            }
            throw countError;
        }
        
        // Query principal para obter produtos
        const productsQuery = `
            query getProducts($first: Int!, $after: String) {
                products(first: $first, after: $after) {
                    edges {
                        node {
                            id
                            title
                            handle
                            status
                            vendor
                            productType
                            tags
                            createdAt
                            updatedAt
                            variants(first: 5) {
                                edges {
                                    node {
                                        id
                                        title
                                        price
                                        sku
                                        barcode
                                        inventoryQuantity
                                    }
                                }
                            }
                            images(first: 3) {
                                edges {
                                    node {
                                        id
                                        url
                                        altText
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
        
        // Obter produtos em lotes pequenos para teste
        const batchSize = 10; // Reduzido para teste
        let hasNextPage = true;
        let cursor = null;
        let processedCount = 0;
        let maxProducts = 50; // Limite para teste
        
        console.log(`🔄 Iniciando obtenção de produtos (máximo ${maxProducts})...`);
        
        while (hasNextPage && processedCount < maxProducts) {
            console.log(`📦 Processando lote ${Math.floor(processedCount / batchSize) + 1}...`);
            
            const variables = {
                first: batchSize,
                after: cursor
            };
            
            console.log('📤 Enviando query com variáveis:', JSON.stringify(variables, null, 2));
            
            let response;
            try {
                response = await shopifyClient.request(productsQuery, { variables });
                console.log('📄 Resposta recebida (estrutura):', {
                    hasData: !!response.data,
                    hasProducts: !!(response.data && response.data.products),
                    hasEdges: !!(response.data && response.data.products && response.data.products.edges),
                    edgesLength: response.data && response.data.products && response.data.products.edges ? response.data.products.edges.length : 0
                });
                
            } catch (queryError) {
                console.error('❌ Erro na query de produtos:', queryError.message);
                if (queryError.response) {
                    console.error('📄 Detalhes do erro:', JSON.stringify(queryError.response, null, 2));
                }
                throw queryError;
            }
            
            // Validação robusta da resposta
            if (!response || !response.data) {
                console.error('❌ Resposta inválida - sem data');
                break;
            }
            
            if (!response.data.products) {
                console.error('❌ Resposta inválida - sem products');
                console.error('📄 response.data:', JSON.stringify(response.data, null, 2));
                break;
            }
            
            if (!response.data.products.edges) {
                console.error('❌ Resposta inválida - sem edges');
                console.error('📄 response.data.products:', JSON.stringify(response.data.products, null, 2));
                break;
            }
            
            const products = response.data.products.edges;
            console.log(`📦 ${products.length} produtos recebidos neste lote`);
            
            // Processar produtos do lote atual
            for (const edge of products) {
                if (!edge || !edge.node) {
                    console.log('⚠️ Edge inválido encontrado, pulando...');
                    continue;
                }
                
                const product = edge.node;
                
                // Transformar dados para formato mais simples
                const processedProduct = {
                    id: product.id || '',
                    title: product.title || 'Sem título',
                    handle: product.handle || '',
                    status: product.status || 'UNKNOWN',
                    vendor: product.vendor || '',
                    productType: product.productType || '',
                    tags: product.tags || [],
                    createdAt: product.createdAt || '',
                    updatedAt: product.updatedAt || '',
                    variants: (product.variants && product.variants.edges) ? product.variants.edges.map(v => ({
                        id: v.node.id || '',
                        title: v.node.title || '',
                        price: parseFloat(v.node.price) || 0,
                        sku: v.node.sku || '',
                        barcode: v.node.barcode || '',
                        inventoryQuantity: v.node.inventoryQuantity || 0
                    })) : [],
                    images: (product.images && product.images.edges) ? product.images.edges.map(img => ({
                        id: img.node.id || '',
                        url: img.node.url || '',
                        altText: img.node.altText || ''
                    })) : []
                };
                
                allProducts.push(processedProduct);
                processedCount++;
                
                if (processedCount % 10 === 0) {
                    console.log(`📊 Produtos processados: ${processedCount}`);
                }
            }
            
            // Verificar se há mais páginas
            hasNextPage = response.data.products.pageInfo.hasNextPage && processedCount < maxProducts;
            cursor = response.data.products.pageInfo.endCursor;
            
            // Rate limiting - pausa entre requests
            if (hasNextPage) {
                console.log('⏳ Aguardando 1s antes do próximo lote...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        console.log(`✅ Sincronização concluída!`);
        console.log(`📊 Total de produtos obtidos: ${allProducts.length}`);
        
        // Log de amostra dos primeiros produtos
        if (allProducts.length > 0) {
            console.log('📋 Amostra do primeiro produto:');
            console.log(JSON.stringify(allProducts[0], null, 2));
        }
        
        return allProducts;
        
    } catch (error) {
        console.error('❌ Erro ao obter produtos da Shopify:', error.message);
        console.error('📄 Stack trace:', error.stack);
        
        if (error.response) {
            console.error('📄 Detalhes da resposta de erro:', JSON.stringify(error.response, null, 2));
        }
        
        // Sugestões de resolução baseadas no tipo de erro
        if (error.message.includes('products')) {
            console.error('💡 Sugestão: Verifique se o Access Token tem permissões para ler produtos');
        }
        
        if (error.message.includes('undefined')) {
            console.error('💡 Sugestão: Possível problema de API version ou estrutura de resposta');
        }
        
        throw error;
    }
}

module.exports = getAllProductsFromShopify;

