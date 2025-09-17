let bookingsChart = null;

function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  if (!username || !password) {
    document.getElementById('loginError').innerText = 'Please enter username and password!';
    return;
  }
  fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) throw new Error('Invalid credentials!');
      return response.json();
    })
    .then(data => {
      if (data.success) {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'flex';
        showDashboard();
      } else {
        document.getElementById('loginError').innerText = 'Invalid username or password!';
      }
    })
    .catch(error => {
      console.error('Login error:', error);
      document.getElementById('loginError').innerText = 'Error logging in!';
    });
}

function logout() {
  fetch('http://localhost:3000/logout', {
    method: 'POST',
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) throw new Error('Logout failed!');
      return response.text();
    })
    .then(() => {
      document.getElementById('adminPanel').style.display = 'none';
      document.getElementById('loginPage').style.display = 'flex';
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
      document.getElementById('loginError').innerText = '';
    })
    .catch(error => {
      console.error('Logout error:', error);
      alert('Error logging out!');
    });
}

function showDashboard() {
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('residents').style.display = 'none';
  document.getElementById('bookingsPage').style.display = 'none';
  document.getElementById('machinesPage').style.display = 'none';
  document.getElementById('settingsPage').style.display = 'none';
  document.getElementById('dashboardBtn').classList.add('active');
  document.getElementById('residentsBtn').classList.remove('active');
  document.getElementById('bookingsBtn').classList.remove('active');
  document.getElementById('machinesBtn').classList.remove('active');
  document.getElementById('settingsBtn').classList.remove('active');
  getDashboard();
}

function showResidents() {
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('residents').style.display = 'block';
  document.getElementById('bookingsPage').style.display = 'none';
  document.getElementById('machinesPage').style.display = 'none';
  document.getElementById('settingsPage').style.display = 'none';
  document.getElementById('dashboardBtn').classList.remove('active');
  document.getElementById('residentsBtn').classList.add('active');
  document.getElementById('bookingsBtn').classList.remove('active');
  document.getElementById('machinesBtn').classList.remove('active');
  document.getElementById('settingsBtn').classList.remove('active');
  getResidents();
}

function showBookings() {
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('residents').style.display = 'none';
  document.getElementById('bookingsPage').style.display = 'block';
  document.getElementById('machinesPage').style.display = 'none';
  document.getElementById('settingsPage').style.display = 'none';
  document.getElementById('dashboardBtn').classList.remove('active');
  document.getElementById('residentsBtn').classList.remove('active');
  document.getElementById('bookingsBtn').classList.add('active');
  document.getElementById('machinesBtn').classList.remove('active');
  document.getElementById('settingsBtn').classList.remove('active');
  getBookings();
}

function showMachines() {
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('residents').style.display = 'none';
  document.getElementById('bookingsPage').style.display = 'none';
  document.getElementById('machinesPage').style.display = 'block';
  document.getElementById('settingsPage').style.display = 'none';
  document.getElementById('dashboardBtn').classList.remove('active');
  document.getElementById('residentsBtn').classList.remove('active');
  document.getElementById('bookingsBtn').classList.remove('active');
  document.getElementById('machinesBtn').classList.add('active');
  document.getElementById('settingsBtn').classList.remove('active');
  getMachines();
}

function showSettings() {
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('residents').style.display = 'none';
  document.getElementById('bookingsPage').style.display = 'none';
  document.getElementById('machinesPage').style.display = 'none';
  document.getElementById('settingsPage').style.display = 'block';
  document.getElementById('dashboardBtn').classList.remove('active');
  document.getElementById('residentsBtn').classList.remove('active');
  document.getElementById('bookingsBtn').classList.remove('active');
  document.getElementById('machinesBtn').classList.remove('active');
  document.getElementById('settingsBtn').classList.add('active');
  getSettings();
}

