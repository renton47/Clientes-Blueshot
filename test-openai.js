const { OpenAI } = require('openai');
const fs = require('fs');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

async function main() {
    const openai = new OpenAI();
    try {
        const models = await openai.models.list();
        const dalle3 = models.data.find(m => m.id === 'dall-e-3');
        const dalle2 = models.data.find(m => m.id === 'dall-e-2');
        console.log('dall-e-3 found:', !!dalle3);
        console.log('dall-e-2 found:', !!dalle2);
    } catch (e) {
        console.error(e.message);
    }
}
main();
