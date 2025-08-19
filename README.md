✈️ Airport Management System:

A full-stack web application for managing flights, passengers, and bookings. Built with Node.js, Express, MongoDB, and Vanilla JavaScript, this project supports CRUD operations on flights, passenger bookings with real-time seat allocation, and flight search.

📂 Folder Structure:
airport-management-system/
│
├── public/                # Frontend (HTML, CSS, JS files)
│   ├── index.html         # Main UI
│   ├── styles.css         # Styling
│   └── script.js          # Frontend logic
│
├── server.js              # Express server & API routes
├── package.json           # Project dependencies
└── README.md              # Documentation

⚙️ Features:
✈️ Manage flights (Add, Update, Delete, View)
👥 Passenger booking with seat allocation & booking reference
🔎 Search flights by source, destination, and date
📊 MongoDB database integration for persistence

🚀 How to Run:
- Clone the repository
git clone https://github.com/your-username/airport-management-system.git
cd airport-management-system

- Install dependencies
npm install

- Start MongoDB locally
mongod

- Make sure MongoDB is running on mongodb://127.0.0.1:27017/airport
- Run the server
node server.js

- Open in browser
http://localhost:3000

🛠️ Tech Stack:
Backend: Node.js, Express
Database: MongoDB
Frontend: HTML, CSS, JavaScript (Vanilla JS)
