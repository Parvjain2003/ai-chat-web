// services/vectorService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

class VectorEmbeddingService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.client = null;
    
    if (this.apiKey) {
      this.client = new GoogleGenerativeAI(this.apiKey);
    } else {
      console.warn("⚠️ GEMINI_API_KEY not found, vector embeddings will be disabled");
    }
  }

  // Generate embeddings for text using Gemini
  async generateEmbedding(text) {
    if (!this.client || !text) return null;

    try {
      const model = this.client.getGenerativeModel({ model: "embedding-001" });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error("Embedding generation error:", error);
      return null;
    }
  }

  // Generate conversation summary and embeddings
  async analyzeConversation(messages, participants) {
    if (!messages || messages.length === 0) return null;

    try {
      // Prepare conversation text
      const conversationText = messages.map(msg => 
        `${msg.sender.fullName || msg.sender.userId}: ${msg.content}`
      ).join('\n');

      // Generate summary using Gemini
      const summaryModel = this.client.getGenerativeModel({ model: "gemini-2.5-flash" });
      const summaryPrompt = `
Analyze this conversation and provide a JSON response with the following structure:
{
  "summary": "Brief summary of the conversation",
  "topics": ["topic1", "topic2", "topic3"],
  "sentiment": "positive/negative/neutral",
  "relationship": "friend/family/colleague/romantic/other",
  "language": "english/hindi/roman_hindi/mixed",
  "formality": "formal/informal/casual",
  "dominant_emotion": "happy/sad/angry/excited/neutral",
  "key_themes": ["theme1", "theme2"],
  "conversation_stage": "greeting/ongoing/ending/conflict/planning"
}

Conversation:
${conversationText}

Participants: ${participants.map(p => p.fullName).join(', ')}
`;

      const summaryResult = await summaryModel.generateContent(summaryPrompt);
      let analysis;
      
      try {
        analysis = JSON.parse(summaryResult.response.text());
      } catch (parseError) {
        // Fallback analysis
        analysis = {
          summary: "Active conversation between participants",
          topics: ["general chat"],
          sentiment: "neutral",
          relationship: "friend",
          language: "english",
          formality: "casual",
          dominant_emotion: "neutral",
          key_themes: ["conversation"],
          conversation_stage: "ongoing"
        };
      }

      // Generate embeddings for the conversation
      const embedding = await this.generateEmbedding(
        `${analysis.summary} Topics: ${analysis.topics.join(', ')} Sentiment: ${analysis.sentiment}`
      );

      return {
        embedding,
        summary: analysis.summary,
        topics: analysis.topics,
        sentiment: analysis.sentiment,
        relationship: analysis.relationship,
        language: analysis.language,
        metadata: {
          formality: analysis.formality,
          dominant_emotion: analysis.dominant_emotion,
          key_themes: analysis.key_themes,
          conversation_stage: analysis.conversation_stage,
          message_count: messages.length,
          last_updated: new Date()
        }
      };

    } catch (error) {
      console.error("Conversation analysis error:", error);
      return null;
    }
  }

  // Analyze individual message
  async analyzeMessage(messageContent, conversationContext = null) {
    if (!messageContent) return null;

    try {
      const analysisPrompt = `
Analyze this message and provide JSON response:
{
  "sentiment": "positive/negative/neutral",
  "emotion": "happy/sad/angry/excited/surprised/disgusted/fearful/neutral",
  "topics": ["topic1", "topic2"],
  "language": "english/hindi/roman_hindi/mixed",
  "formality": "formal/informal/casual",
  "intent": "question/request/information/greeting/goodbye/complaint/compliment/other",
  "urgency": "high/medium/low",
  "contains_question": true/false,
  "contains_request": true/false
}

Message: "${messageContent}"
${conversationContext ? `Context: ${conversationContext}` : ''}
`;

      const model = this.client.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(analysisPrompt);
      
      let analysis;
      try {
        analysis = JSON.parse(result.response.text());
      } catch (parseError) {
        analysis = {
          sentiment: "neutral",
          emotion: "neutral",
          topics: ["general"],
          language: "english",
          formality: "casual",
          intent: "other",
          urgency: "low",
          contains_question: messageContent.includes('?'),
          contains_request: messageContent.toLowerCase().includes('please') || 
                           messageContent.toLowerCase().includes('can you')
        };
      }

      // Generate embedding for the message
      const embedding = await this.generateEmbedding(messageContent);

      return {
        embedding,
        ...analysis
      };

    } catch (error) {
      console.error("Message analysis error:", error);
      return null;
    }
  }

  // Find similar conversations using vector similarity
  async findSimilarConversations(targetEmbedding, conversationVectors, limit = 5) {
    if (!targetEmbedding || !conversationVectors || conversationVectors.length === 0) {
      return [];
    }

    try {
      const similarities = conversationVectors.map(conv => {
        if (!conv.conversationVector || !conv.conversationVector.embedding) {
          return { conversation: conv, similarity: 0 };
        }

        const similarity = this.cosineSimilarity(
          targetEmbedding, 
          conv.conversationVector.embedding
        );

        return { 
          conversation: conv, 
          similarity: similarity || 0 
        };
      });

      // Sort by similarity (highest first) and return top results
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

    } catch (error) {
      console.error("Similar conversations search error:", error);
      return [];
    }
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(vectorA, vectorB) {
    if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
      return 0;
    }

    try {
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;

      for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        normA += vectorA[i] * vectorA[i];
        normB += vectorB[i] * vectorB[i];
      }

      normA = Math.sqrt(normA);
      normB = Math.sqrt(normB);

      if (normA === 0 || normB === 0) return 0;
      
      return dotProduct / (normA * normB);
    } catch (error) {
      console.error("Cosine similarity calculation error:", error);
      return 0;
    }
  }

  // Update conversation vector based on new messages
  async updateConversationVector(conversationId, newMessages, existingVector = null) {
    try {
      const Message = require("../models/Message");
      const Conversation = require("../models/Conversation");

      // Get conversation with participants
      const conversation = await Conversation.findById(conversationId)
        .populate('participants', 'userId fullName');

      if (!conversation) return null;

      // Get recent messages for analysis
      const recentMessages = await Message.find({
        conversation: conversationId
      })
      .populate('sender', 'userId fullName')
      .sort({ createdAt: -1 })
      .limit(50);

      if (!recentMessages || recentMessages.length === 0) return null;

      // Analyze conversation
      const analysis = await this.analyzeConversation(
        recentMessages.reverse(), 
        conversation.participants
      );

      if (analysis) {
        // Update conversation document
        await Conversation.findByIdAndUpdate(conversationId, {
          conversationVector: {
            embedding: analysis.embedding,
            summary: analysis.summary,
            topics: analysis.topics,
            sentiment: analysis.sentiment,
            relationship: analysis.relationship,
            language: analysis.language,
            lastUpdated: new Date()
          }
        });

        return analysis;
      }

      return null;
    } catch (error) {
      console.error("Update conversation vector error:", error);
      return null;
    }
  }

  // Batch process messages for vector analysis
  async batchAnalyzeMessages(messages) {
    const results = [];
    
    for (const message of messages) {
      try {
        const analysis = await this.analyzeMessage(message.content);
        if (analysis) {
          results.push({
            messageId: message._id,
            analysis
          });
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error analyzing message ${message._id}:`, error);
      }
    }

    return results;
  }
}

module.exports = new VectorEmbeddingService();