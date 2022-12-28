"use strict";
const express = require('express');
const router = express.Router();
const cors = require('cors');
/* GET home page. */
router.get('/', cors(), function (req, res) {
    res.json({ title: 'Express' });
});
module.exports = router;