function getDashboard() {
  fetch('http://localhost:3000/dashboard', {
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) throw new Error('Dashboard not found!');
      return response.json();
    })
    .then(data => {
      document.getElementById('bookings').innerText = `Today's Bookings: ${data.bookings}`;
      document.getElementById('machines').innerText = `Free Machines: ${data.freeMachines}`;
      document.getElementById('bookedByWho').innerText = `Booked By: ${data.bookedByWho}`;
      
      const allBookings = data.bookingsData || [];
      const machineBookings = {};
      allBookings.forEach(booking => {
        if (!booking.isMaintenance) {
          machineBookings[booking.machine] = (machineBookings[booking.machine] || 0) + 1;
        }
      });
      const labels = Object.keys(machineBookings);
      const counts = Object.values(machineBookings);

      if (bookingsChart) {
        bookingsChart.destroy();
      }

      const ctx = document.getElementById('bookingsChart');
      if (ctx) {
        bookingsChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels.length ? labels : ['No Bookings'],
            datasets: [{
              label: 'Bookings per Machine',
              data: labels.length ? counts : [0],
              backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0'],
              borderColor: ['#2E86C1', '#E74C3C', '#F1C40F', '#3498DB'],
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1 }
              }
            },
            plugins: {
              legend: { display: true }
            }
          }
        });
      }
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('bookings').innerText = 'Error loading bookings!';
      document.getElementById('machines').innerText = 'Error loading machines!';
      document.getElementById('bookedByWho').innerText = 'Error loading bookings!';
    });
}

function getResidents() {
  fetch('http://localhost:3000/residents', {
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) throw new Error('Residents not found!');
      return response.json();
    })
    .then(data => {
      const table = document.getElementById('residentTable');
      while (table.rows.length > 1) table.deleteRow(1);
      data.forEach(resident => {
        const row = table.insertRow();
        row.insertCell().innerText = resident.name;
        row.insertCell().innerText = resident.email;
        row.insertCell().innerText = resident.room;
        row.insertCell().innerHTML = resident.blocked
          ? `<button onclick="unblockResident('${resident.id}')">Unblock</button>`
          : `<button onclick="blockResident('${resident.id}')">Block</button>`;
      });
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('residentTable').innerHTML = '<tr><td colspan="4">Error loading residents!</td></tr>';
    });
}

function addResident() {
  const name = document.getElementById('newName').value;
  const email = document.getElementById('newEmail').value;
  const room = document.getElementById('newRoom').value;
  if (!name || !email || !room) {
    alert('Please fill in all fields!');
    return;
  }
  fetch('http://localhost:3000/residents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, room }),
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to add resident!');
      return response.text();
    })
    .then(() => {
      getResidents();
      document.getElementById('newName').value = '';
      document.getElementById('newEmail').value = '';
      document.getElementById('newRoom').value = '';
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Could not add resident!');
    });
}

function blockResident(id) {
  fetch(`http://localhost:3000/residents/${id}/block`, {
    method: 'POST',
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to block resident!');
      return response.text();
    })
    .then(() => getResidents())
    .catch(error => {
      console.error('Error:', error);
      alert('Could not block resident!');
    });
}

function unblockResident(id) {
  fetch(`http://localhost:3000/residents/${id}/unblock`, {
    method: 'POST',
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to unblock resident!');
      return response.text();
    })
    .then(() => getResidents())
    .catch(error => {
      console.error('Error:', error);
      alert('Could not unblock resident!');
    });
}

function getBookings() {
  fetch('http://localhost:3000/bookings', {
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) throw new Error('Bookings not found!');
      return response.json();
    })
    .then(data => {
      const table = document.getElementById('bookingTable');
      while (table.rows.length > 1) table.deleteRow(1);
      data.forEach(booking => {
        const row = table.insertRow();
        row.insertCell().innerText = booking.machine;
        row.insertCell().innerText = booking.time;
        row.insertCell().innerText = booking.user;
        row.insertCell().innerText = booking.isMaintenance ? 'Maintenance' : 'Regular';
        row.insertCell().innerHTML = `<button onclick="cancelBooking('${booking.id}')">Cancel</button>`;
      });
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('bookingTable').innerHTML = '<tr><td colspan="5">Error loading bookings!</td></tr>';
    });
}

function searchBookings() {
  const query = document.getElementById('searchBooking').value.toLowerCase();
  fetch('http://localhost:3000/bookings', {
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) throw new Error('Bookings not found!');
      return response.json();
    })
    .then(data => {
      const table = document.getElementById('bookingTable');
      while (table.rows.length > 1) table.deleteRow(1);
      const filtered = data.filter(b => 
        b.user.toLowerCase().includes(query) || 
        b.machine.toLowerCase().includes(query) || 
        b.time.toLowerCase().includes(query)
      );
      filtered.forEach(booking => {
        const row = table.insertRow();
        row.insertCell().innerText = booking.machine;
        row.insertCell().innerText = booking.time;
        row.insertCell().innerText = booking.user;
        row.insertCell().innerText = booking.isMaintenance ? 'Maintenance' : 'Regular';
        row.insertCell().innerHTML = `<button onclick="cancelBooking('${booking.id}')">Cancel</button>`;
      });
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('bookingTable').innerHTML = '<tr><td colspan="5">Error loading bookings!</td></tr>';
    });
}

