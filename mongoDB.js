const mongoose = require('mongoose');
const assert = require('assert');
require('dotenv').config();
const { connectToDatabase } = require('./mongoose');

const username = process.env.MONGODB_USERNAME;
const password = process.env.MONGODB_PASSWORD;
const uri = `mongodb+srv://${username}:${password}@context-ta-data-cluster.ire5hjv.mongodb.net/?retryWrites=true&w=majority&appName=Context-TA-Data-Cluster`;

async function run() {
  try {
    await connectToDatabase();
  } finally {
  }
}
run().catch(console.dir);

module.exports.run = run; // Export the run function
