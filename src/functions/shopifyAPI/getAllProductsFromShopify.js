async function getAllProductsFromShopify(shopifyClient) {
    let response, responseResult, numProducts;
    let finalResult = []

    response = await shopifyClient.get("/products/count");
    numProducts = await response.json();

    let totalPages = Math.ceil(numProducts.count / 50);

    for(let i = 1; i <= totalPages; i++) {
        (i === 1)
            ? response = await shopifyClient.get("/products")
            : response = await shopifyClient.get("/products", { searchParams: { since_id: parseInt(finalResult[finalResult.length - 1].id) } });

        (response) ? responseResult = await response.json() : responseResult = null;

        finalResult.push(...responseResult.products);
    }

    return finalResult;
}

module.exports = getAllProductsFromShopify;
