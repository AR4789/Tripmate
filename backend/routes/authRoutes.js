const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const client = new OAuth2Client("257209872073-c64mrb08nn0r4d0uj3h239l63t73q8h1.apps.googleusercontent.com");


// Register a new user
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, verified: false });
        await newUser.save();

        // Send Verification Email
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const verificationLink = `http://localhost:5000/api/auth/verify/${token}`;

        await sendVerificationEmail(email, verificationLink);

        res.status(201).json({ message: 'User registered! Check email for verification link.' });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Google Authentication
router.post('/google', async (req, res) => {
    const { tokenId } = req.body;
    try {
        const ticket = await client.verifyIdToken({ idToken: tokenId, audience: "257209872073-c64mrb08nn0r4d0uj3h239l63t73q8h1.apps.googleusercontent.com" });
        const { name, email } = ticket.getPayload();

        let user = await User.findOne({ email });
        if (!user) {
            user = new User({ name, email, verified: true });
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user });
    } catch (error) {
        res.status(400).json({ error: 'Google authentication failed' });
    }
});

// Email Verification Route
router.get('/verify/:token', async (req, res) => {
    try {
        const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
        await User.updateOne({ email: decoded.email }, { verified: true });
        res.send('Email verified successfully!');
    } catch (error) {
        res.status(400).json({ error: 'Invalid or expired token' });
    }
});

// Email Sender Function
const sendVerificationEmail = async (email, link) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD }
    });

    await transporter.sendMail({
        from: '"TripMate" amanr1871@gmail.com',
        to: email,
        subject: "Verify Your Email",
        html: `<p>Click the link to verify your email: <a href="${link}">${link}</a></p>`
    });
};

// Login a user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '6h',
        });

        user.token=token;
        await user.save();
        

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router;
