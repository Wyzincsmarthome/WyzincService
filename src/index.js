require('dotenv').config();
require('colors');

// Para usar render sem precisar pagar:
const express = require('express');
const app = express();
app.get('/', (req, res) => { res.send('Hello World!') });
app.listen(3000, () => console.log('Server Running on Port 3000!'));

const fs = require('fs');
const { getProductFromSupplier } = require('./functions/supplierAPI');
const { createAuth, getAllProductsFromShopify, updateProductFromShopify, createProductToShopify } = require('./functions/shopifyAPI');
const { sendMessage } = require('./functions/discordAPI');

async function executeAsyncTask () {
    /* > Criar Cliente Shopify */
    let shopifyClient = await createAuth();

    /* > Obter Lista de EANs (do TXT) */
    let EANProductsList = fs.readFileSync('src/productsList.txt', { encoding: 'utf8', flag: 'r' }).split('\n');
    
    /* > Obter Lista de Produtos (da Shopify) */
    let shopifyProductsList = await getAllProductsFromShopify(shopifyClient);

    for(let productInfo of EANProductsList) {
        if(productInfo === "") return;
        
        /* > Obter EAN e CustomPrice da Linha */
        let productEAN = productInfo.split('/')[0];
        let productCustomPrice = productInfo.split('/')[1] || null;

        /* > Descobrir se o Produto existe no Fornecedor (pelo EAN) */
        let productFromSupplier = await getProductFromSupplier(productEAN);
        if(!productFromSupplier) { console.log(`> O Produto com EAN ${productEAN}, não existe no Fornecedor!`.red); sendMessage(productEAN); continue; }

        /* > Obter Preço Final Formatado do Produto (pelo Custom Price ou Sugestão do Fornecedor) */
        productFromSupplier.optFinalPrice = (productCustomPrice) ? formattedPrice = parseFloat(productCustomPrice.replace(/\,/g,''), 10) : formattedPrice = parseFloat(productFromSupplier.pvpr.replace(/\,/g,''), 10);

        /* > Verificar se o Produto existe na Shopify (pelo EAN) */
        let tempShopifyProduct = shopifyProductsList.find((shopifyProduct) => shopifyProduct.variants[0].sku === productEAN);

        /* > Criar ou Atualizar Produto na Shopify */      
        (tempShopifyProduct) ? await updateProductFromShopify(shopifyClient, tempShopifyProduct, productFromSupplier) : await createProductToShopify(shopifyClient, productFromSupplier);
    }
    
    /* > 'Limpar' Variáveis */
    shopifyClient = null;
    EANProductsList = null;
    shopifyProductsList = null;
}

executeAsyncTask();
setInterval(function(){
    executeAsyncTask();
    console.log("> - - - - - - - - - - - - - <");
}, 1000 * 60 * 60 * 3); //3h
