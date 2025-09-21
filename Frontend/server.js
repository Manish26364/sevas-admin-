const express = require('express');
const { MongoClient } = require('mongodb');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const app = express();

// ====== CONFIG ======
// MongoDB Atlas connection string (added &ssl=true for TLS)
const MONGO_URI = 'mongodb+srv://Manish1:Manish%401@cluster0.naa9gjp.mongodb.net/laundrySystem?retryWrites=true&w=majority&appName=Cluster0&ssl=true';
const DB_NAME = 'laundrySystem';

// ====== MIDDLEWARE ======
app.use(express.json());
app.use(express.static('.'));

// Session store in MongoDB (with TLS options)
const store = new MongoDBStore({
  uri: MONGO_URI,
  collection: 'sessions',
  connectionOptions: {
    ssl: true,
    sslValidate: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
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
const client = new MongoClient(MONGO_URI, {
  ssl: true,
  sslValidate: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connectDB() {
  if (!client.topology?.isConnected()) {
    await client.connect();
    console.log('Connected to MongoDB Atlas!');
  }
  return client.db(DB_NAME);
}

// ====== INIT DEFAULT DATA ======
async function initDB() {
  const db = await connectDB();
  const bookings = db.collection('bookings');
  const machines = db.collection('machines');
  const residents = db.collection('residents');
  const settings = db.collection('settings');
  const users = db.collection('users');

  if (await bookings.countDocuments() === 0) {
    await bookings.insertMany([
      { id: '1', machine: 'Washer 1', time: '10:00', user: 'Bob', isMaintenance: false },
      { id: '2', machine: 'Dryer 2', time: '11:00', user: 'Alice', isMaintenance: false }
    ]);
  }
  if (await machines.countDocuments() === 0) {
    await machines.insertMany([
      { name: 'Washer 1', status: 'busy', usage: 2 },
      { name: 'Washer 2', status: 'free', usage: 0 },
      { name: 'Dryer 1', status: 'free', usage: 0 },
      { name: 'Dryer 2', status: 'busy', usage: 1 }
    ]);
  }
  if (await residents.countDocuments() === 0) {
    await residents.insertMany([
      { id: '1', name: 'Bob', email: 'bob@email.com', room: '101', blocked: false },
      { id: '2', name: 'Alice', email: 'alice@email.com', room: '102', blocked: false }
    ]);
  }
  if (await settings.countDocuments() === 0) {
    await settings.insertOne({
      bookingDuration: 2,
      maxBookings: 3,
      maxDaysAhead: 7
    });
  }
  if (await users.countDocuments() === 0) {
    await users.insertOne({
      username: '1',
      password: '1' // plaintext, use bcrypt in production
    });
  }
}

initDB().catch(console.error);

// ====== AUTH MIDDLEWARE ======
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(401).send('Please log in!');
  }
}

// ====== ROUTES ======
// (everything below stays the same as your original code)

// ====== START SERVER ======
app.listen(3000, () => {
  console.log('Magic robot is running on port 3000!');
});
