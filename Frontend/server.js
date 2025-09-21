const express = require('express');
const { MongoClient } = require('mongodb');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const app = express();

// ====== CONFIG ======
// MongoDB Atlas connection string (using &tls=true for modern driver)
const MONGO_URI = 'mongodb+srv://Manish1:Manish%401@cluster0.naa9gjp.mongodb.net/laundrySystem?retryWrites=true&w=majority&appName=Cluster0&tls=true';
const DB_NAME = 'laundrySystem';

// ====== MIDDLEWARE ======
app.use(express.json());
app.use(express.static('.'));

// Session store in MongoDB
const store = new MongoDBStore({
  uri: MONGO_URI,
  collection: 'sessions'
});

store.on('error', function (error) {
  console.error('Session store error:', error);
});

app.use(session({
  secret: 'laundrysync-secret-key',
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
}));

// ====== DB CONNECTION ======
const client = new MongoClient(MONGO_URI);

async function connectDB() {
  if (!client.topology?.isConnected()) {
    await client.connect();
    console.log('Connected to MongoDB Atlas!');
  }
  return client.db(DB_NAME);
}
