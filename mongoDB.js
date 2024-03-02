const mongoose = require('mongoose');
const assert = require('assert');
require('dotenv').config();

// const username = process.env.MONGODB_USERNAME;
const password = process.env.MONGODB_PASSWORD;
const uri = `mongodb+srv://admin-access:${password}@context-ta-data-cluster.ire5hjv.mongodb.net/?retryWrites=true&w=majority&appName=Context-TA-Data-Cluster`;

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    assert((await mongoose.connection.db.command({ ping: 1 })).ok == 1, "ping did not retunrn ok");

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await mongoose.connection.close();
  }
}
run().catch(console.dir);

module.exports.run = run; // Export the run function
