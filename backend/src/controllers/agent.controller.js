
const agentService = require('../services/agent.service');

class AgentController {
  async chat(req, res) {
    try {
      const { query, history } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const { text, logs } = await agentService.processQuery(query, history || []);
      res.json({ response: text, logs });
    } catch (error) {
      console.error("Agent Controller Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

module.exports = new AgentController();
