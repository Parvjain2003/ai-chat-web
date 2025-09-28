# AI Chat Web

A modern, intelligent messaging platform that combines real-time communication with AI-powered text enhancement—such as grammar correction and tone adjustment—along with an integrated AI assistant capable of analyzing conversations and suggesting context-aware replies.

⚡ I’m actively working on this project and add new features or improvements almost every week.

---

## 🚀 Features

### Core Messaging
- **Real-time Chat** – Instant messaging with Socket.io  
- **User Discovery** – Search and connect with users by ID or phone number  
- **Message Status** – Track sent, delivered, and read receipts  
- **Online Status** – View active users in real-time  

### AI Enhancement
- **Grammar Correction** – Automatically fix grammar and spelling mistakes  
- **Tone Adjustment** – Adjust message tone to:  
  - Formal  
  - Casual  
  - Friendly  
  - Professional  
- **AI Chat Assistant** – Provides conversation suggestions, summarization, and context-aware replies  
- **Multi-language Support** – Handles mixed languages (e.g., Hindi-English, Hinglish style)  
- **Conversation Analysis** – AI analyzes recent chat history to adapt suggestions and maintain context  

### User Experience
- **Responsive Design** – Works seamlessly on desktop and mobile  
- **Dark/Light Theme Support** – Comfortable viewing in any environment  
- **Message History** – Persistent chat history with MongoDB  
- **Unread Message Counter** – Never miss important updates  

---

## 🛠️ Tech Stack

### Frontend
- **React.js** – Modern UI framework  
- **Tailwind CSS** – Utility-first styling  
- **Socket.io Client** – Real-time communication  
- **Axios** – HTTP client for API calls  
- **React Router** – Client-side routing  
- **React Hot Toast** – Notifications  

### Backend
- **Node.js** – JavaScript runtime  
- **Express.js** – Web framework  
- **Socket.io** – Real-time bidirectional communication  
- **MongoDB + Mongoose** – NoSQL database with object modeling  
- **JWT** – Authentication with JSON Web Tokens  
- **bcrypt** – Password hashing  

### AI Integration
- **LangChain** – Orchestration framework for AI workflows
- ***Gemini API*** -  Text enhancement (grammar, tone, suggestions)  
- **Hugging Face Inference API** – embeddings  
- **Conversation Context Engine** – Uses embeddings to analyze chat history and generate intelligent replies  

---

### Ongoing Development
⚡ I’m actively working on improving the **AI agent** functionality in this project.  
This includes making the conversation context engine smarter, adding more intelligent suggestions, and expanding features to make the chat experience more accurate and context-aware.  
Expect new updates and enhancements almost every week!

---

## 📸 Screenshots

![Homepage](https://github.com/Parvjain2003/ai-chat-web/raw/main/screenshots/homepage.png)
*The homepage showcasing the chat interface.*

![Chat Interface](https://github.com/Parvjain2003/ai-chat-web/raw/main/screenshots/chat-interface.png)
*The chat interface with real-time messaging and AI suggestions.*

---

## ⚙️ Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (for cloud database)

### Steps

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Parvjain2003/ai-chat-web.git
   cd ai-chat-web

2. **Setup the backend**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update .env with your MongoDB URI and API key
   node server.js

3. **Setup the frontend**:
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   # Update .env with your backend API URL
   npm start 

