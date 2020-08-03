const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../../middleware/auth');
const config = require('config');
const { check, validationResult } = require('express-validator');
const router = express.Router();

// import user model
const User = require('../../models/user');

// @router  GET api/users
// @desc    get all registered users
// @access  Public
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password').select('-_id');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @router  POST api/users
// @desc    Register User
// @access  Public
router.post(
    '/',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please add a valid email').isEmail(),
        check(
            'password',
            'Please enter a password with 8 or more characters'
        ).isLength({ min: 8 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            let user = await User.findOne({ email });

            // See if user exists
            if (user) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'User already exists' }] });
            }

            user = new User({
                name,
                email,
                password,
            });

            // Encrypt password
            const salt = await bcrypt.genSalt(10);

            user.password = await bcrypt.hash(password, salt);

            await user.save();

            // Return jsonwebtoken
            const payload = {
                user: {
                    id: user.id,
                },
            };

            jwt.sign(
                payload,
                config.get('jwtSecret'),
                { expiresIn: 360000 },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// suspend current user
router.get('/suspend', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

module.exports = router;
