const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const key = process.env.GEMINI_API_KEY;

async function run() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=100`;
  const res = await fetch(url);
  const data = await res.json();
  const valid = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent') && m.name.includes('flash'));
  console.log(valid.map(m => m.name));
}
run();
