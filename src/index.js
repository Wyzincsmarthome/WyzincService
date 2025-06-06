require('dotenv').config();
require('colors');

const fs = require('fs');
const { getProductFromSupplier } = require('./functions/supplierAPI');
const { createAuth, getAllProductsFromShopify, updateProductFromShopify, createProductToShopify } = require('./functions/shopifyAPI');
const { sendMessage } = require('./functions/discordAPI');

async function executeAsyncTask() {
    try {
        console.log('🚀 Iniciando sincronização de produtos...'.green);
        console.log(`⏰ Timestamp: ${new Date().toISOString()}`.cyan);
        
        /* > Criar Cliente Shopify */
        console.log('🔗 Criando cliente Shopify...'.yellow);
        let shopifyClient = await createAuth();
        
        /* > NOVO SISTEMA: Usar getAllProductsFromShopify que já faz tudo */
        console.log('📄 Lendo lista de produtos...'.yellow);
        
        // CORREÇÃO: Verificar se ficheiro existe
        const productsListPath = 'src/productsList.txt';
        if (!fs.existsSync(productsListPath)) {
            throw new Error(`Ficheiro ${productsListPath} não encontrado`);
        }
        
        const productsListContent = fs.readFileSync(productsListPath, 'utf8');
        
        // CORREÇÃO: Parsing robusto (suporta formato simples e JSON)
        let EANProductsList;
        if (productsListContent.trim().startsWith('[')) {
            // Formato JSON
            EANProductsList = JSON.parse(productsListContent);
        } else {
            // Formato simples (um EAN por linha)
            EANProductsList = productsListContent
                .split(/\r?\n/)  // CORREÇÃO: Split correto
                .map(line => line.trim())
                .filter(line => line.length > 0 && /^[0-9]+$/.test(line));
        }
        
        console.log(`📊 ${EANProductsList.length} produtos encontrados na lista`.cyan);
        
        /* > NOVO SISTEMA: getAllProductsFromShopify já faz tudo automaticamente */
        console.log('🛍️ Obtendo produtos da Shopify...'.yellow);
        
        // CORREÇÃO: getAllProductsFromShopify agora faz todo o processamento
        const result = await getAllProductsFromShopify(shopifyClient);
        
        /* > Estatísticas finais (já calculadas pelo novo sistema) */
        console.log('\\n📊 Sincronização concluída!'.green.bold);
        console.log(`   • Total processados: ${result.processed}`.cyan);
        console.log(`   • Sucessos: ${result.success}`.green);
        console.log(`   • Erros: ${result.errors}`.red);
        console.log(`   • Ignorados (vazios/existentes): ${result.skipped}`.yellow);
        console.log(`   • Taxa de sucesso: ${((result.success / Math.max(result.processed - result.skipped, 1)) * 100).toFixed(1)}%`.cyan);
        
        /* > Enviar resumo para Discord */
        try {
            await sendMessage(`🎉 Sincronização concluída!\\n📊 Processados: ${result.processed} | ✅ Sucessos: ${result.success} | ❌ Erros: ${result.errors}`);
        } catch (discordError) {
            console.log(`⚠️ Erro ao enviar resumo Discord: ${discordError.message}`.yellow);
        }
        
        /* > 'Limpar' Variáveis */
        shopifyClient = null;
        EANProductsList = null;
        
        console.log('🏁 Processo finalizado com sucesso!'.green.bold);
        
    } catch (error) {
        console.log(`🚨 Erro fatal na sincronização: ${error.message}`.red.bold);
        console.error(error.stack);
        
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

// Executar apenas uma vez e terminar
// O agendamento é feito pelo GitHub Actions (cron)
executeAsyncTask()
    .then(() => {
        console.log('✅ Sincronização executada com sucesso!'.green);
        process.exit(0); // Terminar com sucesso
    })
    .catch((error) => {
        console.log(`❌ Erro na execução: ${error.message}`.red);
        process.exit(1); // Terminar com erro
    });
