async function getAllProductsFromShopify(shopifyClient) {
    const response = await shopifyClient.get("/products");

    let finalResult;
    (response) ? finalResult = await response.json() : finalResult = null;

    return finalResult.products;
}

module.exports = getAllProductsFromShopify;