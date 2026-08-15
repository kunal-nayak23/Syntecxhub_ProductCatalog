import jwt from 'jsonwebtoken';
import User from '../Models/User.js';

const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const userResponse = (user) => ({ id: user._id, name: user.name, email: user.email });

export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    const user = await User.create({ name, email, password });
    return res.status(201).json({ success: true, message: 'Account created successfully', token: tokenFor(user), user: userResponse(user) });
  } catch (error) { next(error); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    return res.json({ success: true, message: 'Logged in successfully', token: tokenFor(user), user: userResponse(user) });
  } catch (error) { next(error); }
};

