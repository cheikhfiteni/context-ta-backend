const express = require('express');
const { callOpenAIStream } = require('./openAI');

const { Server } = require('ws');
const http = require('http');
const cors = require('cors');

const app = express();

const server = http.createServer(app);
const wss = new Server({ server });
app.use(express.json());

// SET UP THE SERVER CONFIGURATION

const corsOptions = {
  origin: ['http://localhost:5713', 'https://context-asa06jm4w-envoy-intelligence.vercel.app'],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// API SERVER CODE. RN JUST ROUTES

app.get('/', (req, res) => {
    console.log('Did');
    res.send('Hello World from (hopefully) lightweight Express Backend');
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