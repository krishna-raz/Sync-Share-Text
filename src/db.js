const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');

// Connect to MongoDB database
mongoose.connect("mongodb+srv://admin:demo@cluster0.oj9mebk.mongodb.net/wifisync", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
});

// Define user count schema
const visitorSchema  = new mongoose.Schema({
    name: String,
    count: Number
});

// Create model
const Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = Visitor;
