const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/airport", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
  insertSampleData();
});

// Flight Schema
const flightSchema = new mongoose.Schema(
  {
    flightNumber: { type: String, required: true, unique: true },
    airline: { type: String, required: true },
    departure: {
      airport: String,
      city: String,
      time: Date,
    },
    arrival: {
      airport: String,
      city: String,
      time: Date,
    },
    aircraft: String,
    gate: String,
    status: {
      type: String,
      enum: ["On Time", "Delayed", "Cancelled", "Boarding"],
      default: "On Time",
    },
    capacity: Number,
    bookedSeats: { type: Number, default: 0 },
    price: Number,
  },
  { timestamps: true }
);

// Passenger Schema
const passengerSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    passportNumber: String,
    flightId: { type: mongoose.Schema.Types.ObjectId, ref: "Flight" },
    flightNumber: String,
    seatNumber: String,
    bookingReference: { type: String, unique: true },
    status: {
      type: String,
      enum: ["Confirmed", "Cancelled", "Checked-in"],
      default: "Confirmed",
    },
  },
  { timestamps: true }
);

const Flight = mongoose.model("Flight", flightSchema);
const Passenger = mongoose.model("Passenger", passengerSchema);

// Generate booking reference
function generateBookingRef() {
  return "BK" + Math.random().toString(36).substr(2, 8).toUpperCase();
}

// Routes

// Get all flights
app.get("/api/flights", async (req, res) => {
  try {
    const flights = await Flight.find().sort({ "departure.time": 1 });
    res.json(flights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single flight
app.get("/api/flights/:id", async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ error: "Flight not found" });
    }
    res.json(flight);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new flight
app.post("/api/flights", async (req, res) => {
  try {
    const flight = new Flight(req.body);
    await flight.save();
    res.status(201).json(flight);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update flight
app.put("/api/flights/:id", async (req, res) => {
  try {
    const flight = await Flight.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!flight) {
      return res.status(404).json({ error: "Flight not found" });
    }
    res.json(flight);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete flight
app.delete("/api/flights/:id", async (req, res) => {
  try {
    const flight = await Flight.findByIdAndDelete(req.params.id);
    if (!flight) {
      return res.status(404).json({ error: "Flight not found" });
    }
    res.json({ message: "Flight deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Book a flight
app.post("/api/bookings", async (req, res) => {
  try {
    const { flightId, passengerInfo } = req.body;

    const flight = await Flight.findById(flightId);
    if (!flight) {
      return res.status(404).json({ error: "Flight not found" });
    }

    if (flight.bookedSeats >= flight.capacity) {
      return res.status(400).json({ error: "Flight is fully booked" });
    }

    const bookingReference = generateBookingRef();
    const seatNumber = `${
      Math.floor(flight.bookedSeats / 6) + 1
    }${String.fromCharCode(65 + (flight.bookedSeats % 6))}`;

    const passenger = new Passenger({
      ...passengerInfo,
      flightId,
      flightNumber: flight.flightNumber,
      seatNumber,
      bookingReference,
    });

    await passenger.save();

    // Update flight booked seats
    flight.bookedSeats += 1;
    await flight.save();

    res.status(201).json({ passenger, bookingReference });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all bookings
app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Passenger.find().populate("flightId");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get booking by reference
app.get("/api/bookings/:ref", async (req, res) => {
  try {
    const booking = await Passenger.findOne({
      bookingReference: req.params.ref,
    }).populate("flightId");
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search flights
app.get("/api/search", async (req, res) => {
  try {
    const { from, to, date } = req.query;
    let query = {};

    if (from) {
      query["departure.city"] = new RegExp(from, "i");
    }
    if (to) {
      query["arrival.city"] = new RegExp(to, "i");
    }
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query["departure.time"] = {
        $gte: searchDate,
        $lt: nextDay,
      };
    }

    const flights = await Flight.find(query).sort({ "departure.time": 1 });
    res.json(flights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve HTML page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Sample data insertion (run once)
async function insertSampleData() {
  try {
    const count = await Flight.countDocuments();
    if (count === 0) {
      const sampleFlights = [
        {
          flightNumber: "AI101",
          airline: "Air India",
          departure: {
            airport: "DEL",
            city: "Delhi",
            time: new Date("2025-07-25T06:00:00"),
          },
          arrival: {
            airport: "BOM",
            city: "Mumbai",
            time: new Date("2025-07-25T08:30:00"),
          },
          aircraft: "Boeing 737",
          gate: "A12",
          status: "On Time",
          capacity: 180,
          price: 8500,
        },
        {
          flightNumber: "UK202",
          airline: "Vistara",
          departure: {
            airport: "BOM",
            city: "Mumbai",
            time: new Date("2025-07-25T10:00:00"),
          },
          arrival: {
            airport: "BLR",
            city: "Bangalore",
            time: new Date("2025-07-25T11:30:00"),
          },
          aircraft: "Airbus A320",
          gate: "B05",
          status: "Boarding",
          capacity: 150,
          price: 6500,
        },
        {
          flightNumber: "SG303",
          airline: "SpiceJet",
          departure: {
            airport: "CCU",
            city: "Kolkata",
            time: new Date("2025-07-25T14:00:00"),
          },
          arrival: {
            airport: "DEL",
            city: "Delhi",
            time: new Date("2025-07-25T16:30:00"),
          },
          aircraft: "Boeing 737",
          gate: "C08",
          status: "Delayed",
          capacity: 189,
          price: 7200,
        },
      ];

      await Flight.insertMany(sampleFlights);
      console.log("Sample flight data inserted");
    }
  } catch (error) {
    console.error("Error inserting sample data:", error);
  }
}
