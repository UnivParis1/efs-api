import searchService from "../services/searchService";

const express = require('express');
const router = express.Router();


/* GET home page. */
router.post('/', async (req, res) => {
    if (req.body.model != 'sbert') {
        const sentCode = req.body.code;
        const captchaCode = req.session.captcha;
        if (!sentCode || !captchaCode || sentCode != captchaCode) {
            res.status(422).send();
            return;
        }
    }
    const result = await searchService.fetchExperts(req.body.sentence, req.body.precision, req.body.model);
    res.json(result);
});

module.exports = router;
