const express = require("express");
const router = express.Router();
const agentController = require("../controllers/agent.controller.js");
const { requireRole, roles } = require("../middlewares/auth.middleware.js");

router.get(
  "/logs",
  requireRole([roles.ADMIN, roles.STAFF]),
  agentController.getLogs,
);

module.exports = router;
