
const puppeteer = require('puppeteer');
const axios = require('axios');
require('dotenv').config({ path: './.env' }); 
const { setTimeout } = require("node:timers/promises"); 
const {defineSecret} = require("firebase-functions/params");
const {onRequest, } = require("firebase-functions/v2/https");
const { Pinecone } = require('@pinecone-database/pinecone');
const { OpenAI } = require('openai');
const FIRE_API_KEY = defineSecret("FIRE_API_KEY");
const pinconeSecret = defineSecret("PINECONE_API_KEY");
const openAISecret = defineSecret("OPENAI_API_KEY");
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { onSchedule } = require('firebase-functions/scheduler');

initializeApp();

//SCRAPE WEBSITE CODE START

//Web scraper only scrapes as much as its first scroll, about 20-30 rows
const db = getFirestore();

exports.scrapeWebsite =  onRequest({ //scheduled with Cloud Scheduler
    memory: '2GiB',
    timeoutSeconds: 120,
    secrets: [FIRE_API_KEY]
  }, async (req, res) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
    });

    deleteCollection(db, 'events', 50);
    console.log("Previous events deleted");

    const page = await browser.newPage();
    await page.goto('https://events.ttu.edu/');

    // Switch to the first iframe
    const iframeElement1 = await page.$('#trumba\\.spud\\.5\\.iframe');
    const iframe1 = await iframeElement1.contentFrame();

    // Click the button to change the view
    await iframe1.click('#tab2');
    await setTimeout(5000); // Wait for the new content to load

    // Switch to the second iframe
    const iframeElement2 = await page.$('#trumba\\.spud\\.6\\.iframe');
    const iframe2 = await iframeElement2.contentFrame();

    // Scrape the table
    const rows = await iframe2.$$('.twSimpleListGroup tr');

    let events = [];
  
    for (const row of rows) {
        try {
            const titleElement = await row.$('.twDescription a');
            const title = await (await titleElement.getProperty('innerText')).jsonValue();
            const link = await (await titleElement.getProperty('href')).jsonValue();
            const when = await (await (await row.$('.twDetailTime')).getProperty('innerText')).jsonValue();
            const location = await (await (await row.$('.twLocation')).getProperty('innerText')).jsonValue();

            // Get description if available
            let description = 'No description available';
            const descriptionElement = await row.$('table:nth-of-type(2) td:nth-of-type(2) p');
            if (descriptionElement) {
                description = await (await descriptionElement.getProperty('innerText')).jsonValue();
            }

            // Make API call to get coordinates
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${location}+Texas+Tech&key=${FIRE_API_KEY.value()}`;
            const response = await axios.get(url);
            const locationData = response.data.results[0]?.geometry?.location || { lat: 'N/A', lng: 'N/A' };

            // Check if the coordinates are for the Texas Tech University location, which does not have an actual location
            if (locationData.lng === -101.8746483 && locationData.lat === 33.5845522) {
                locationData.lat = 'N/A';
                locationData.lng = 'N/A';
            }
  
            const event = {
                event_title: title,
                date: when,
                description: description,
                location: location,
                link: link,
                longitude: locationData.lng,
                latitude: locationData.lat
            };
            events.push(event);
        } catch (error) {
            console.error('Error processing row:', error);
        }
    }
    
    const uniqueEvents = removeDuplicates(events);

    //  Add a timestamp after filtering duplicates for filtering purposes
    for (const event of uniqueEvents) {
      event.timestamp = new Date().toISOString();
        
      await db.collection('events').add(event);
      await setTimeout(1000);
    }
    
     // Send the response back
     res.send(uniqueEvents); 
 
     await browser.close();
});

function removeDuplicates(arr) {
    const uniqueArr = arr.map(event => JSON.stringify(event)); // Convert objects to strings
    const uniqueSet = new Set(uniqueArr);
    return Array.from(uniqueSet).map(event => JSON.parse(event)); // Convert back to objects
}

//function to delete collections, primarily used for event collection deletion
async function deleteCollection(db, collectionPath, batchSize) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db, query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    resolve();
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}


//SCRAPE WEBSITE CODE END

//OPENAI - PINECONE CODE START


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

exports.getQuery = onRequest({cors: true, secrets: [pinconeSecret, openAISecret], memory: "512MiB", timeoutSeconds: 300}, async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
      // Send response to OPTIONS requests
      res.set('Access-Control-Allow-Methods', 'GET, POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Max-Age', '3600');
      res.status(204).send('');
    } else {
      try {
        const message = req.body.message;
  
        if (!message) {
          return res.status(400).json({error: 'Message is required.'});
        }
  
        const response = await chatbotQuery(message, pinconeSecret.value(), openAISecret.value())
        
        res.status(200).json({
          success: true,
          message: response, // Sending the chatbot's response, not the original message
        });
      } catch (error) {
        console.error("Error processing query:", error);
        res.status(500).json({error: 'Failed to process query.'});
      }
    }
  });

  //OPENAI - PINECONE CODE END