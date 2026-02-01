
const { OpenAI } = require('openai');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- COSINE SIMILARITY HELPER ---
function getWordVector(str) {
  const words = str.toLowerCase().replace(/\W/g, ' ').split(/\s+/).filter(w => w.length > 0);
  const vector = {};
  words.forEach(w => {
    vector[w] = (vector[w] || 0) + 1;
  });
  return vector;
}

function calculateCosineSimilarity(str1, str2) {
  const vec1 = getWordVector(str1);
  const vec2 = getWordVector(str2);

  const intersection = Object.keys(vec1).filter(w => vec2[w]);

  let dot = 0;
  intersection.forEach(w => {
    dot += vec1[w] * vec2[w];
  });

  const mag1 = Math.sqrt(Object.values(vec1).reduce((acc, val) => acc + val * val, 0));
  const mag2 = Math.sqrt(Object.values(vec2).reduce((acc, val) => acc + val * val, 0));

  if (mag1 === 0 || mag2 === 0) return 0;
  return dot / (mag1 * mag2);
}
// ---------------------------------

const SCHEMA_CONTEXT = `
You are an AI assistant managing a PostgreSQL database for an auto parts business "AutoKarya".
You MUST generate SQL for the underlying database tables, which use **snake_case** names.

**Tables & Columns (Database Schema):**

1. **items** (Inventory)
   - id, name, code, description
   - "cost_price" (Decimal), "selling_price" (Decimal)
   - "total_quantity" (Int), "current_stock" (Int), "reorder_point" (Int)
   - "category_id" (FK), "supplier_id" (FK)
   - "is_active" (Boolean)

2. **sales** (Orders)
   - id, "invoice_id", "customer_name", "total_amount" (Decimal), "created_at"
   - "payment_status"

3. **sale_items** (Line Items)
   - "sale_id", "item_id", quantity, "unit_price", "total_price"

4. **suppliers**
   - id, name, "contact_info", "reliability_score" (Decimal)

5. **purchase_history**
   - "supplier_id", "item_id", price, "lead_time_days"
   - "reliability_score", "actual_delay_days", "satisfaction_score"

6. **Staff**
   - id, name, role, "is_available", "current_load"

**CRITICAL RULES:**
- **Searching Items**: **NEVER** use SQL \`LIKE\`, \`ILIKE\`, or \`=\` for names in WHERE clauses.
  - INSTEAD, use the tool: \`TOOL:SEARCH <name>\`
  - Example: \`{ "sql": "TOOL:SEARCH Madhur Sugar" }\`
  - This checks similarity against ALL database items.
  
- **Action Workflow (Search First)**:
  - If the user asks to Update or Delete by name (e.g., "Delete Madhur Sugar"), you **MUST** first run \`TOOL:SEARCH\`.
  - **Step 1**: Find the item ID using \`TOOL:SEARCH\`.
  - **Step 2**: Use the returned \`id\` to execute the SQL query (\`UPDATE ... WHERE id = ...\` or \`DELETE ... WHERE id = ...\`).
  - **Do NOT** try to delete by name directly in SQL.

- **Confirmation vs. Automatic**:
  - If \`TOOL:SEARCH\` returns one **high-confidence match (similarity > 0.8)**, you may proceed to generate the SQL action immediately in the next step (e.g., "I found 'Madhur Sugar 1kg'. Deleting it now.").
  - If matches are ambiguous (low similarity or multiple candidates), you MUST ask for confirmation first.

- **Mutations**: For UDPATE, INSERT, or DELETE, you **MUST** use \`RETURNING *\`.
- **Profit Calculation**: \`("items"."selling_price" - "items"."cost_price") * "items"."current_stock"\`.
- **Date Filtering**: \`"created_at" >= NOW() - INTERVAL '1 month'\`.

**AGENT BEHAVIOR (ReAct Pattern):**
You are an autonomous agent. You can execute multiple steps in a loop.
For each step, return a JSON object with:
- "thought": Your reasoning.
- "sql": The SQL query OR \`TOOL:SEARCH <name>\`.
- "final_answer": The final response to the user.

**Example Flow (Deletion):**
User: "Delete Madhur Sugar"
Step 1: { "thought": "I need to find the ID of 'Madhur Sugar' first.", "sql": "TOOL:SEARCH Madhur Sugar" }
(System returns: [{id: 1, name: 'Madhur Sugar 1kg', similarity: 0.9}])
Step 2: { "thought": "Found high confidence match. Deleting now.", "sql": "DELETE FROM items WHERE id = 1 RETURNING *" }
Step 3: { "final_answer": "I have successfully deleted 'Madhur Sugar 1kg'." }
`;

