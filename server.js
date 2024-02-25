const express = require('express');
const app = express();

const cors = require('cors');

// SET UP THE SERVER CONFIGURATION

const corsOptions = {
  origin: ['http://localhost:5713', 'https://context-asa06jm4w-envoy-intelligence.vercel.app'],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.listen(3000, () => console.log('\x1b[32m', 'Server is successfully running on port 3000', '\x1b[0m'));

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