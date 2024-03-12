const mongoose = require('mongoose');
const util = require('util');
const assert = require('assert');
const { v4: uuidv4 } = require('uuid');
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
  conversations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }]
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
  conversationId: { type: String, required: true, unique: true},
  mostRecentTimestamp: Date,
  textSelectionId: String,
  scaledPosition: Number,
  conversationEntries: [ConversationEntrySchema]
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

// UTILS

// Utility to create a unique userId
const generateUserId = () => {
  // Generate a UUID and then modify it to the desired format
  return uuidv4().substring(0, 23);
};

// Utility to create a unique conversationId
const generateConversationId = () => {
  // Generate a UUID and then modify it to the desired format
  return uuidv4().substring(0, 23);
};

// Function to check uniqueness in the collection and regenerate if necessary
const ensureUniqueUserId = async () => {
  let unique = false;
  let userId;
  while (!unique) {
    userId = generateUserId();
    const userExists = await User.findOne({ userId: userId }).exec();
    unique = !userExists;
  }
  return userId;
};

const ensureUniqueConversationId = async () => {
  let unique = false;
  let conversationId;
  while (!unique) {
    conversationId = generateConversationId();
    const conversationExists = await Conversation.findOne({ conversationId: conversationId }).exec();
    unique = !conversationExists;
  }
  return conversationId;
};

const deleteDatabaseDANGEROUS = async () => {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
      await db.collection(collection.name).drop();
    }

    console.log('All collections dropped and database deleted.');
  } catch (error) {
    console.error('Error deleting database:', error);
  } finally {
    await closeDatabaseConnection();
  }
};


// CRUD OPERATIONS

const getUser = async (_id) => {
  const user = await User.findById(_id);
  return user;
};

// Important distinction—using our custom userId, not the _id
const getUserByUserId = async (userId) => {
  const user = await User.findOne({
    userId: userId
  });
  return user;
};

// This works, just tested.
const getUserPopulated = async (_id) => {
  const user = await User.findById(_id)
    .populate({
      path: 'documents',
      populate: {
        path: 'conversations',
        model: 'Conversation',
        populate: {
          path: 'conversationEntries',
        }
      }
    });
  return user;
}

const createUser = async (user) => {
  const newUser = new User(user);
  await newUser.save();
  return newUser;
};

// Function to add a document metadata to a user
const addDocumentToUser = async (userId, documentData) => {
  const user = await User.findById(userId);
  const documentMetadata = new DocumentMetadata(documentData);
  await documentMetadata.save();
  user.documents.push(documentMetadata._id);
  await user.save(); // This should trigger the middleware to check for duplicate documentHashes
  return documentMetadata;
};

// Function to create a new conversation on the document metadata
// Works as checked by async()
const attachNewConversation = async (documentId, conversationData) => {
  const documentMetadata = await DocumentMetadata.findById(documentId);
  const conversation = new Conversation(conversationData);
  await conversation.save();
  documentMetadata.conversations.push(conversation._id);
  await documentMetadata.save();
  return conversation;
};

// Function to update a conversation by adding conversation entries
const updateConversation = async (conversationId, entryData) => {
  // const conversation = await Conversation.findOne({conversationId: conversationId});
  const conversation = await Conversation.findOne(conversationId);
  conversation.conversationEntries.push(entryData);
  conversation.mostRecentTimestamp = new Date(); // Update the most recent timestamp
  await conversation.save();
  return conversation;
};


const getAllConversationsFromUser = async (userId) => {
  try {
    await connectToDatabase();
    // Find the user by their custom userId and populate the nested paths
    const userWithConversations = await User.findOne({ userId: userId })
      .populate({
        path: 'documents',
        populate: {
          path: 'conversations',
          model: 'Conversation',
          populate: {
            path: 'conversationEntries',
          }
        }
      });

    if (!userWithConversations) {
      console.log('User not found');
      return null;
    }

    // Extract the conversations from the populated user document
    const conversations = userWithConversations.documents.map(doc => doc.conversations);

    // Log or process the conversations as needed
    console.log('Conversations:', conversations.map(conversation => {
      util.inspect(conversation, { showHidden: false, depth: null, colors: true });
      if (conversation.conversationEntries) {
        console.log('Number of conversation entries:', conversation.conversationEntries.length);
      } else {
        console.log('No conversation entries found or conversation is undefined');
      }
      // conversation.conversationEntries.forEach(entry => {
      //   console.log(util.inspect(entry, { showHidden: false, depth: null, colors: true }));
      // });
  
    }
    ));
    return conversations;
  } catch (error) {
    console.error('Error getting conversations from user:', error);
    throw error;
  } finally {
    await closeDatabaseConnection();
  }
};

