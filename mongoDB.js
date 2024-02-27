// Am I using GPT COPILOT OR SUPERMAVEN?

const mongoose = require('mongoose');

const connectToDatabase = async () => {
  const uri = 'mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');
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

module.exports = { connectToDatabase, getUser, createUser, updateUser, deleteUser };