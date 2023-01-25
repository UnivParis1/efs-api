import searchService from "../services/searchService";

const express = require('express');
const router = express.Router();


/* GET home page. */
router.post('/', async (req, res) => {
  const result = await searchService.fetchExperts(req.body.sentence, req.body.precision, req.body.model);
  res.json(result);
});

module.exports = router;
