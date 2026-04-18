const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(data.models.map(m => m.name).filter(n => n.includes('flash')));
}
run();
