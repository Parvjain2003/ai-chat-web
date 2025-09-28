// services/aiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { InferenceClient } = require("@huggingface/inference");

class AIService {
  constructor() {
    this.hfClient = null;
    try {
      const token = this.getHFToken();
      this.hfClient = new InferenceClient(token);
      console.log("✅ Hugging Face client initialized successfully");
    } catch (err) {
      console.error(
        "❌ Failed to initialize Hugging Face client:",
        err.message
      );
    }

    // Initialize Gemini client
    this.apiKey = process.env.GEMINI_API_KEY;
    this.client = null;
    if (this.apiKey) {
      try {
        this.client = new GoogleGenerativeAI(this.apiKey);
      } catch (err) {
        console.error("Failed to construct GoogleGenerativeAI client:", err);
      }
    }

    // Embedding models in order of preference
    this.embeddingModels = [
      "sentence-transformers/all-MiniLM-L6-v2", // 384 dimensions, fast and reliable
      "BAAI/bge-large-en-v1.5", // 1024 dimensions, high quality
      "sentence-transformers/all-mpnet-base-v2", // 768 dimensions, good multilingual
      "intfloat/e5-large-v2", // 1024 dimensions, reliable
    ];

    // Enhanced pattern matching dictionaries
    this.romanHindiWords = [
      "aap",
      "tum",
      "main",
      "meri",
      "tera",
      "teri",
      "mera",
      "tumhara",
      "tumhari",
      "kya",
      "kaise",
      "kahan",
      "kab",
      "kyun",
      "kaun",
      "kitna",
      "kitni",
      "hai",
      "hoon",
      "ho",
      "hain",
      "tha",
      "thi",
      "the",
      "kar",
      "karna",
      "karta",
      "karti",
      "karte",
      "kar raha",
      "kar rahi",
      "nahi",
      "nahin",
      "mat",
      "mujhe",
      "tujhe",
      "usse",
      "unhe",
      "acha",
      "accha",
      "bura",
      "baat",
      "samay",
      "waqt",
      "din",
      "raat",
      "ghar",
      "paisa",
      "paise",
      "kam",
      "kaam",
      "padhai",
      "shaadi",
      "pyaar",
      "mohabbat",
      "dost",
      "dosti",
      "yaad",
      "yaadein",
      "khana",
      "paani",
      "sona",
      "jaana",
      "aana",
      "lena",
      "dena",
      "bahut",
      "thoda",
      "zyada",
      "kam",
      "bilkul",
      "shayad",
      "zaroor",
    ];

    this.romanticKeywords = [
      "love",
      "pyaar",
      "mohabbat",
      "ishq",
      "jaan",
      "jaanu",
      "baby",
      "babe",
      "darling",
      "sweetheart",
      "honey",
      "meri jaan",
      "meri zindagi",
      "yaad",
      "miss",
      "kiss",
      "hug",
      "cuddle",
      "romance",
      "romantic",
      "beautiful",
      "handsome",
      "cute",
      "sexy",
      "hot",
      "gorgeous",
    ];

    this.flirtyPhrases = [
      "i love you",
      "love you",
      "miss you",
      "thinking of you",
      "can't stop thinking",
      "you're so",
      "you look",
      "tujhse pyaar",
      "tumse mohabbat",
      "teri yaad",
      "tum kitne",
      "tum bahut",
      "mujhe tumse",
    ];
  }

  // Validate HF token
  getHFToken() {
    const token = process.env.HF_TOKEN;
    if (!token) throw new Error("HF_TOKEN environment variable is required");
    if (typeof token !== "string") throw new Error("HF_TOKEN must be a string");
    if (!token.trim()) throw new Error("HF_TOKEN cannot be empty");
    return token.trim();
  }

  // Get Gemini model
  getModel(model = "gemini-2.5-flash") {
    return this.client?.getGenerativeModel?.({ model });
  }

