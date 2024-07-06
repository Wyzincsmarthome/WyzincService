require('colors');

async function updateProductFromWix(shopifyClient, shopifyProduct, product) {

    let productVariants = shopifyProduct.variants.map((variant) => {
        return {
            id: variant.id,
            title: variant.title,
            price: product.optFinalPrice,
            sku: variant.sku,
            position: variant.position,
            // Sem certeza se estes campos são necessários:
            /*inventory_policy: variant.inventory_policy,
            compare_at_price: variant.compare_at_price,
            fulfillment_service: variant.fulfillment_service,
            inventory_management: variant.inventory_management,
            option1: variant.option1,
            option2: variant.option2,
            option3: variant.option3,
            taxable: variant.taxable,
            barcode: variant.barcode,
            grams: variant.grams,
            weight: variant.weight,
            weight_unit: variant.weight_unit,
            inventory_quantity: variant.inventory_quantity,
            old_inventory_quantity: variant.old_inventory_quantity,
            requires_shipping: variant.requires_shipping,
            image_id: variant.image_id,*/
        }
    });

    const response = await shopifyClient.put(`/products/${shopifyProduct.id}`, {
        data: {
            product: {
                variants: productVariants
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