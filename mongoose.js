const mongoose = require('mongoose');
const assert = require('assert');
require('dotenv').config();

const username = process.env.MONGODB_USERNAME;
const password = process.env.MONGODB_PASSWORD;

const connectToDatabase = async () => {
  const uri = `mongodb+srv://${username}:${password}@context-ta-data-cluster.ire5hjv.mongodb.net/?retryWrites=true&w=majority&appName=Context-TA-Data-Cluster`;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  assert((await mongoose.connection.db.command({ ping: 1 })).ok == 1, "ping did not return ok");
  console.log("Pinged your deployment. You successfully connected to MongoDB!");
};

const closeDatabaseConnection = async () => {
  await mongoose.connection.close();
  console.log('\nDatabase connection succesfully closed.');
};


// SCHEMAS + MODEL DEFINITIONS

// 
// OVERALL INTENDED SCHEMA
// 
// User: 
//   userId:
//       ∆ document-hash:
//             ∆ conversation-hash:
//                     most_recent_timestamp:
//                     text_selection_id: 
//                     scaled_position:
//                     conversation:  {
//                          ∆ [Entity:  , Response:    ,  Timestamp: ]
//                         }


// Don't need to make this an array because each "document" is a seperate
// object or row in the collection/table and that maintains the unique users
// Populate will define the relationship between the two collections
const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: String,
  email: String,
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DocumentMetadata' }]
});

// Remember DocumentMetadata is unique to each user, but the actual
// document data (indexed by DocumentHash) is shared 
const DocumentMetadataSchema = new mongoose.Schema({
  documentHash: { type: String, required: true },
  title: String,
  conversations: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }
});

const ConversationEntrySchema = new mongoose.Schema({
  entity: String,
  response: String,
  timestamp: Date
});

// Note rn we're inlining ConversationEntry's for atomicity on timestamp
// And speed of retrieval. Note 16mb document/row limit. When we make 
// Conversations jump off from one another, that should be a different conversation
// Schema. Also figure out the best way to index the conversation data.
const ConversationSchema = new mongoose.Schema({
  conversationId: { type: String, required: true },
  mostRecentTimestamp: Date,
  textSelectionId: String,
  scaledPosition: Number,
  conversation: [ConversationEntrySchema]
});



const User = mongoose.model('User', UserSchema);
const DocumentMetadata = mongoose.model('DocumentMetadata', DocumentMetadataSchema);
const Conversation = mongoose.model('Conversation', ConversationSchema);


// MIDDLEWARE

// Middleware to prevent duplicate metadata on same document for a user 
// (but still allowing multiple users to have the same document)
UserSchema.pre('save', async function (next) {
  const user = this;
  // Convert the documents array to a set of hashes to ensure uniqueness
  const documentHashes = new Set(user.documents.map(doc => doc.documentHash));

  if (documentHashes.size !== user.documents.length) {
    // There are duplicate documentHashes
    return next(new Error('Duplicate documentHash found for the user.'));
  }

  next();
});


// Middleware to prevent documents from being deleted if they have conversations
DocumentMetadataSchema.pre('remove', function(next) {
  Conversation.remove({ document: this._id }).exec();
  next();
});

// Middleware to prevent users from being deleted if they have documents
UserSchema.pre('remove', function(next) {
  DocumentMetadata.remove({ user: this._id }).exec();
  next();
});


// CRUD OPERATIONS



















const getUser = async (userId) => {
  const User = mongoose.model('User', new mongoose.Schema({
    userId: String,
    name: String,
    email: String,
    password: String,
  }));

  const user = await User.findById(userId);
  return user;
};

const createUser = async (user) => {
  const User = mongoose.model('User', new mongoose.Schema({
    userId: String,
    name: String,
    email: String,
    password: String,
  }));

  const newUser = new User(user);
  await newUser.save();
  return newUser;
};

const updateUser = async (userId, user) => {
  const User = mongoose.model('User', new mongoose.Schema({
    userId: String,
    name: String,
    email: String,
    password: String,
  }));

  const existingUser = await User.findById(userId);
  existingUser.name = user.name;
  existingUser.email = user.email;
  existingUser.password = user.password;
  await existingUser.save();
  return existingUser;
};

const deleteUser = async (userId) => {
  const User = mongoose.model('User', new mongoose.Schema({
    userId: String,
    name: String,
    email: String,
    password: String,
  }));

  const user = await User.findByIdAndDelete(userId);
  return user;
};

// Test the functionality at the end
// Test the functionality at the end
const testFunctionality = async () => {
  try {

    await connectToDatabase();






  } catch (error) {
    console.error(error);
  } finally {
    await closeDatabaseConnection();
  }
}

testFunctionality();

module.exports = { connectToDatabase, closeDatabaseConnection, getUser, createUser, updateUser, deleteUser };