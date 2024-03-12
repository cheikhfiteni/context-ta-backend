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

module.exports = { connectToDatabase, closeDatabaseConnection, getUser, createUser, updateUser, deleteUser };