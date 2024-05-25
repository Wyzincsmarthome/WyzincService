require('colors');

async function updateProductFromWix(shopifyClient, shopifyProduct, product) {
    const response = await shopifyClient.put(`/products/${shopifyProduct.id}`, {
        data: {
            product: {
                variants: [
                    {
                        id: shopifyProduct.variants[0].id,
                        price: product.optFinalPrice
                    }
                ]
            }
        }
    });

    if(response) {
        console.log(`> O Produto com EAN ${product.ean} foi atualizado!`.green);
    } else {
        console.log("========================================".yellow);
        console.log("ERRO (updateProduct) [EAN: ".yellow + product.ean.yellow + "]: ".yellow);
        console.log(error.message.yellow);
        console.log("========================================".yellow);
    }
}

module.exports = updateProductFromWix;