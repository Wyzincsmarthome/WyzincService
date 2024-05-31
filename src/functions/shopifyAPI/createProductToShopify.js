require('colors');

async function createProductToShopify(shopifyClient, product) {
    const response = await shopifyClient.post(`/products`, {
        data: {
            product: {
                title: product.name,
                body_html: product.short_description + "\n \n" + product.description,
                product_type: product.family,
                status: 'active',
                variants: [
                    {
                        price: product.optFinalPrice,
                        sku: product.ean,
                        position: 1,
                    }
                ],
                images: product.images.map((image) => {
                    return {
                        src: image.url,
                        position: image.position
                    }
                })
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

module.exports = createProductToShopify;
