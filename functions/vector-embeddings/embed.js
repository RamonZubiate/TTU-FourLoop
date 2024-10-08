const { Pinecone } = require('@pinecone-database/pinecone');
const { OpenAI } = require('openai');

// Initialize the embedding pipeline
let embedder;
const getEmbedding = async (text) => {
  if (!embedder) {
    const { pipeline } = await import('@xenova/transformers');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  const result = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(result.data);
};

// Function to initialize Pinecone and OpenAI clients
const initializeClients = (pineconeApiKey, openaiApiKey) => {
  const pc = new Pinecone({
    apiKey: pineconeApiKey,
  });
  console.log('Pinecone client initialized');

  const openai = new OpenAI({
    apiKey: openaiApiKey
  });

  return { pc, openai };
};

const queryAndRespond = async (userQuery, pc, openai, topK = 10) => {
  const queryEmbedding = await getEmbedding(userQuery);
  
  const index = pc.Index('quickstart');
  const queryResponse = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true
  });

  // Reassemble chunked responses
  const reassembledResponses = {};
  for (const match of queryResponse.matches) {
    const { orig_id = 'unknown', chunk = '', idx = '0', total = '1' } = match.metadata;
    const parsedIdx = parseInt(idx);
    const parsedTotal = parseInt(total);
    
    if (!reassembledResponses[orig_id]) {
      reassembledResponses[orig_id] = new Array(parsedTotal).fill('');
    }
    
    if (parsedIdx < reassembledResponses[orig_id].length) {
      reassembledResponses[orig_id][parsedIdx] = chunk;
    }
  }

  // Join chunks and prepare context
  const context = Object.entries(reassembledResponses)
    .map(([origId, chunks]) => `Result:\nQuery: ${origId}\nResponse: ${chunks.join('')}`)
    .join('\n\n');

  const prompt = `Given the following user query and search results, provide a concise and relevant answer based on the information in the 'Response' sections. If the information isn't directly available, use the context to infer a helpful response.

    User Query: ${userQuery}

    Search Results:
    ${context}

    Please respond in a conversational manner, directly addressing the user's query with the most relevant information from the search results. If the exact information isn't available, provide the closest relevant details and suggest where the user might find more specific information.`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant providing information based on the Texas Tech University webpage content. Always strive to give direct, actionable information when available." },
      { role: "user", content: prompt }
    ]
  });

  return response.choices[0].message.content;
};

// Exportable function that takes a query and API keys as parameters
const chatbotQuery = async (query, pineconeApiKey, openaiApiKey) => {
  try {
    const { pc, openai } = initializeClients(pineconeApiKey, openaiApiKey);
    const response = await queryAndRespond(query, pc, openai);
    return response;
  } catch (error) {
    console.error("Error:", error.message);
    throw error; // Re-throw the error for the caller to handle
  }
};

module.exports = { chatbotQuery };

// Example usage (commented out):
// chatbotQuery("What are the library hours?", "your-pinecone-api-key", "your-openai-api-key")
//   .then(response => console.log(response))
//   .catch(error => console.error("Error:", error));