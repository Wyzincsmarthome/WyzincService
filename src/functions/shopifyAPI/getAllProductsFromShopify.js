async function getAllProductsFromShopify(shopifyClient) {
    let response, responseResult, numProducts;
    let finalResult = []

    response = await shopifyClient.get("/products/count");
    numProducts = await response.json();

    let totalPages = Math.ceil(numProducts.count / 250);

    for(let i = 1; i <= totalPages; i++) {
        (i === 1)
            ? response = await shopifyClient.get("/products", { searchParams: { limit: 250, since_id: 0 } })
            : response = await shopifyClient.get("/products", { searchParams: { limit: 250, since_id: parseInt(finalResult[finalResult.length - 1].id) } });

        (response) ? responseResult = await response.json() : responseResult = null;

        finalResult.push(...responseResult.products);
    }

    console.log(`Nº Produtos (após /products): ${finalResult.length} // Nº Total (/products/count): ${numProducts.count}`);
    return finalResult;
}

module.exports = getAllProductsFromShopify;
