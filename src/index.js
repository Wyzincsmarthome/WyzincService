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
        
        /* > Obter Lista de EANs (do TXT) */
        console.log('📄 Lendo lista de produtos...'.yellow);
        let EANProductsList = fs.readFileSync('src/productsList.txt', { encoding: 'utf8', flag: 'r' }).split('\n');
        console.log(`📊 ${EANProductsList.length} produtos encontrados na lista`.cyan);
        
        /* > Obter Lista de Produtos (da Shopify) */
        console.log('🛍️ Obtendo produtos da Shopify...'.yellow);
        let shopifyProductsList = await getAllProductsFromShopify(shopifyClient);
        console.log(`📦 ${shopifyProductsList.length} produtos encontrados na Shopify`.cyan);
        
        let processedCount = 0;
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        
        for(let productInfo of EANProductsList) {
            if(productInfo === "") {
                skippedCount++;
                continue;
            }
            
            /* > Obter EAN e CustomPrice da Linha */
            let productEAN = productInfo.split('/')[0];
            let productCustomPrice = productInfo.split('/')[1] || null;
            
            processedCount++;
            console.log(`\n📦 Processando ${processedCount}/${EANProductsList.length - skippedCount}: EAN ${productEAN}`.blue);
            
            try {
                /* > Descobrir se o Produto existe no Fornecedor (pelo EAN) */
                console.log(`🔍 Verificando produto no fornecedor...`.gray);
                let productFromSupplier = await getProductFromSupplier(productEAN);
                
                if(!productFromSupplier) {
                    console.log(`❌ O Produto com EAN ${productEAN}, não existe no Fornecedor!`.red);
                    await sendMessage(`❌ Produto não encontrado: EAN ${productEAN}`);
                    errorCount++;
                    continue;
                }
                
                console.log(`✅ Produto encontrado: ${productFromSupplier.name || 'Nome não disponível'}`.green);
                
                /* > Obter Preço Final Formatado do Produto (pelo Custom Price ou Sugestão do Fornecedor) */
                productFromSupplier.optFinalPrice = (productCustomPrice) ? 
                    parseFloat(productCustomPrice.replace(/\,/g,''), 10) : 
                    parseFloat(productFromSupplier.pvpr.replace(/\,/g,''), 10);
                
                console.log(`💰 Preço final: €${productFromSupplier.optFinalPrice}`.cyan);
                
                /* > Verificar se o Produto existe na Shopify (pelo EAN) */
                let tempShopifyProduct = shopifyProductsList.find((shopifyProduct) => 
                    shopifyProduct.variants[0].sku === productEAN
                );
                
                /* > Criar ou Atualizar Produto na Shopify */
                if(tempShopifyProduct) {
                    console.log(`🔄 Atualizando produto existente na Shopify...`.yellow);
                    await updateProductFromShopify(shopifyClient, tempShopifyProduct, productFromSupplier);
                    console.log(`✅ Produto atualizado com sucesso!`.green);
                } else {
                    console.log(`➕ Criando novo produto na Shopify...`.yellow);
                    await createProductToShopify(shopifyClient, productFromSupplier);
                    console.log(`✅ Produto criado com sucesso!`.green);
                }
                
                successCount++;
                
                // Rate limiting - pausa entre produtos
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.log(`❌ Erro ao processar o EAN ${productEAN}: ${error.message}`.red);
                errorCount++;
                
                // Enviar notificação de erro para Discord
                try {
                    await sendMessage(`❌ Erro no EAN ${productEAN}: ${error.message}`);
                } catch (discordError) {
                    console.log(`⚠️ Erro ao enviar notificação Discord: ${discordError.message}`.yellow);
                }
            }
        }
        
        /* > Estatísticas finais */
        console.log('\n📊 Sincronização concluída!'.green.bold);
        console.log(`   • Total processados: ${processedCount}`.cyan);
        console.log(`   • Sucessos: ${successCount}`.green);
        console.log(`   • Erros: ${errorCount}`.red);
        console.log(`   • Ignorados (vazios): ${skippedCount}`.yellow);
        console.log(`   • Taxa de sucesso: ${((successCount / processedCount) * 100).toFixed(1)}%`.cyan);
        
        /* > Enviar resumo para Discord */
        try {
            await sendMessage(`🎉 Sincronização concluída!\n📊 Processados: ${processedCount} | ✅ Sucessos: ${successCount} | ❌ Erros: ${errorCount}`);
        } catch (discordError) {
            console.log(`⚠️ Erro ao enviar resumo Discord: ${discordError.message}`.yellow);
        }
        
        /* > 'Limpar' Variáveis */
        shopifyClient = null;
        EANProductsList = null;
        shopifyProductsList = null;
        
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

