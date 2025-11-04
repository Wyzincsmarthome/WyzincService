require('dotenv').config();
require('colors');

const fs = require('fs');
const { getProductFromSupplier } = require('./functions/supplierAPI');
const {
  createAuth,
  // getAllProductsFromShopify,  // já não usamos aqui diretamente
  updateProductFromShopify,
  createProductToShopify
} = require('./functions/shopifyAPI');
const { sendMessage } = require('./functions/discordAPI');

/**
 * Helpers
 */
function readEansFromFile(productsListPath = 'src/productsList.txt') {
  if (!fs.existsSync(productsListPath)) {
    throw new Error(`Ficheiro ${productsListPath} não encontrado`);
  }
  const productsListContent = fs.readFileSync(productsListPath, 'utf8');
  let list;
  if (productsListContent.trim().startsWith('[')) {
    // Formato JSON: ["123","456", ...]
    list = JSON.parse(productsListContent);
    if (!Array.isArray(list)) throw new Error('productsList.txt em JSON inválido: esperado array');
    list = list.map(x => String(x).trim()).filter(x => x.length > 0 && /^[0-9]+$/.test(x));
  } else {
    // Um EAN por linha
    list = productsListContent
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0 && /^[0-9]+$/.test(line));
  }
  return Array.from(new Set(list)); // remove duplicados
}

function asBool(val, def = false) {
  if (val === undefined || val === null || val === '') return def;
  return String(val).toLowerCase() === 'true';
}

/**
 * Envelopes de segurança
 */
function logPayloadPreview(obj) {
  try {
    return JSON.stringify(obj, (k, v) => {
      if (k.toLowerCase().includes('token') || k.toLowerCase().includes('password')) return '***';
      return v;
    });
  } catch {
    return '[unserializable]';
  }
}

async function safeUpdate(shopifyClient, payload, { dryRun }) {
  if (dryRun) {
    console.log(`[DRY_RUN] updateProductFromShopify -> ${logPayloadPreview({ ean: payload?.ean, sku: payload?.sku, price: payload?.pvpr, stock: payload?.stock })}`.yellow);
    return { dryRun: true };
  }
  return updateProductFromShopify(shopifyClient, payload);
}

async function safeCreate(shopifyClient, payload, { dryRun }) {
  if (dryRun) {
    console.log(`[DRY_RUN] createProductToShopify -> ${logPayloadPreview({ ean: payload?.ean, title: payload?.title, sku: payload?.sku, price: payload?.pvpr, stock: payload?.stock })}`.yellow);
    return { dryRun: true };
  }
  return createProductToShopify(shopifyClient, payload);
}

/**
 * Estratégia:
 *  - Para cada EAN:
 *    1) obter dados do fornecedor (getProductFromSupplier(ean))
 *    2) tentar update; se não existir, criar
 *  - A função getProductFromSupplier deve devolver objeto com:
 *    { ean, sku, title, description, brand, pvpr, stock, ... }
 *  - A lógica de match no Shopify deve usar barcode == EAN (idempotência)
 */
