const express = require('express');
const { callOpenAIStream } = require('./openAI');
const { connectToDatabase, closeDatabaseConnection} = require('./mongoose');
const { loadSecretsIntoEnv }  = require('./secrets');

const {validateAccessToken} = require('./middleware/auth0.middleware');
const { errorHandler } = require("./middleware/error.middleware");
const notFoundHandler = require("./middleware/not-found.middleware");

const { Server } = require('ws');
const http = require('http');
const cors = require('cors');

const { expressjwt: jwt } = require("express-jwt");
const jwksRsa = require('jwks-rsa');
require('dotenv').config();

const app = express();

const server = http.createServer(app);
const wss = new Server({ server });
app.use(express.json());

(async () => {
  await loadSecretsIntoEnv();
})();

console.log('\x1b[31m%s\x1b[0m', process.env.TEST_THAT_LOAD_WORKS);

// SCOPES
const VIEW_HISTORY_SCOPE = 'read:history';

// SET UP THE SERVER CONFIGURATION

const corsOptions = {
    origin: [
      'http://localhost:5173',
      'https://context-asa06jm4w-envoy-intelligence.vercel.app',
      'https://context-fiq8a0eob-envoy-intelligence.vercel.app', // Removed the trailing slash here
      'https://context-ta.com'
    ],
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  };

app.use(cors(corsOptions));

// AUTH0 CONFIGURATION
const authConfig = {
    domain: process.env.AUTH0_DOMAIN,
    audience: process.env.AUTH0_AUDIENCE
};
  
// JWT MIDDLEWARE TO VALIDATE ACCESS TOKENS
const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
    }),
    audience: authConfig.audience,
    issuer: `https://${authConfig.domain}/`,
    algorithms: ['RS256']
});

// MIDDLEWARE TO CHECK FOR SCOPE (OPTIONAL) RN NO NEED FOR ACCESS TOKENS BUT JUST IN CASE
const checkScope = (requiredScope) => {
    return (req, res, next) => {
        const { scope } = req.user;
        if (scope && scope.includes(requiredScope)) {
            next();
        } else {
            res.status(403).send('Insufficient scope');
        }
    };
};

// Helper function to extract unique user ID from the JWT
const getUserIdFromToken = (req) => {
    userId = req.auth.payload.sub;
    return userId;
};

// API SERVER CODE. RN JUST ROUTES

app.get('/', (req, res) => {
    console.log('Naviagated to homepage');
    res.send('API Health Check Successful\n');
});

// SECURE ALL ROUTES (except health check \ which we use for load balancer)
app.use(validateAccessToken);
//--------------------------------------------

app.get('/about', (req, res) => {
    res.status(500).send('About');
});

app.get('/contact', (req, res) => {
    res.download('');
});

app.get('/api', (req, res) => {
    const userId = getUserIdFromToken(req);
    res.send(`Calling the API from ${userId}!`);
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

// NEW HISTORY ROUTE
// Assuming you have a function to extract the user ID from the JWT

// app.get('/history/:documentId', checkJwt, async (req, res) => {
//     const userIdFromToken = getUserIdFromToken(req);
//     const { documentId } = req.params;

//     try {
//         // Find the user by the ID from the JWT
//         const user = await User.findOne({ userId: userIdFromToken }).exec();
//         if (!user) {
//             return res.status(404).send('User not found.');
//         }

//         // Check if the document belongs to the user
//         const documentMetadata = await DocumentMetadata.findOne({
//             _id: documentId,
//             documentHash: { $in: user.documents }
//         }).populate({
//             path: 'conversations',
//             populate: {
//             path: 'conversationEntries'
//             }
//         }).exec();

//         if (!documentMetadata) {
//             return res.status(404).send('Document not found or access denied.');
//         }

//         // Send the conversations as the response
//         res.json(documentMetadata.conversations);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server error');
//     }
// });

process.on('SIGINT', async () => {
    await closeDatabaseConnection();
    process.exit(0);
});

// WEBSOCKET SERVER CODE
// TODO SECURE THE WEBSOCKET WITH TOKEN!!!

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

// ERROR HANDLING MIDDLEWARE
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`\x1b[32mServer running on port ${PORT}\x1b[0m`);
});