// TESTING
const printDatabaseContents = async () => {
  await connectToDatabase();

  // Get all collections
  const collections = await mongoose.connection.db.listCollections().toArray();

  for (const collection of collections) {
    console.log(`Collection: ${collection.name}`);
    const documents = await mongoose.connection.db.collection(collection.name).find({}).toArray();
    console.log(documents);
  }

  await closeDatabaseConnection();
};

// Test the functionality at the end
const testFunctionality = async () => {
  try {

    await connectToDatabase();

    // CREATING TEST OBJECTS, PUTTING THEM IN THE DATABASE

    // Create a new user
    const user = await createUser({
      userId: await ensureUniqueUserId(),
      name: 'TESTER FOR LONG CONVO',
      email: 'john.doe@example.com'
    });

    console.log('User created:', user);

    // Add a new document metadata to the user
    const documentMetadata = await addDocumentToUser(user._id, {
      documentHash: 'docHash123',
      title: 'Test Document'
    });

    console.log('Document metadata added:', documentMetadata);
    console.log('User with document:', await getUser(user._id));

    // Create a new conversation on the document metadata
    const conversation = await attachNewConversation(documentMetadata._id, {
      conversationId: await ensureUniqueConversationId(),
      mostRecentTimestamp: new Date(),
      textSelectionId: 'text123',
      scaledPosition: 1,
      conversation: []
    });

    // Update the conversation by adding conversation entries
    const updatedConversation = await updateConversation(conversation._id, {
      entity: 'User',
      response: 'Hello!',
      timestamp: new Date()
    });

    console.log('Updated conversation:', updatedConversation);
    console.log('User with document and conversation:', util.inspect(await getUserPopulated(user._id), { showHidden: false, depth: null, colors: true }));

    console.log('ensureUniqueUserId:', await ensureUniqueUserId());
    console.log('ensureUniqueConversationId:', await ensureUniqueConversationId());


  } catch (error) {
    console.error(error);
  } finally {
    await closeDatabaseConnection();
  }
}

const testConversationContinuity = async () => {
  try {
    await connectToDatabase();
    const userId = '80a2892a-8948-4d7e-854f';
    let user = await getUserByUserId(userId);
    if (!user) {
      console.log('User not found');
    } else {
      // Assuming the user has at least one document and one conversation
      const documentId = user.documents[0];
      const documentMetadata = await DocumentMetadata.findById(documentId);
      const conversationId = documentMetadata.conversations[0];

      for (let i = 1; i <= 3; i++) {
        const entity = i % 2 === 0 ? 'AI' : 'User';
        const response = `Hello ${i}!`;
        const updatedConversation = await updateConversation(conversationId, {
          entity: entity,
          response: response,
          timestamp: new Date()
        });

        // Re-fetch the user to get updated conversations
        user = await getUserPopulated(user._id);
        console.log(`Conversation on ${i} update:`, updatedConversation);
        console.log(`User with document and conversation ${i} update:`, util.inspect(user, { showHidden: false, depth: null, colors: true }));
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await closeDatabaseConnection();
  }
}

// RUNNING TESTS
// mongoose.set('debug', true);
// testFunctionality();
// printDatabaseContents();
// testConversationContinuity();
// (async () => {
//   try {
//     await connectToDatabase();
//     let user = await getUserPopulated('65f0be75a174202f9cf24920');
//     let dcomes = user.documents[0];
//     await attachNewConversation(dcomes, {
//       conversationId: await ensureUniqueConversationId(),
//       mostRecentTimestamp: new Date(),
//       textSelectionId: 'text123',
//       scaledPosition: 1,
//       conversation: []
//     });
//     // console.log('User:', user);
//     // console.log (util.inspect(user, { showHidden: false, depth: null, colors: true }));
//     await testConversationContinuity();
//     await closeDatabaseConnection();
//   } catch (error) {
//     await closeDatabaseConnection();
//     console.error('Failed to connect to the database:', error);
//   }
// })();
getAllConversationsFromUser('80a2892a-8948-4d7e-854f');

module.exports = { connectToDatabase, closeDatabaseConnection, ensureUniqueConversationId, ensureUniqueUserId, getUser, createUser, addDocumentToUser, attachNewConversation, updateConversation};