// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/loan_management')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// ================= Models =================

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    phone: String,
    email: String,
    password: String,
});
const User = mongoose.model('User', UserSchema);

const LoanSchema = new mongoose.Schema({
    loanType: { type: String, required: true }, // e.g., 'house', 'car', etc.
    fullName: String,
    email: String,
    phone: String,
    address: String,
    loanAmount: Number,
    loanDuration: String,
    status: { type: String, default: 'Pending' },
    appliedAt: { type: Date, default: Date.now },
    dateOfBirth: String,
    employmentType: String,
    monthlyIncome: String,
    loanPurpose: String,
    panCard: String,
    creditScore: String,
    existingLoans: mongoose.Schema.Types.Mixed, // Can be boolean or 'Yes'/'No'
    bankName: String,
    accountNumber: String,
    age: Number,
    contactNumber: String,
    carMake: String,
    carModel: String,
    carPrice: String,
    loanTenure: String,
    downPayment: String,
    businessName: String,
    businessType: String,
    yearEstablished: String,
    annualRevenue: String,
    businessAddress: String,
    taxId: String,
    institution: String,
    course: String,
    courseDuration: String,
    totalFees: String,
    parentName: String,
    parentIncome: String,
    academicScore: String,
    admissionStatus: String,
    jewelType: String,
    jewelWeight: String,
    jewelPurity: String,
    estimatedValue: String,
    employmentStatus: String,

    // ✅ New fields specifically for house loan
    propertyValue: String,
    propertyLocation: String,
    propertyType: String
});
const Loan = mongoose.model('Loan', LoanSchema);

const ContactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    sentAt: { type: Date, default: Date.now }
});
const Contact = mongoose.model('Contact', ContactSchema);

// ================= Routes =================

app.post('/register', async (req, res) => {
    const { username, phone, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Username already exists' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, phone, email, password: hashedPassword });
        await newUser.save();
        res.status(200).json({ message: 'Registration successful' });
    } catch (err) {
        res.status(500).json({ message: 'Registration failed' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ message: 'Invalid password' });
        res.status(200).json({ message: 'Login successful', user });
    } catch (err) {
        res.status(500).json({ message: 'Login failed' });
    }
});

app.post('/apply-loan', async (req, res) => {
    try {
        const loan = new Loan(req.body);
        await loan.save();
        res.status(200).json({ message: 'Loan application submitted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to submit loan application' });
    }
});

app.get('/loan-applications', async (req, res) => {
    try {
        const loans = await Loan.find().sort({ appliedAt: -1 });
        res.status(200).json(loans);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch loan applications' });
    }
});

app.get('/my-loans/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const userLoans = await Loan.find({ fullName: username }).sort({ appliedAt: -1 });
        res.status(200).json(userLoans);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch user loans' });
    }
});

app.put('/update-loan-status/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid loan ID format' });
    }

    try {
        const loan = await Loan.findByIdAndUpdate(
            id,
            { $set: { status } },
            { new: true, runValidators: true }
        );

        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }

        res.status(200).json({ message: 'Status updated successfully', loan });
    } catch (err) {
        console.error('Error updating loan status:', err);
        res.status(500).json({ message: 'Failed to update loan status' });
    }
});

app.post('/contact', async (req, res) => {
    try {
        const contact = new Contact(req.body);
        await contact.save();
        res.status(200).json({ message: 'Contact message saved successfully' });
    } catch (err) {
        console.error('Error saving contact message:', err);
        res.status(500).json({ message: 'Failed to save contact message' });
    }
});

app.get('/loan-stats/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const totalApplied = await Loan.countDocuments({ fullName: username });
        const totalApproved = await Loan.countDocuments({ fullName: username, status: 'Approved' });
        const totalRejected = await Loan.countDocuments({ fullName: username, status: 'Rejected' });

        res.status(200).json({
            applied: totalApplied,
            approved: totalApproved,
            rejected: totalRejected
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch loan stats' });
    }
});

app.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, {
            username: 1,
            email: 1,
            phone: 1,
            address: 1
        });
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

app.listen(4000, () => console.log('Server running on http://localhost:4000'));