class AgentService {
  async processQuery(userText, history = []) {
    const logs = [];
    const addLog = (msg) => {
      console.log(msg);
      logs.push({ timestamp: new Date(), message: msg });
    };

    try {
      addLog(`User Query: "${userText}"`);

      // Construct Initial Messages
      const contextMessages = history.slice(-6).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      let messages = [
        { role: "system", content: SCHEMA_CONTEXT },
        ...contextMessages,
        { role: "user", content: `Solve this request: "${userText}". Return ONLY the JSON object step.` }
      ];

      // MAX LOOPS (ReAct Steps)
      const MAX_STEPS = 5;
      for (let i = 0; i < MAX_STEPS; i++) {

        addLog(`Step ${i + 1}: Thinking...`);

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: messages,
          temperature: 0,
          response_format: { type: "json_object" }
        });

        const responseContent = completion.choices[0].message.content;
        let stepData;
        try {
          stepData = JSON.parse(responseContent);
        } catch (e) {
          addLog("Error parsing JSON response from Agent.");
          throw new Error("Agent Validation Failed");
        }

        addLog(`Thought: ${stepData.thought || "No thought provided"}`);

        // CASE 1: Final Answer
        if (stepData.final_answer) {
          addLog("Detailed plan completed. Returning answer.");
          return { text: stepData.final_answer, logs };
        }

        // CASE 2: Tool/SQL Execution
        if (stepData.sql) {
          const command = stepData.sql.trim();

          let executionResult;

          if (command.startsWith("TOOL:SEARCH")) {
            // --- COSINE SIMILARITY SEARCH TOOL ---
            const searchTerm = command.replace("TOOL:SEARCH", "").trim();
            addLog(`Running Tool: Search for "${searchTerm}"`);

            // Fetch ALL items (id, name, selling_price)
            const allItems = await prisma.item.findMany({
              select: { id: true, name: true, sellingPrice: true, code: true }
            });

            // Calculate Similarity
            const rankedItems = allItems.map(item => ({
              ...item,
              similarity: calculateCosineSimilarity(searchTerm, item.name)
            })).sort((a, b) => b.similarity - a.similarity);

            // Keep top 3 matching > 0.1
            const topMatches = rankedItems.filter(i => i.similarity > 0.1).slice(0, 3);

            executionResult = topMatches.length > 0 ? topMatches : "No similar items found.";
            addLog(`Search found ${topMatches.length} matches. Top: ${topMatches[0]?.name || 'None'}`);
          } else {
            // --- STANDARD SQL EXECUTION ---
            const cleanSql = command.replace(/```sql/g, '').replace(/```/g, '').trim();
            addLog(`Executing SQL: ${cleanSql}`);

            try {
              executionResult = await prisma.$queryRawUnsafe(cleanSql);
              addLog(`Query Success. Rows: ${executionResult.length}`);
            } catch (sqlErr) {
              executionResult = { error: sqlErr.message };
              addLog(`Query Failed: ${sqlErr.message}`);
            }
          }

          // Append result to conversation history for the next turn
          const resultString = JSON.stringify(executionResult, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
          ).substring(0, 8000);

          messages.push({ role: "assistant", content: responseContent });
          messages.push({ role: "user", content: `Execution Result: ${resultString}` });
        } else {
          // If neither final_answer nor sql, force a conclusion
          addLog("Agent is stuck (no SQL, no answer). Forcing stop.");
          return { text: "I am unsure how to proceed. Please clarify.", logs };
        }
      }

      return { text: "I reached the limit of my thinking steps without a final answer. Please be more specific.", logs };

    } catch (error) {
      console.error("Agent Error:", error);
      addLog(`CRITICAL ERROR: ${error.message}`);
      return {
        text: "I encountered a system error while processing your request.",
        logs
      };
    }
  }
}

module.exports = new AgentService();
