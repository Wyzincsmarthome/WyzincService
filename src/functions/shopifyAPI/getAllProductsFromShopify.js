async function getAllProductsFromShopify(shopifyClient) {
    try {
        console.log('🛍️ Obtendo produtos da Shopify...');
        
        let allProducts = [];
        let hasNextPage = true;
        let cursor = null;
        
        // Query GraphQL para obter produtos
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
                            variants(first: 10) {
                                edges {
                                    node {
                                        id
                                        title
                                        price
                                        sku
                                        barcode
                                        inventoryQuantity
                                        weight
                                        weightUnit
                                    }
                                }
                            }
                            images(first: 10) {
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
        
        // Primeiro, obter contagem total de produtos
        const countQuery = `
            query {
                products {
                    edges {
                        node {
                            id
                        }
                    }
                }
            }
        `;
        
        console.log('📊 Obtendo contagem de produtos...');
        const countResponse = await shopifyClient.request(countQuery);
        const totalProducts = countResponse.data.products.edges.length;
        console.log(`📦 Total de produtos encontrados: ${totalProducts}`);
        
        // Obter produtos em lotes de 50
        const batchSize = 50;
        let processedCount = 0;
        
        while (hasNextPage) {
            console.log(`🔄 Processando lote: ${processedCount + 1}-${Math.min(processedCount + batchSize, totalProducts)}`);
            
            const variables = {
                first: batchSize,
                after: cursor
            };
            
            const response = await shopifyClient.request(productsQuery, { variables });
            
            if (!response.data || !response.data.products) {
                console.error('❌ Resposta inválida da API Shopify');
                break;
            }
            
            const products = response.data.products.edges;
            
            // Processar produtos do lote atual
            for (const edge of products) {
                const product = edge.node;
                
                // Transformar dados para formato mais simples
                const processedProduct = {
                    id: product.id,
                    title: product.title,
                    handle: product.handle,
                    status: product.status,
                    vendor: product.vendor,
                    productType: product.productType,
                    tags: product.tags,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt,
                    variants: product.variants.edges.map(v => ({
                        id: v.node.id,
                        title: v.node.title,
                        price: parseFloat(v.node.price) || 0,
                        sku: v.node.sku,
                        barcode: v.node.barcode,
                        inventoryQuantity: v.node.inventoryQuantity || 0,
                        weight: v.node.weight || 0,
                        weightUnit: v.node.weightUnit
                    })),
                    images: product.images.edges.map(img => ({
                        id: img.node.id,
                        url: img.node.url,
                        altText: img.node.altText
                    }))
                };
                
                allProducts.push(processedProduct);
                processedCount++;
            }
            
            // Verificar se há mais páginas
            hasNextPage = response.data.products.pageInfo.hasNextPage;
            cursor = response.data.products.pageInfo.endCursor;
            
            // Rate limiting - pausa entre requests
            if (hasNextPage) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        console.log(`✅ Sincronização concluída!`);
        console.log(`📊 Total de produtos obtidos: ${allProducts.length}`);
        
        return allProducts;
        
    } catch (error) {
        console.error('❌ Erro ao obter produtos da Shopify:', error.message);
        
        if (error.response) {
            console.error('📄 Detalhes do erro:', error.response.data || error.response);
        }
        
        throw error;
    }
}

module.exports = getAllProductsFromShopify;
