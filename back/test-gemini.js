const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent("hello");
    console.log("gemini-1.5-flash:", result.response.text());
  } catch (e) {
    console.log("Error 1.5-flash:", e.message);
  }
  
  try {
    const model2 = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result2 = await model2.generateContent("hello");
    console.log("gemini-1.5-flash-latest:", result2.response.text());
  } catch (e) {
    console.log("Error 1.5-flash-latest:", e.message);
  }

  try {
    const model3 = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result3 = await model3.generateContent("hello");
    console.log("gemini-pro:", result3.response.text());
  } catch (e) {
    console.log("Error pro:", e.message);
  }
}
test();
