require('dotenv').config();
const axios = require('axios');

async function getProductFromSupplier(productEAN) {
    try {
        let finalResult = await axios.get('https://www.suprides.pt/rest/V1/integration/products-list?', {
            params: {
                user: process.env.API_USER,
                password: process.env.API_PASSWORD,
                EAN: productEAN,
            },
            headers: {
                'Authorization': 'Bearer ' + process.env.API_TOKEN,
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            if (response.data.length !== 0) {
                const product = response.data[0];
                
                // Debug logging para verificar dados recebidos
                console.log('✅ Produto encontrado na API:', product.name);
                console.log('📦 Stock recebido da API:', product.stock);
                console.log('🏷️ Marca:', product.brand);
                console.log('📋 Dados completos:', JSON.stringify(product, null, 2));
                
                // Verificar se o campo stock existe
                if (!product.stock) {
                    console.log('⚠️ AVISO: Campo stock não encontrado na resposta da API');
                    product.stock = 'Dados não disponíveis';
                }
                
                return product;
            } else {
                console.log('❌ Produto não encontrado na API para EAN:', productEAN);
                return false;
            }
        });
        
        return finalResult;
        
    } catch (error) {
        console.log('🚨 ERRO na API do fornecedor:', error.message);
        return false;
    }
}

module.exports = getProductFromSupplier;
