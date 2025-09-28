const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { initializeAgentExecutorWithOptions } = require("langchain/agents");
const { Tool } = require("langchain/tools");
const { ConversationBufferMemory } = require("langchain/memory");
const Room = require("../models/Chat");
const Message = require("../models/Message");

require("dotenv").config();

class LangchainAgentManager {
  constructor() {
    this.agentsMap = new Map(); // sessionId -> { executor, memory, llm }
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      console.warn("⚠️ GEMINI_API_KEY not found in env");
    }
  }

  // Create tools bound to this instance (they will call DB)
  createTools(sessionId) {
    const validateGroupTool = new Tool({
      name: "validateGroupTool",
      description:
        "Input: a group name or group id. Returns VALID:<groupId>|<groupName> or INVALID",
      func: async (input) => {
        if (!input) return "INVALID";
        // try by _id or name
        let group = null;
        try {
          group = await Room.findOne({
            $or: [{ _id: input }, { name: input }],
          }).lean();
        } catch (err) {
          // maybe provided input is not a valid ObjectId; try by name
          group = await Room.findOne({ name: input }).lean();
        }
        if (!group) return "INVALID";
        return `VALID:${group._id.toString()}|${group.name}`;
      },
    });

    const fetchChatHistoryTool = new Tool({
      name: "fetchChatHistoryTool",
      description:
        "Input: groupId|1day or groupId|1week. Returns concatenated chat history (username: message) or 'NO_MESSAGES'.",
      func: async (input) => {
        try {
          const [groupId, range] = input.split("|");
          const now = new Date();
          const days = (range || "1day").toLowerCase().includes("week") ? 7 : 1;
          const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
          const history = await Message.find({
            room: groupId,
            createdAt: { $gte: startDate },
          })
            .sort({ createdAt: 1 })
            .lean();

          if (!history || history.length === 0) return "NO_MESSAGES";

          // Limit to last 200 messages to keep prompt size sane
          const limited = history.slice(-200);
          return limited.map((m) => `${m.username}: ${m.message}`).join("\n");
        } catch (err) {
          console.error("fetchChatHistoryTool error:", err);
          return "NO_MESSAGES";
        }
      },
    });

    const generateSuggestionsTool = new Tool({
      name: "generateSuggestionsTool",
      description:
        "Input: a JSON-like payload with chatHistory and extraInstructions. Returns 3 suggestions numbered 1-3.",
      func: async (input) => {
        try {
          // input expected as: "CHAT::...|||EXTRA::some extra text|||GROUP::groupName|||RANGE::1day"
          // but agent can pass any string, we'll pass through to LLM prompt
          const prompt = `
You are a helpful assistant for continuing group conversations. Analyze the provided chat history and the optional extra instructions.
Tasks:
1) Detect relationship contexts present (eg: boss, friend, girlfriend, boyfriend, colleague) if any.
2) Detect the dominant tone (eg: flirty, formal, casual, playful, professional).
3) Detect the language used (English, Hindi, Roman Hindi) and keep suggestions in the same language.
4) Produce 3 short message suggestions that naturally continue the conversation; keep them appropriate to relationship & tone.
5) If extra instructions are present, incorporate them.

Input (do not invent anything outside this):
${input}

Output requirements:
- Return ONLY the 3 suggestions, each on its own line, numbered "1.", "2.", "3."
- Keep each suggestion short (one or two sentences).
`;
          const res = await this.getLLM(sessionId).call([
            { role: "user", content: prompt },
          ]);
          // res may be object; attempt to extract text
          const text =
            (res && (res.text || res.output || res.response || res[0])) ||
            String(res);
          // try to return textual content
          if (typeof text === "string") return text.trim();
          return String(text);
        } catch (err) {
          console.error("generateSuggestionsTool error:", err);
          return "ERROR_GENERATING_SUGGESTIONS";
        }
      },
    });

    return [validateGroupTool, fetchChatHistoryTool, generateSuggestionsTool];
  }

  // Build an LLM object for a session (Gemini via langchain/google-genai)
  getLLM(sessionId) {
    const agent = this.agentsMap.get(sessionId);
    if (agent && agent.llm) return agent.llm;

    const llm = new ChatGoogleGenerativeAI({
      apiKey: this.apiKey,
      model: "gemini-2.5-flash", // change model name if needed
      temperature: 0.6,
    });

    // If agent exists, update; else create basic entry
    const state = this.agentsMap.get(sessionId) || {};
    state.llm = llm;
    this.agentsMap.set(sessionId, state);
    return llm;
  }

  // Create an executor if not exist for session
  async ensureExecutor(sessionId) {
    if (
      this.agentsMap.has(sessionId) &&
      this.agentsMap.get(sessionId).executor
    ) {
      return this.agentsMap.get(sessionId).executor;
    }

    // Create memory and tools & executor
    const memory = new ConversationBufferMemory({
      memoryKey: "chat_history",
      inputKey: "input",
    });

    const llm = this.getLLM(sessionId);
    const tools = this.createTools(sessionId);

    const executor = await initializeAgentExecutorWithOptions(tools, llm, {
      agentType: "chat-conversational-react-description",
      memory,
      verbose: false,
    });

    this.agentsMap.set(sessionId, { executor, memory, llm });
    return executor;
  }

  // Reset a session (if user wants to start over)
  resetSession(sessionId) {
    this.agentsMap.delete(sessionId);
  }

  // Main entry: accept user message and return agent reply
  async handleMessage(sessionId, userMessage) {
    // sessionId is required (userId or socketId)
    if (!sessionId) throw new Error("sessionId required");

    const executor = await this.ensureExecutor(sessionId);

    // We feed the user's raw message to the executor. The agent's chain + memory will guide the multi-step flow.
    // The agent can call tools (validateGroupTool, fetchChatHistoryTool, generateSuggestionsTool) as needed.
    // The agent's prompts should be constructed to behave as specified in tools (we keep prompts in the Tools where needed).
    try {
      const result = await executor.run(userMessage);
      // executor.run usually returns a string reply to user
      return result;
    } catch (err) {
      console.error("Agent run error:", err);
      return "Sorry, something went wrong when processing your request. Please try again.";
    }
  }
}

module.exports = new LangchainAgentManager();
