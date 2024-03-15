const express = require('express');
const { callOpenAIStream } = require('./openAI');
const { connectToDatabase, closeDatabaseConnection} = require('./mongoose');

const { Server } = require('ws');
const http = require('http');
const cors = require('cors');

const app = express();

const server = http.createServer(app);
const wss = new Server({ server });
app.use(express.json());

// SET UP THE SERVER CONFIGURATION

const corsOptions = {
  origin: ['http://localhost:5713', 'https://context-asa06jm4w-envoy-intelligence.vercel.app', 'https://context-ta.com'],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// API SERVER CODE. RN JUST ROUTES

app.get('/', (req, res) => {
    console.log('Naviagated to homepage');
    res.send('Hello World from (hopefully) lightweight Express Backend \n');
    });

app.get('/about', (req, res) => {
    res.status(500).send('About');
    });

app.get('/contact', (req, res) => {
    res.download('');
});

app.get('/api', (req, res) => {
    res.send('Calling the API');
});

app.get('/test-mongodb-connection', async (req, res) => {
    try {
      // move to a middleware or somewhere called on server start.
      await connectToDatabase();
      res.send('Successfully connected to MongoDB.');
    } catch (error) {
      console.log(error);
      res.status(500).send('Failed to connect to MongoDB.');
    }
  });
  
process.on('SIGINT', async () => {
    await closeDatabaseConnection();
    process.exit(0);
});

// WEBSOCKET SERVER CODE

wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        const { messages } = JSON.parse(message);
        console.log('Received frontend message!: \n', messages);

        const onChunkReceived = (content) => {
            ws.send(JSON.stringify({ content }));
        };

        try {
            await callOpenAIStream(messages, onChunkReceived);
            ws.send(JSON.stringify({ content: 'Stream completed' }));
        } catch (error) {
            ws.send(JSON.stringify({ error: 'Error processing the stream' }));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`\x1b[32mServer running on port ${PORT}\x1b[0m`);
});