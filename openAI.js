const OpenAI = require("openai");
require('dotenv').config();

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not defined in environment variables');
}

const openai = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true });

const callOpenAI = async (prompt) => {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "assistant", content: prompt }],
    model: "gpt-4-0125-preview",
  });
  return completion.choices[0].message.content;
}

const callOpenAIStream = async (messages, onChunkReceived) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4-0125-preview",
    messages: messages,
    stream: true,
  });

  for await (const chunk of completion) {
    if (chunk.choices[0].delta && chunk.choices[0].delta.content) {
      onChunkReceived(chunk.choices[0].delta.content);
    }
  }
}

module.exports = { callOpenAI, callOpenAIStream };