  // Enhanced language detection
  detectLanguage(text) {
    if (!text || typeof text !== "string") return "english";

    const hindiPattern = /[\u0900-\u097F]/; // Devanagari script
    const englishPattern = /[a-zA-Z]/;
    const hasDevanagari = hindiPattern.test(text);
    const hasEnglish = englishPattern.test(text);

    // Check for Roman Hindi words
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/);
    const romanHindiCount = words.filter((word) =>
      this.romanHindiWords.includes(word)
    ).length;

    const hasRomanHindi = romanHindiCount > 0;

    // Language classification logic
    if (hasDevanagari && hasEnglish) return "mixed";
    if (hasDevanagari && hasRomanHindi) return "mixed";
    if (hasEnglish && hasRomanHindi && romanHindiCount >= 2)
      return "roman_hindi";
    if (hasDevanagari) return "hindi";
    if (hasRomanHindi && romanHindiCount >= 2) return "roman_hindi";

    return "english";
  }

  // Enhanced tone detection
  detectTone(text) {
    if (!text || typeof text !== "string") return "neutral";

    const lower = text.toLowerCase();

    // Check for romantic/flirty content first (higher priority)
    const hasRomanticWords = this.romanticKeywords.some((word) =>
      lower.includes(word)
    );
    const hasFlirtyPhrases = this.flirtyPhrases.some((phrase) =>
      lower.includes(phrase)
    );

    if (hasRomanticWords || hasFlirtyPhrases) {
      // Additional context check for flirty vs friendly
      if (
        lower.includes("love you") ||
        lower.includes("miss you") ||
        lower.includes("pyaar") ||
        lower.includes("yaad")
      ) {
        return "flirty";
      }
      return "romantic";
    }

    // Other tone patterns
    if (lower.match(/\b(please|kindly|would you|could you|sir|madam)\b/))
      return "formal";
    if (lower.match(/\b(hey|yo|wassup|sup|bro|dude)\b/)) return "casual";
    if (lower.match(/\b(damn|wtf|angry|mad|furious|pissed)\b/)) return "angry";
    if (lower.match(/\b(sad|depressed|down|upset|crying)\b/)) return "sad";
    if (lower.match(/\b(happy|excited|yay|awesome|amazing|great)\b/))
      return "happy";
    if (lower.match(/\b(thanks|thank you|grateful|appreciate)\b/))
      return "friendly";

    return "neutral";
  }

  // Enhanced relationship detection
  detectRelationship(text) {
    if (!text || typeof text !== "string") return "unknown";

    const lower = text.toLowerCase();

    // Romantic indicators
    const romanticIndicators = [
      "love you",
      "miss you",
      "baby",
      "babe",
      "darling",
      "sweetheart",
      "meri jaan",
      "jaanu",
      "pyaar",
      "mohabbat",
      "tujhse pyaar",
    ];

    // Pet names and affectionate terms
    const petNames = [
      "motu",
      "chotu",
      "sweety",
      "cutie",
      "honey",
      "jaan",
      "jaanu",
    ];

    // Professional indicators
    const professionalIndicators = [
      "sir",
      "madam",
      "boss",
      "manager",
      "colleague",
      "meeting",
      "project",
      "deadline",
      "office",
      "work",
      "report",
    ];

    // Family indicators
    const familyIndicators = [
      "mom",
      "dad",
      "mother",
      "father",
      "sister",
      "brother",
      "mama",
      "papa",
      "mummy",
      "daddy",
      "bhai",
      "didi",
    ];

    // Friend indicators
    const friendIndicators = [
      "dost",
      "yaar",
      "buddy",
      "friend",
      "bro",
      "dude",
      "mate",
    ];

    if (
      romanticIndicators.some((indicator) => lower.includes(indicator)) ||
      petNames.some((name) => lower.includes(name))
    ) {
      return "romantic";
    }

    if (professionalIndicators.some((indicator) => lower.includes(indicator))) {
      return "colleague";
    }

    if (familyIndicators.some((indicator) => lower.includes(indicator))) {
      return "family";
    }

    if (friendIndicators.some((indicator) => lower.includes(indicator))) {
      return "friend";
    }

    return "unknown";
  }

  // Enhanced sentiment detection
  detectSentiment(text) {
    if (!text || typeof text !== "string") return "neutral";

    const lower = text.toLowerCase();

    const positive = [
      "good",
      "great",
      "awesome",
      "happy",
      "love",
      "excellent",
      "amazing",
      "wonderful",
      "fantastic",
      "perfect",
      "beautiful",
      "nice",
      "glad",
      "excited",
      "thrilled",
      "delighted",
      "pleased",
      "satisfied",
      // Hindi/Roman Hindi positive words
      "acha",
      "accha",
      "badiya",
      "mast",
      "zabardast",
      "kamaal",
    ];

    const negative = [
      "bad",
      "terrible",
      "sad",
      "hate",
      "awful",
      "horrible",
      "angry",
      "worst",
      "disappointed",
      "upset",
      "frustrated",
      "annoyed",
      "mad",
      "furious",
      "depressed",
      "miserable",
      "pathetic",
      // Hindi/Roman Hindi negative words
      "bura",
      "ganda",
      "bekaar",
      "ghatiya",
      "pareshan",
    ];

    const positiveCount = positive.filter((word) =>
      lower.includes(word)
    ).length;
    const negativeCount = negative.filter((word) =>
      lower.includes(word)
    ).length;

    if (positiveCount > negativeCount) return "positive";
    if (negativeCount > positiveCount) return "negative";
    return "neutral";
  }

  // Grammar correction
  async correctGrammar(text) {
    try {
      if (!this.client) {
        console.log("No Gemini API key found, using original text");
        return text;
      }

      const model = this.getModel();
      const prompt = `Correct the grammar and spelling of the following sentence (may be English, Roman Hindi, or Hindi). Return ONLY the corrected sentence (no extra commentary).
      
Input: ${text}`;

      const result = await model.generateContent(prompt);
      const raw =
        result?.response?.text?.()?.trim?.() ||
        result?.response?.text?.trim?.() ||
        result?.text?.trim?.();

      return (raw || text).replace(/^["']|["']$/g, "");
    } catch (error) {
      console.error("Grammar correction error:", error);
      return text;
    }
  }

  // Tone adjustment
  async adjustTone(text, tone) {
    try {
      if (!this.client) {
        return this.applySimpleTone(text, tone);
      }

      const toneInstructions = {
        formal: "Make it formal and professional.",
        casual: "Make it casual and relaxed.",
        friendly: "Make it sound warm and friendly.",
        professional: "Make it professional and concise.",
        flirty: "Make it more flirtatious and playful.",
        romantic: "Make it more romantic and loving.",
      };

      const instruction = toneInstructions[tone] || `Adjust tone to ${tone}`;
      const model = this.getModel();
      const prompt = `Rewrite the following sentence to be: ${instruction}
      Keep same language as input. Return only the rewritten sentence.
      
Input: ${text}`;

      const result = await model.generateContent(prompt);
      const raw =
        result?.response?.text?.()?.trim?.() || result?.text?.trim?.();

      return (raw || text).replace(/^["']|["']$/g, "");
    } catch (error) {
      console.error("Tone adjustment error:", error);
      return this.applySimpleTone(text, tone);
    }
  }

  // Simple tone adjustment fallback
  applySimpleTone(text, tone) {
    if (!text || typeof text !== "string") return text;

    switch (tone) {
      case "formal":
        return text
          .replace(/\bhey\b/gi, "Hello")
          .replace(/\byeah\b/gi, "Yes")
          .replace(/\bnope\b/gi, "No")
          .replace(/\bokay\b/gi, "Certainly")
          .replace(/\bthanks\b/gi, "Thank you");

      case "casual":
        return text
          .replace(/\bHello\b/gi, "Hey")
          .replace(/\bThank you\b/gi, "Thanks");

      case "friendly":
        return text.endsWith("!") ? text + " 😊" : text + "! 😊";

      case "professional":
        return `I would like to mention that ${text
          .toLowerCase()
          .replace(/^./, (s) => s.toUpperCase())}.`;

      default:
        return text;
    }
  }

  // Generate embeddings with fallback models
  async generateMessageEmbedding(text) {
    if (!text || text.trim().length === 0) {
      throw new Error("Text cannot be empty for embedding");
    }

    if (!this.hfClient) {
      throw new Error("Hugging Face client not initialized");
    }

    // Try each model until one works
    for (const modelName of this.embeddingModels) {
      try {
        const output = await this.hfClient.featureExtraction({
          model: modelName,
          inputs: text,
        });
        return output; // Return successful result
      } catch (modelError) {
        console.warn(`⚠️ Model ${modelName} failed, trying next...`);
        // If this is the last model, throw the error
        if (
          modelName === this.embeddingModels[this.embeddingModels.length - 1]
        ) {
          throw new Error(
            `All embedding models failed. Last error: ${modelError.message}`
          );
        }
      }
    }
  }

  // Enhanced message analysis
  async analyzeMessageForVector(messageText) {
    const fallback = {
      language: this.detectLanguage(messageText),
      tone: this.detectTone(messageText),
      relationship: this.detectRelationship(messageText),
      context: messageText.substring(0, 120),
      sentiment: this.detectSentiment(messageText),
      keywords: this.extractKeywords(messageText),
      isQuestion: messageText.includes("?"),
      isResponse: this.detectResponse(messageText),
    };

    try {
      if (!this.client) {
        return fallback;
      }

      const model = this.getModel();
      const prompt = `Analyze this message and return ONLY a JSON object:
{
  "language": "english|hindi|roman_hindi|mixed",
  "tone": "formal|casual|friendly|flirty|romantic|professional|angry|sad|happy|neutral",
  "relationship": "friend|colleague|boss|romantic|family|unknown",
  "context": "brief description (1-2 words)",
  "sentiment": "positive|negative|neutral",
  "keywords": ["key","words"],
  "isQuestion": true/false,
  "isResponse": true/false
}

Message: ${messageText}`;

      const result = await model.generateContent(prompt);
      const raw =
        result?.response?.text?.()?.trim?.() || result?.text?.trim?.();

      if (!raw) return fallback;

      try {
        return JSON.parse(raw);
      } catch (parseError) {
        // Try to fix common JSON issues
        const fixed = raw
          .replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":')
          .replace(/'/g, '"');

        try {
          return JSON.parse(fixed);
        } catch {
          return fallback;
        }
      }
    } catch (error) {
      console.error("Message analysis error:", error);
      return fallback;
    }
  }

  // Enhanced keyword extraction
  extractKeywords(text) {
    if (!text || typeof text !== "string") return [];

    const stopWords = [
      "the",
      "and",
      "for",
      "are",
      "but",
      "not",
      "you",
      "all",
      "can",
      "had",
      "her",
      "was",
      "one",
      "our",
      "out",
      "day",
      "get",
      "has",
      "him",
      "his",
      "how",
      "its",
      "new",
      "now",
      "old",
      "see",
      "two",
      "way",
      "who",
      "boy",
      "did",
      "man",
      "may",
      "she",
      "use",
      "her",
      "what",
      "with",
      "this",
      "that",
      "from",
      "they",
      "know",
      "want",
      "been",
      "good",
      "much",
      "some",
      "time",
      // Common Hindi/Roman Hindi stop words
      "hai",
      "hoon",
      "ho",
      "hain",
      "ka",
      "ki",
      "ke",
      "ko",
      "se",
      "me",
      "par",
    ];

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.includes(word))
      .slice(0, 8); // Increased from 5 to 8 for better keyword extraction
  }

  // Enhanced response detection
  detectResponse(text) {
    if (!text || typeof text !== "string") return false;

    const lower = text.toLowerCase();
    const indicators = [
      "yes",
      "no",
      "okay",
      "ok",
      "sure",
      "alright",
      "got it",
      "thanks",
      "welcome",
      "yeah",
      "yep",
      "nope",
      "right",
      "correct",
      "exactly",
      // Hindi/Roman Hindi response indicators
      "haan",
      "han",
      "nahi",
      "nahin",
      "theek",
      "accha",
      "bilkul",
    ];

    return indicators.some((indicator) => lower.includes(indicator));
  }
}

module.exports = new AIService();
