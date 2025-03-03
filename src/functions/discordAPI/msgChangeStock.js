require('colors');
require('dotenv').config();
const axios = require('axios');
const { DISCORD_USER_ID, DISCORD_WEBHOOK_CONTACT } = process.env;

async function msgChangeStock(productEAN, message) {
    if(!DISCORD_WEBHOOK_CONTACT) return;

    axios({
        method: 'POST',
        url: DISCORD_WEBHOOK_CONTACT,
        headers: { 'Content-Type': 'application/json' },
        data: {
            //content: `||<@${DISCORD_USER_ID}>||`,
            embeds: [{
                title: `Alteração Necessário no Produto com EAN **\`${productEAN}\`**!`,
                color: 0xEFF707,
                fields: [
                    {
                        name: '',
                        value: '➜ ' + message
                    }
                ]
            }]
        }
    }).then((response) => {
        console.log(`> Notificação Enviada!`.green);
    }).catch((error) => {
        console.log("========================================".yellow);
        console.log("ERRO (msgChangeStock) [EAN: ".yellow + productEAN.yellow + "]: ".yellow);
        console.log(error.message.yellow);
        console.log("========================================".yellow);
    });
}

module.exports = msgChangeStock;