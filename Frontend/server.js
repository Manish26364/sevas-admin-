const express = require('express');
const { MongoClient } = require('mongodb');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const app = express();

// ====== CONFIG ======
// Use your MongoDB Atlas connection string
const MONGO_URI = 'mongodb+srv://Manish1:Manish%401@cluster0.naa9gjp.mongodb.net/laundrySystem?retryWrites=true&w=majority&appName=Cluster0';
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

// Login
app.post('/login', async function (req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Username and password required!');
    const db = await connectDB();
    const user = await db.collection('users').findOne({ username, password });
    if (user) {
      req.session.user = username;
      res.json({ success: true });
    } else {
      res.status(401).send('Invalid credentials!');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Error during login!');
  }
});

// Logout
app.post('/logout', function (req, res) {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Error logging out!');
    }
    res.send('Logged out!');
  });
});

// Dashboard
app.get('/dashboard', isAuthenticated, async function (req, res) {
  try {
    const db = await connectDB();
    const allBookings = await db.collection('bookings').find({ isMaintenance: false }).toArray();
    const freeMachinesArr = await db.collection('machines').find({ status: 'free' }).toArray();

    const todayBookings = allBookings.length;
    const freeMachines = freeMachinesArr.map(m => m.name).join(', ');
    const bookedByWho = allBookings.map(b => `${b.user} at ${b.time} on ${b.machine}`).join('; ');

    res.json({
      bookings: todayBookings,
      freeMachines: freeMachines || 'None',
      bookedByWho: bookedByWho || 'No bookings yet!',
      bookingsData: allBookings
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Error loading dashboard!');
  }
});

// Residents list
app.get('/residents', isAuthenticated, async function (req, res) {
  try {
    const db = await connectDB();
    const residents = await db.collection('residents').find().toArray();
    res.json(residents);
  } catch (error) {
    console.error('Residents error:', error);
    res.status(500).send('Error loading residents!');
  }
});

// Add resident
app.post('/residents', isAuthenticated, async function (req, res) {
  try {
    const { name, email, room } = req.body;
    if (!name || !email || !room) return res.status(400).send('All fields required!');
    const db = await connectDB();
    const residents = db.collection('residents');
    const count = await residents.countDocuments();
    const newResident = { id: String(count + 1), name, email, room, blocked: false };
    await residents.insertOne(newResident);
    res.send('Resident added!');
  } catch (error) {
    console.error('Add resident error:', error);
    res.status(500).send('Error adding resident!');
  }
});

// Block resident
app.post('/residents/:id/block', isAuthenticated, async function (req, res) {
  try {
    const id = req.params.id;
    const db = await connectDB();
    const residents = db.collection('residents');
    const bookings = db.collection('bookings');
    const resident = await residents.findOne({ id });
    if (resident) {
      await residents.updateOne({ id }, { $set: { blocked: true } });
      await bookings.deleteMany({ user: resident.name, isMaintenance: false });
      res.send('Resident blocked!');
    } else {
      res.status(404).send('Resident not found!');
    }
  } catch (error) {
    console.error('Block resident error:', error);
    res.status(500).send('Error blocking resident!');
  }
});

// Unblock resident
app.post('/residents/:id/unblock', isAuthenticated, async function (req, res) {
  try {
    const id = req.params.id;
    const db = await connectDB();
    const residents = db.collection('residents');
    const resident = await residents.findOne({ id });
    if (resident) {
      await residents.updateOne({ id }, { $set: { blocked: false } });
      res.send('Resident unblocked!');
    } else {
      res.status(404).send('Resident not found!');
    }
  } catch (error) {
    console.error('Unblock resident error:', error);
    res.status(500).send('Error unblocking resident!');
  }
});

// Bookings list
app.get('/bookings', isAuthenticated, async function (req, res) {
  try {
    const db = await connectDB();
    const bookings = await db.collection('bookings').find().toArray();
    res.json(bookings);
  } catch (error) {
    console.error('Bookings error:', error);
    res.status(500).send('Error loading bookings!');
  }
});

// Add booking (public)
app.post('/bookings', async function (req, res) {
  try {
    const { machine, time, user, isMaintenance } = req.body;
    if (!machine || !time || !user) return res.status(400).send('All fields required!');
    const db = await connectDB();
    const residents = db.collection('residents');
    const machines = db.collection('machines');
    const bookings = db.collection('bookings');
    const settings = await db.collection('settings').findOne();

    if (!isMaintenance) {
      const resident = await residents.findOne({ name: { $regex: `^${user}$`, $options: 'i' } });
      if (!resident) return res.status(400).send('Resident not found!');
      if (resident.blocked) return res.status(400).send('Resident is blocked!');
      const userBookings = await bookings.countDocuments({ user: { $regex: `^${user}$`, $options: 'i' }, isMaintenance: false });
      if (userBookings >= settings.maxBookings) return res.status(400).send('Max bookings reached!');
    }

    const machineToUpdate = await machines.findOne({ name: machine });
    if (!machineToUpdate) return res.status(400).send('Machine not found!');
    if (machineToUpdate.status !== 'free' && !isMaintenance) return res.status(400).send('Machine is not free!');
    if (await bookings.findOne({ machine, time })) return res.status(400).send('Time slot already booked!');

    const count = await bookings.countDocuments();
    const newBooking = { id: String(count + 1), machine, time, user, isMaintenance: !!isMaintenance };
    await bookings.insertOne(newBooking);

    await machines.updateOne(
      { name: machine },
      {
        $set: { status: isMaintenance ? 'out of order' : 'busy' },
        $inc: { usage: isMaintenance ? 0 : settings.bookingDuration }
      }
    );

    res.send('Booking added!');
  } catch (error) {
    console.error('Add booking error:', error);
    res.status(500).send('Error adding booking!');
  }
});

// Cancel booking
app.post('/bookings/:id/cancel', isAuthenticated, async function (req, res) {
  try {
    const id = req.params.id;
    const db = await connectDB();
    const bookings = db.collection('bookings');
    const machines = db.collection('machines');
    const booking = await bookings.findOne({ id });
    if (booking) {
      await bookings.deleteOne({ id });
      if (!booking.isMaintenance) {
        await machines.updateOne({ name: booking.machine }, { $set: { status: 'free' } });
      }
      res.send('Booking canceled!');
    } else {
      res.status(404).send('Booking not found!');
    }
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).send('Error canceling booking!');
  }
});

// Machines list
app.get('/machines', isAuthenticated, async function (req, res) {
  try {
    const db = await connectDB();
    const machines = await db.collection('machines').find().toArray();
    res.json(machines);
  } catch (error) {
    console.error('Machines error:', error);
    res.status(500).send('Error loading machines!');
  }
});

// Mark machine as broken
app.post('/machines/:name/break', isAuthenticated, async function (req, res) {
  try {
    const name = req.params.name;
    const db = await connectDB();
    const machines = db.collection('machines');
    const bookings = db.collection('bookings');
    const machine = await machines.findOne({ name });
    if (machine) {
      await machines.updateOne({ name }, { $set: { status: 'out of order' } });
      await bookings.deleteMany({ machine: name, isMaintenance: false });
      res.send('Machine marked as out of order!');
    } else {
      res.status(404).send('Machine not found!');
    }
  } catch (error) {
    console.error('Break machine error:', error);
    res.status(500).send('Error marking machine as broken!');
  }
});

// Repair machine
app.post('/machines/:name/repair', isAuthenticated, async function (req, res) {
  try {
    const name = req.params.name;
    const db = await connectDB();
    const machines = db.collection('machines');
    const bookings = db.collection('bookings');
    const machine = await machines.findOne({ name });
    if (machine) {
      await machines.updateOne({ name }, { $set: { status: 'free' } });
      await bookings.deleteMany({ machine: name, isMaintenance: true });
      res.send('Machine repaired!');
    } else {
      res.status(404).send('Machine not found!');
    }
  } catch (error) {
    console.error('Repair machine error:', error);
    res.status(500).send('Error repairing machine!');
  }
});

// Settings get
app.get('/settings', isAuthenticated, async function (req, res) {
  try {
    const db = await connectDB();
    const settings = await db.collection('settings').findOne();
    res.json(settings || { bookingDuration: 2, maxBookings: 3, maxDaysAhead: 7 });
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).send('Error loading settings!');
  }
});

// Settings save
app.post('/settings', isAuthenticated, async function (req, res) {
  try {
    const { bookingDuration, maxBookings, maxDaysAhead } = req.body;
    if (!bookingDuration || !maxBookings || !maxDaysAhead) return res.status(400).send('All fields required!');
    const db = await connectDB();
    await db.collection('settings').updateOne(
      {},
      {
        $set: {
          bookingDuration: Number(bookingDuration),
          maxBookings: Number(maxBookings),
          maxDaysAhead: Number(maxDaysAhead)
        }
      },
      { upsert: true }
    );
    res.send('Settings saved!');
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).send('Error saving settings!');
  }
});

// ====== START SERVER ======
app.listen(3000, () => {
  console.log('Magic robot is running on port 3000!');
});
