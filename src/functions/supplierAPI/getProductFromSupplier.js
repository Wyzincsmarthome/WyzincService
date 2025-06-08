const axios = require('axios');

async function getProductFromSupplier(ean, retryCount = 0) {
    const maxRetries = 5; // Mais tentativas
    const timeoutMs = 120000; // 2 minutos - muito mais tempo
    
    try {
        console.log(`Consultando API Suprides para EAN: ${ean} (tentativa ${retryCount + 1}/${maxRetries + 1})`);
        
        const apiUser = process.env.API_USER;
        const apiPassword = process.env.API_PASSWORD;
        const apiToken = process.env.API_TOKEN;
        
        if (!apiUser || !apiPassword || !apiToken) {
            throw new Error('Credenciais da API Suprides nao configuradas');
        }
        
        console.log('Credenciais configuradas:');
        console.log('   API_USER:', apiUser);
        console.log('   API_PASSWORD:', apiPassword ? 'Definido' : 'Nao definido');
        console.log('   API_TOKEN:', apiToken ? 'Definido' : 'Nao definido');
        console.log(`   TIMEOUT: ${timeoutMs}ms (${timeoutMs/1000}s)`);
        
        // A API precisa de user E password nos parâmetros + Bearer token nos headers
        try {
            console.log('Tentativa: Bearer token + user + password nos parametros');
            console.log('🕐 Aguardando resposta da API...');
            
            const response = await axios.get('https://www.suprides.pt/rest/V1/integration/products-list', {
                params: {
                    user: apiUser,
                    password: apiPassword,
                    searchCriteria: JSON.stringify({
                        filterGroups: [{
                            filters: [{
                                field: 'ean',
                                value: ean,
                                conditionType: 'eq'
                            }]
                        }]
                    })
                },
                headers: {
                    'Authorization': 'Bearer ' + apiToken,
                    'Content-Type': 'application/json'
                },
                timeout: timeoutMs // Timeout aumentado
            });
            
            console.log('✅ Resposta recebida! Status:', response.status);
            console.log('Resposta completa:', JSON.stringify(response.data, null, 2));
            
            if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
                const rawProduct = response.data[0];
                
                // Verificar se é um erro
                if (rawProduct.status === 'ERROR') {
                    console.log('Erro retornado pela API:', rawProduct.message);
                    return null;
                }
                
                // Se chegou aqui, o produto foi encontrado
                console.log('Produto encontrado na API:', rawProduct.name || rawProduct.title || 'Nome nao disponivel');
                console.log('Estrutura do produto:', Object.keys(rawProduct));
                console.log('Dados do produto:');
                console.log('   Nome:', rawProduct.name);
                console.log('   Titulo:', rawProduct.title);
                console.log('   Preco:', rawProduct.price);
                console.log('   PVP:', rawProduct.pvpr);
                console.log('   Marca:', rawProduct.brand);
                console.log('   Stock:', rawProduct.stock);
                console.log('   Descricao:', rawProduct.description);
                
                // =================================
                // DEBUGGING COMPLETO - ADICIONAR TEMPORARIAMENTE
                // =================================
                console.log('\n' + '='.repeat(60));
                console.log('🔍 DEBUGGING COMPLETO DO PRODUTO DA SUPRIDES');
                console.log('='.repeat(60));
                console.log('📋 Produto raw completo:');
                console.log(JSON.stringify(rawProduct, null, 2));
                console.log('\n📊 Análise de campos:');
                console.log('   • Total de propriedades:', Object.keys(rawProduct).length);
                console.log('   • Propriedades disponíveis:', Object.keys(rawProduct));
                console.log('\n🔎 Verificação de campos críticos:');
                console.log('   • Nome/Title:', rawProduct.name || rawProduct.title || 'VAZIO');
                console.log('   • Preço:', rawProduct.price || 'VAZIO');
                console.log('   • PVP:', rawProduct.pvpr || 'VAZIO');
                console.log('   • Preço Final:', rawProduct.final_price || 'VAZIO');
                console.log('   • Preço Regular:', rawProduct.regular_price || 'VAZIO');
                console.log('   • Marca:', rawProduct.brand || 'VAZIO');
                console.log('   • Categoria:', rawProduct.category || rawProduct.family || 'VAZIO');
                console.log('   • Stock:', rawProduct.stock || 'VAZIO');
                console.log('   • Quantidade:', rawProduct.quantity || rawProduct.qty || 'VAZIO');
                console.log('   • Descrição:', rawProduct.description ? 'PRESENTE' : 'VAZIO');
                console.log('   • Descrição Curta:', rawProduct.short_description ? 'PRESENTE' : 'VAZIO');
                console.log('   • Imagens:', rawProduct.images ? (Array.isArray(rawProduct.images) ? rawProduct.images.length + ' imagens' : 'Presente mas não é array') : 'VAZIO');
                console.log('   • EAN:', rawProduct.ean || 'VAZIO');
                console.log('   • SKU:', rawProduct.sku || 'VAZIO');
                
                // Verificar diferentes formatos de imagens
                if (rawProduct.images) {
                    console.log('\n🖼️ Análise detalhada das imagens:');
                    console.log('   • Tipo:', typeof rawProduct.images);
                    console.log('   • É array?', Array.isArray(rawProduct.images));
                    if (Array.isArray(rawProduct.images)) {
                        console.log('   • Quantidade:', rawProduct.images.length);
                        if (rawProduct.images.length > 0) {
                            console.log('   • Primeira imagem:', rawProduct.images[0]);
                            console.log('   • Estrutura da primeira imagem:', typeof rawProduct.images[0], Object.keys(rawProduct.images[0] || {}));
                        }
                    } else {
                        console.log('   • Conteúdo:', rawProduct.images);
                    }
                }
                
                // Verificar outros campos de preço possíveis
                console.log('\n💰 Análise de todos os campos relacionados com preço:');
                Object.keys(rawProduct).forEach(key => {
                    if (key.toLowerCase().includes('price') || key.toLowerCase().includes('prec') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('valor')) {
                        console.log(`   • ${key}:`, rawProduct[key]);
                    }
                });
                
                console.log('='.repeat(60));
                console.log('🔍 FIM DO DEBUGGING COMPLETO');
                console.log('='.repeat(60) + '\n');
                // =================================
                // FIM DO DEBUGGING
                // =================================
                
                return rawProduct;
            } else if (response.status === 200 && Array.isArray(response.data) && response.data.length === 0) {
                console.log('Produto nao encontrado na API (array vazio)');
                return null;
            } else {
                console.log('Resposta inesperada da API:', typeof response.data, response.data);
                return null;
            }
            
        } catch (error) {
            console.log(`❌ Erro ao consultar API Suprides (tentativa ${retryCount + 1}):`, error.message);
            
            // Verificar se é um timeout
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                console.log('⏰ Erro de timeout detectado');
                
                // Retry logic
                if (retryCount < maxRetries) {
                    const waitTime = Math.min((retryCount + 1) * 10000, 60000); // 10s, 20s, 30s, 40s, 50s, max 60s
                    console.log(`🔄 Tentando novamente em ${waitTime/1000}s... (${retryCount + 1}/${maxRetries})`);
                    console.log('💡 Dica: A API Suprides pode estar temporariamente sobrecarregada');
                    
                    // Aguardar antes do retry
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    
                    // Retry recursivo
                    return await getProductFromSupplier(ean, retryCount + 1);
                } else {
                    console.log('❌ Todas as tentativas falharam por timeout');
                    return null;
                }
            }
            
            if (error.response) {
                console.log('   Status:', error.response.status);
                console.log('   Dados:', JSON.stringify(error.response.data, null, 2));
            }
            return null;
        }
        
    } catch (error) {
        console.log('Erro geral ao consultar API Suprides:', error.message);
        return null;
    }
}

module.exports = getProductFromSupplier;
