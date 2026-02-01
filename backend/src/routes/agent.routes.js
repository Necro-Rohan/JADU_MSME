
const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent.controller');

// Ideally protected, but for demo we can leave open or require basic auth
// router.use(require('../middlewares/auth.middleware'));

router.post('/chat', agentController.chat);

module.exports = router;
