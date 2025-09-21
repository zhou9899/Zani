import dotenv from 'dotenv';
dotenv.config();
import Groq from 'groq-sdk';

const key = process.env.GROQ_API_KEY || process.env.GROQ_API_KEYS?.split(',')[0];

if (!key) {
  console.error('❌ No Groq API key found in environment variables.');
  process.exit(1);
}

const client = new Groq({ apiKey: key });

async function testGroqKey() {
  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    });
    console.log('✅ Groq API key is valid! Response:', completion.choices?.[0]?.message?.content);
  } catch (error) {
    console.error('❌ Groq API key test failed:', error.message);
  }
}

testGroqKey();
