# ⚡ Hangman AI Arena

A professional, high-performance multiplayer Hangman experience powered by **Gemini 1.5 Flash**. Play with friends in real-time, chat, and challenge a "Smart AI" that generates creative words and hints.

![Hangman Arena](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## 🚀 Features

- **🌐 Real-time Multiplayer**: Join rooms with unique frequencies and play with up to 8 friends simultaneously.
- **🧠 Smart AI Integration**: AI-driven word generation and hints using Google Gemini.
- **💬 Neural Comm Link**: Integrated real-time chat to strategize or taunt your opponents.
- **🎨 Cyberpunk UI/UX**: A dark, futuristic interface with smooth Framer Motion animations and glassmorphism.
- **🤖 AI Crew Members**: Add AI bots to your lobby if you're short on players.
- **📊 Global Scoreboard**: Track points and dominate the arena.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend**: Node.js, Socket.io (Real-time WebSockets)
- **AI**: Google Generative AI (Gemini 1.5 Flash)
- **Language**: TypeScript

## 🏃 Local Setup

1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file in the root directory (use `.env.example` as a template):
   ```env
   GEMINI_API_KEY=your_actual_key_here
   PORT=3000
   ```

3. **Launch the Arena**:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` to play!

## 🎮 How to Play

1. **Enter the Arena**: Choose a display name and room code.
2. **Lobby**: Wait for friends or add AI bots.
3. **The Game**:
   - One player (the **Setter**) chooses a secret word or lets the AI pick one.
   - Others take turns guessing letters.
   - Use the **Comm Link** (Chat) to communicate with the crew.
4. **Victory**: Guess the word before the structural integrity (Hangman) collapses!

---
*Built with ⚡ by Gemini CLI*