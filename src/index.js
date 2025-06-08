require('dotenv').config();
require('colors');

const { createAuth, getAllProductsFromShopify } = require('./functions/shopifyAPI');
const { sendMessage } = require('./functions/discordAPI');

async function executeAsyncTask() {
    try {
        console.log('🚀 Iniciando sincronização de produtos...'.green);
        console.log(`⏰ Timestamp: ${new Date().toISOString()}`.cyan);
        
        // Criar Cliente Shopify
        console.log('🔗 Criando cliente Shopify...'.yellow);
        const shopifyClient = await createAuth();
        
        if (!shopifyClient) {
            throw new Error('Falha ao criar cliente Shopify');
        }
        
        console.log('✅ Cliente Shopify criado com sucesso'.green);
        
        // Processar todos os produtos (a função agora faz tudo internamente)
        console.log('🛍️ Iniciando processamento de produtos...'.yellow);
        const result = await getAllProductsFromShopify(shopifyClient);
        
        // Validar resultado
        if (!result || typeof result !== 'object') {
            throw new Error('Resultado inválido da função getAllProductsFromShopify');
        }
        
        // Estatísticas finais
        console.log('\n📊 Sincronização concluída!'.green.bold);
        console.log(`   • Total processados: ${result.processed || 0}`.cyan);
        console.log(`   • Sucessos: ${result.success || 0}`.green);
        console.log(`   • Erros: ${result.errors || 0}`.red);
        console.log(`   • Ignorados (vazios/existentes): ${result.skipped || 0}`.yellow);
        
        // Calcular taxa de sucesso
        const processedForSuccess = Math.max((result.processed || 0) - (result.skipped || 0), 1);
        const successRate = ((result.success || 0) / processedForSuccess * 100).toFixed(1);
        console.log(`   • Taxa de sucesso: ${successRate}%`.cyan);
        
        // Enviar resumo para Discord
        try {
            const discordMessage = `🎉 Sincronização concluída!\n📊 Processados: ${result.processed || 0} | ✅ Sucessos: ${result.success || 0} | ❌ Erros: ${result.errors || 0} | ⚠️ Ignorados: ${result.skipped || 0}`;
            await sendMessage(discordMessage);
            console.log('📢 Resumo enviado para Discord'.green);
        } catch (discordError) {
            console.log(`⚠️ Erro ao enviar resumo Discord: ${discordError.message}`.yellow);
            // Não é erro fatal, continua
        }
        
        console.log('🏁 Processo finalizado com sucesso!'.green.bold);
        
    } catch (error) {
        console.log(`🚨 Erro fatal na sincronização: ${error.message}`.red.bold);
        console.error('Stack trace:', error.stack);
        
        // Enviar notificação de erro fatal para Discord
        try {
            await sendMessage(`🚨 ERRO FATAL na sincronização: ${error.message}`);
        } catch (discordError) {
            console.log(`⚠️ Erro ao enviar notificação de erro fatal: ${discordError.message}`.yellow);
        }
        
        // Sair com código de erro para indicar falha no GitHub Actions
        process.exit(1);
    }
}

// Executar sincronização
executeAsyncTask()
    .then(() => {
        console.log('✅ Sincronização executada com sucesso!'.green);
        process.exit(0);
    })
    .catch((error) => {
        console.log(`❌ Erro na execução: ${error.message}`.red);
        console.error('Erro completo:', error);
        process.exit(1);
    });