async function upsertByEans(shopifyClient, eans, { dryRun = true } = {}) {
  let processed = 0, success = 0, errors = 0, skipped = 0;

  for (const ean of eans) {
    processed++;
    try {
      console.log(`\n▶️  EAN ${ean}`.cyan);

      const sup = await getProductFromSupplier(ean);
      if (!sup) {
        console.log(`   ↪️ Sem dados do fornecedor para ${ean}. Ignorado.`.yellow);
        skipped++;
        continue;
      }

      // Normalizações mínimas
      sup.ean = String(sup.ean || ean);
      sup.sku = String(sup.sku || sup.ean);
      // pvpr e stock default a 0 para evitar NaN
      sup.pvpr = Number(sup.pvpr || 0);
      sup.stock = Number.isFinite(Number(sup.stock)) ? Number(sup.stock) : 0;

      // 1) Tenta atualizar existente (por barcode==EAN dentro do helper)
      try {
        await safeUpdate(shopifyClient, sup, { dryRun });
        console.log(`   ✅ Atualizado por EAN ${ean}`.green);
        success++;
        continue;
      } catch (updateErr) {
        // Se o helper sinalizar "não encontrado", tentamos criar
        const msg = String(updateErr?.message || updateErr);
        const notFound =
          msg.includes('not found') ||
          msg.includes('NOT_FOUND') ||
          msg.includes('No variant found for barcode') ||
          msg.includes('Variant not found');

        if (!notFound) {
          // Erro real de update que não é "não encontrado"
          console.log(`   ⚠️ Falha no update ${ean}: ${msg}`.yellow);
        } else {
          console.log(`   ℹ️ Produto inexistente para ${ean}, a criar...`.white);
        }

        // 2) Criar produto novo
        try {
          await safeCreate(shopifyClient, sup, { dryRun });
          console.log(`   🆕 Criado por EAN ${ean}`.green);
          success++;
          continue;
        } catch (createErr) {
          console.log(`   ❌ Falha ao criar ${ean}: ${String(createErr?.message || createErr)}`.red);
          errors++;
          continue;
        }
      }
    } catch (e) {
      console.log(`   ❌ Erro ao processar ${ean}: ${String(e?.message || e)}`.red);
      errors++;
    }
  }

  return { processed, success, errors, skipped };
}

async function executeAsyncTask() {
  try {
    console.log('🚀 Iniciando sincronização de produtos...'.green);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`.cyan);

    // Controlo de execução
    const DRY_RUN = asBool(process.env.DRY_RUN, true);
    console.log(`🔒 DRY_RUN: ${DRY_RUN ? 'ON' : 'OFF'}`.yellow);

    /* > Criar Cliente Shopify */
    console.log('🔗 Criando cliente Shopify...'.yellow);
    let shopifyClient = await createAuth();

    /* > Ler lista de EANs */
    console.log('📄 Lendo lista de produtos...'.yellow);
    const EANProductsList = readEansFromFile('src/productsList.txt');

    if (EANProductsList.length === 0) {
      console.log('[INFO] Lista de EANs vazia. Nada a fazer.'.yellow);
      await sendMessage?.('ℹ️ Sync: lista de EANs vazia. Sem operações.');
      return {
        processed: 0, success: 0, errors: 0, skipped: 0
      };
    }

    console.log(`📊 ${EANProductsList.length} produtos encontrados na lista`.cyan);

    /* > Upsert apenas para os EANs indicados */
    console.log('🛍️ Sincronizando no Shopify pelos EANs fornecidos...'.yellow);
    const result = await upsertByEans(shopifyClient, EANProductsList, { dryRun: DRY_RUN });

    /* > Estatísticas finais */
    console.log('\n📊 Sincronização concluída!'.green.bold);
    console.log(`   • Total processados: ${result.processed}`.cyan);
    console.log(`   • Sucessos: ${result.success}`.green);
    console.log(`   • Erros: ${result.errors}`.red);
    console.log(`   • Ignorados: ${result.skipped}`.yellow);
    console.log(`   • Taxa de sucesso: ${((result.success / Math.max(result.processed - result.skipped, 1)) * 100).toFixed(1)}%`.cyan);

    /* > Enviar resumo para Discord */
    try {
      await sendMessage(`🎉 Sincronização concluída!\n📊 Processados: ${result.processed} | ✅ Sucessos: ${result.success} | ❌ Erros: ${result.errors} | 💤 Ignorados: ${result.skipped} | DRY_RUN=${DRY_RUN}`);
    } catch (discordError) {
      console.log(`⚠️ Erro ao enviar resumo Discord: ${discordError.message}`.yellow);
    }

    /* > 'Limpar' Variáveis */
    shopifyClient = null;

    console.log('🏁 Processo finalizado com sucesso!'.green.bold);
    return result;

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

// Executar apenas uma vez e terminar (GitHub Actions controla o agendamento)
executeAsyncTask()
  .then(() => {
    console.log('✅ Sincronização executada com sucesso!'.green);
    process.exit(0);
  })
  .catch((error) => {
    console.log(`❌ Erro na execução: ${error.message}`.red);
    process.exit(1);
  });
