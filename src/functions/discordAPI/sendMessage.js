require('colors');
require('dotenv').config();
const axios = require('axios');
const { DISCORD_USER_ID, DISCORD_WEBHOOK_CONTACT } = process.env;

async function sendMessage(productEAN) {
    if(!DISCORD_USER_ID || !DISCORD_WEBHOOK_CONTACT) return;

    axios({
        method: 'POST',
        url: DISCORD_WEBHOOK_CONTACT,
        headers: { 'Content-Type': 'application/json' },
        data: {
            //content: `||<@${DISCORD_USER_ID}>||`,
            embeds: [{
                description: `➜ Produto com EAN **\`${productEAN}\`**, não existe no Fornecedor!`,
                color: 0x0039B3,
            }]
        }
    }).then((response) => {
        console.log(`> Notificação Enviada!`.green);
    }).catch((error) => {
        console.log("========================================".yellow);
        console.log("ERRO (sendMessage) [EAN: ".yellow + productEAN.yellow + "]: ".yellow);
        console.log(error.message.yellow);
        console.log("========================================".yellow);
    });
}

module.exports = sendMessage;