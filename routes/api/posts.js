const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

// import models
const User = require('../../models/user');
const Post = require('../../models/Post');

// @router  GET api/posts
// @desc    Get all posts
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });

        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @router  POST api/posts
// @desc    Create a post
// @access  Private
router.post(
    '/',
    [auth, [check('text', 'Post should not be empty').not().isEmpty()]],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findById(req.user.id).select('-password');

            // let newPost = new Post;
            const newPost = new Post({
                text: req.body.text,
                name: user.name,
                user: req.user.id,
            });

            const post = await newPost.save();

            res.json(post);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @router  GET api/posts/:id
// @desc    Get post by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        res.json(post);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'CastError') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @router  PUT api/posts/:id
// @desc    edit user post
// @access  Private
router.put(
    '/:id',
    [auth, [check('text', 'Post should not be empty').not().isEmpty()]],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400), json({ errors: errors.array() });
        }

        try {
            const foundPost = await Post.findById(req.params.id);

            // replace old post text;
            foundPost.text = req.body.text;

            const post = await foundPost.save();

            res.json({ post, msg: 'Post Updated' });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @router  DELETE api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // check if post exists
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        //check user ownership(for login user posts only)
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await post.remove();

        res.json({ msg: 'post removed' });
    } catch (err) {
        console.error(err.message);
        if (err.name === 'CastError') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