function addBooking() {
  const machine = document.getElementById('newBookingMachine').value;
  const time = document.getElementById('newBookingTime').value;
  const user = document.getElementById('newBookingUser').value;
  if (!machine || !time || !user) {
    alert('Please fill in all fields!');
    return;
  }
  fetch('http://localhost:3000/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ machine, time, user, isMaintenance: false }),
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to add booking!');
      return response.text();
    })
    .then(() => {
      getBookings();
      document.getElementById('newBookingMachine').value = '';
      document.getElementById('newBookingTime').value = '';
      document.getElementById('newBookingUser').value = '';
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Could not add booking!');
    });
}

function cancelBooking(id) {
  fetch(`http://localhost:3000/bookings/${id}/cancel`, {
    method: 'POST',
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to cancel booking!');
      return response.text();
    })
    .then(() => getBookings())
    .catch(error => {
      console.error('Error:', error);
      alert('Could not cancel booking!');
    });
}

function getMachines() {
  fetch('http://localhost:3000/machines', {
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) throw new Error('Machines not found!');
      return response.json();
    })
    .then(data => {
      const table = document.getElementById('machineTable');
      while (table.rows.length > 1) table.deleteRow(1);
      data.forEach(machine => {
        const row = table.insertRow();
        row.insertCell().innerText = machine.name;
        row.insertCell().innerText = machine.status;
        row.insertCell().innerText = machine.usage || 0;
        row.insertCell().innerHTML = machine.status === 'out of order'
          ? `<button onclick="repairMachine('${machine.name}')">Repair</button>`
          : `<button onclick="breakMachine('${machine.name}')">Mark Out of Order</button>`;
      });
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('machineTable').innerHTML = '<tr><td colspan="4">Error loading machines!</td></tr>';
    });
}

function breakMachine(name) {
  fetch(`http://localhost:3000/machines/${name}/break`, {
    method: 'POST',
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to mark machine as broken!');
      return response.text();
    })
    .then(() => getMachines())
    .catch(error => {
      console.error('Error:', error);
      alert('Could not mark machine as broken!');
    });
}

function repairMachine(name) {
  fetch(`http://localhost:3000/machines/${name}/repair`, {
    method: 'POST',
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to repair machine!');
      return response.text();
    })
    .then(() => getMachines())
    .catch(error => {
      console.error('Error:', error);
      alert('Could not repair machine!');
    });
}

function scheduleMaintenance() {
  const machine = document.getElementById('maintenanceMachine').value;
  const time = document.getElementById('maintenanceTime').value;
  if (!machine || !time) {
    alert('Please fill in all fields!');
    return;
  }
  fetch('http://localhost:3000/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ machine, time, user: 'Maintenance', isMaintenance: true }),
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to schedule maintenance!');
      return response.text();
    })
    .then(() => {
      getMachines();
      document.getElementById('maintenanceMachine').value = '';
      document.getElementById('maintenanceTime').value = '';
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Could not schedule maintenance!');
    });
}

function getSettings() {
  fetch('http://localhost:3000/settings', {
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) throw new Error('Settings not found!');
      return response.json();
    })
    .then(data => {
      document.getElementById('bookingDuration').value = data.bookingDuration || 2;
      document.getElementById('maxBookings').value = data.maxBookings || 3;
      document.getElementById('maxDaysAhead').value = data.maxDaysAhead || 7;
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Could not load settings!');
    });
}

function saveSettings() {
  const bookingDuration = document.getElementById('bookingDuration').value;
  const maxBookings = document.getElementById('maxBookings').value;
  const maxDaysAhead = document.getElementById('maxDaysAhead').value;
  if (!bookingDuration || !maxBookings || !maxDaysAhead) {
    alert('Please fill in all fields!');
    return;
  }
  fetch('http://localhost:3000/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingDuration: Number(bookingDuration), maxBookings: Number(maxBookings), maxDaysAhead: Number(maxDaysAhead) }),
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to save settings!');
      return response.text();
    })
    .then(() => {
      alert('Settings saved!');
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Could not save settings!');
    });
}