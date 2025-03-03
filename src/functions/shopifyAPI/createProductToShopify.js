require('colors');

async function createProductToShopify(shopifyClient, product) {
    let imageList = product.images.map((image) => {
        return {
            src: image
        }
    });

    let tempStock;
    switch(product.stock) {
        case 'Disponível ( < 10 Un )':
            tempStock = 9;
            break;
        case 'Stock Reduzido ( < 2 Un )':
            tempStock = 1;
            break;
        case 'Disponível ( < 2 Un )':
            tempStock = 1;
            break;
        case 'Brevemente':
            tempStock = 0;
            break;
        case 'Esgotado':
            tempStock = 0;
            break;
        default:
            tempStock = 10;
            break;
    }
    
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
                        inventory_policy: 'deny',
                        inventory_management: 'shopify',
                        inventory_quantity: tempStock,
                    }
                ],
                images: imageList
            }
        }
    });

    if(response) {
        console.log(`> O Produto com EAN ${product.ean} foi criado!`.green);
    } else {
        console.log("========================================".yellow);
        console.log("ERRO (updateProduct) [EAN: ".yellow + product.ean.yellow + "]: ".yellow);
        console.log(error.message.yellow);
        console.log("========================================".yellow);
    }
}

module.exports = createProductToShopify;
