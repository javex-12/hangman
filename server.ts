import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server, Socket } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// ---- Game State ----
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface Player {
  id: string; // socket.id
  name: string;
  score: number;
  isBot?: boolean;
}

export interface Room {
  id: string;
  players: Player[];
  status: 'lobby' | 'setting' | 'playing' | 'score';
  setterId: string | null;
  guesserIdx: number;
  word: string;
  hint: string;
  guessedLetters: string[];
  wrongCount: number;
  maxWrong: number;
  messages: Message[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  wordHistory: string[];
}

const rooms: Record<string, Room> = {};

function createRoom(roomId: string): Room {
  const room: Room = {
    id: roomId,
    players: [],
    status: 'lobby',
    setterId: null,
    guesserIdx: -1,
    word: '',
    hint: '',
    guessedLetters: [],
    wrongCount: 0,
    maxWrong: 6,
    messages: [],
    difficulty: 'Medium',
    wordHistory: [],
  };
  rooms[roomId] = room;
  return room;
}

async function getSmartWord(difficulty: string = 'Medium', history: string[] = []) {
  const complexity = difficulty === 'Easy' ? 'very common, everyday' : difficulty === 'Hard' ? 'slightly less common but still recognizable' : 'common and interesting';
  const historyContext = history.length > 0 ? `Do NOT use any of these words: ${history.slice(-10).join(', ')}.` : '';

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a friendly hangman word generator. Provide a ${complexity} English word that a person would definitely know. Format: WORD|HINT. Keep hints concise (max 10 words). ${historyContext}`
          },
          {
            role: "user",
            content: `Give me a ${difficulty} level word for hangman. Format: WORD|HINT.`
          }
        ],
        temperature: 0.8
      })
    });

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    const parts = text.split('|');
    const word = parts[0].toUpperCase().replace(/[^A-Z]/g, '');
    const hint = parts[1] || "A fun word to guess!";
    return { word, hint };
  } catch (err) {
    console.error("Groq Error:", err);
    return { word: "FRIENDLY", hint: "Being kind and nice to others" };
  }
}

async function handleBotTurn(io: Server, roomId: string) {
  const room = getRoom(roomId);
  if (!room) return;

  if (room.status === 'setting') {
    const setter = room.players.find(p => p.id === room.setterId);
    if (setter?.isBot) {
      const { word, hint } = await getSmartWord(room.difficulty, room.wordHistory);
      const r = getRoom(roomId);
      if (r && r.status === 'setting' && r.setterId === setter.id) {
        r.word = word;
        r.hint = hint;
        r.wordHistory.push(word);
        if (r.wordHistory.length > 20) r.wordHistory.shift();
        r.guessedLetters = [];
        r.wrongCount = 0;
        r.status = 'playing';
        broadcastRoom(io, roomId);
        handleBotTurn(io, roomId);
      }
    }
  } else if (room.status === 'playing') {
    const guesser = room.players[room.guesserIdx];
    if (guesser?.isBot) {
      setTimeout(() => {
        const r = getRoom(roomId);
        if (r && r.status === 'playing' && r.players[r.guesserIdx]?.id === guesser.id) {
          const available = ALPHABET.filter(l => !r.guessedLetters.includes(l));
          if (available.length > 0) {
            const frequencyOrder = ['E','T','A','O','I','N','S','H','R','D','L','C','U','M','W','F','G','Y','P','B','V','K','J','X','Q','Z'];
            let letter;

            if (r.difficulty === 'Easy') {
              letter = available[Math.floor(Math.random() * available.length)];
            } else if (r.difficulty === 'Hard') {
              const commonAvailable = frequencyOrder.filter(l => available.includes(l));
              letter = Math.random() > 0.85 ? available[Math.floor(Math.random() * available.length)] : commonAvailable[0];
            } else {
              const commonAvailable = frequencyOrder.filter(l => available.includes(l));
              letter = Math.random() > 0.5 ? commonAvailable[Math.floor(Math.random() * Math.min(4, commonAvailable.length))] : available[Math.floor(Math.random() * available.length)];
            }
            processGuess(io, roomId, guesser.id, letter);
          }
        }
      }, 1500);
    }
  }
}



function processGuess(io: Server, roomId: string, playerId: string, letter: string) {
  const room = getRoom(roomId);
  if (!room || room.status !== 'playing') return;
  
  const currentGuesserId = room.players[room.guesserIdx]?.id;
  if (playerId !== currentGuesserId) return;

  const upperLetter = letter.toUpperCase();
  if (room.guessedLetters.includes(upperLetter)) return;

  room.guessedLetters.push(upperLetter);

  if (!room.word.includes(upperLetter)) {
    room.wrongCount++;
  }

  const isWin = room.word.split('').every(l => room.guessedLetters.includes(l));
  const isLose = room.wrongCount >= room.maxWrong;

  if (isWin || isLose) {
    if (isWin) {
      const guesser = room.players[room.guesserIdx];
      if (guesser) guesser.score += 10;
    }
    room.status = 'score';
    broadcastRoom(io, roomId);

    setTimeout(async () => {
      const r = getRoom(roomId);
      if (r && r.status === 'score') {
        nextSetter(r);
        r.word = '';
        r.hint = '';
        r.guessedLetters = [];
        r.wrongCount = 0;
        r.status = 'setting';
        broadcastRoom(io, roomId);
        await handleBotTurn(io, roomId);
      }
    }, 5000);
  } else {
    nextGuesser(room);
    broadcastRoom(io, roomId);
    handleBotTurn(io, roomId);
  }
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server);

  io.on('connection', (socket: Socket) => {
    let currentRoomId: string | null = null;
    let playerName: string = '';

    socket.on('join_room', ({ roomId, name }: { roomId: string, name: string }) => {
      if (currentRoomId) {
        socket.leave(currentRoomId);
        const prevRoom = getRoom(currentRoomId);
        if (prevRoom) {
          prevRoom.players = prevRoom.players.filter(p => p.id !== socket.id);
          broadcastRoom(io, currentRoomId);
        }
      }

      currentRoomId = roomId;
      playerName = name;
      socket.join(roomId);

      let room = getRoom(roomId);
      if (!room) {
        room = createRoom(roomId);
      }

      room.players.push({
        id: socket.id,
        name: name,
        score: 0
      });

      broadcastRoom(io, roomId);
    });

    socket.on('send_message', (text: string) => {
      if (!currentRoomId) return;
      const room = getRoom(currentRoomId);
      if (room) {
        const msg: Message = {
          id: Math.random().toString(36).substr(2, 9),
          senderId: socket.id,
          senderName: playerName,
          text,
          timestamp: Date.now()
        };
        room.messages.push(msg);
        if (room.messages.length > 50) room.messages.shift();
        io.to(currentRoomId).emit('new_message', msg);
      }
    });

    socket.on('add_bot', () => {
      if (!currentRoomId) return;
      const room = getRoom(currentRoomId);
      if (room && room.status === 'lobby') {
        room.players.push({
          id: `bot_${Date.now()}_${Math.floor(Math.random()*1000)}`,
          name: 'Groq AI 🤖',
          score: 0,
          isBot: true
        });
        broadcastRoom(io, currentRoomId);
      }
    });

    socket.on('set_difficulty', (level: 'Easy' | 'Medium' | 'Hard') => {
      if (!currentRoomId) return;
      const room = getRoom(currentRoomId);
      if (room && (room.status === 'lobby' || room.status === 'score')) {
        room.difficulty = level;
        broadcastRoom(io, currentRoomId);
        
        // Push a chat notification about difficulty change
        const msg: Message = {
          id: `sys_${Date.now()}`,
          senderId: 'system',
          senderName: 'SYSTEM',
          text: `Difficulty set to ${level} ⚙️`,
          timestamp: Date.now()
        };
        room.messages.push(msg);
        io.to(currentRoomId).emit('new_message', msg);
      }
    });

    socket.on('start_game', async () => {
      if (!currentRoomId) return;
      const room = getRoom(currentRoomId);
      if (room && room.players.length >= 2 && room.status === 'lobby') {
        room.setterId = room.players[0].id;
        room.guesserIdx = 1;
        room.status = 'setting';
        broadcastRoom(io, currentRoomId);
        await handleBotTurn(io, currentRoomId);
      }
    });

    socket.on('set_word', ({ word, hint }: { word: string, hint: string }) => {
      if (!currentRoomId) return;
      const room = getRoom(currentRoomId);
      if (room && room.status === 'setting' && socket.id === room.setterId) {
        room.word = word.toUpperCase();
        room.hint = hint;
        room.guessedLetters = [];
        room.wrongCount = 0;
        room.status = 'playing';
        broadcastRoom(io, currentRoomId);
        handleBotTurn(io, currentRoomId);
      }
    });

    socket.on('guess_letter', (letter: string) => {
      if (!currentRoomId) return;
      processGuess(io, currentRoomId, socket.id, letter);
    });

    socket.on('pass_turn', () => {
       if (!currentRoomId) return;
       const room = getRoom(currentRoomId);
       if (!room || room.status !== 'playing') return;
       
       const currentGuesserId = room.players[room.guesserIdx]?.id;
       if (socket.id === currentGuesserId) {
          nextGuesser(room);
          broadcastRoom(io, currentRoomId);
          handleBotTurn(io, currentRoomId);
       }
    });

    socket.on('disconnect', () => {
      if (currentRoomId) {
        const room = getRoom(currentRoomId);
        if (room) {
          room.players = room.players.filter(p => p.id !== socket.id);
          
          if (room.players.length === 0 || room.players.every(p => p.isBot)) {
            delete rooms[currentRoomId];
          } else {
            if (room.setterId === socket.id) {
               nextSetter(room);
               room.word = '';
               room.hint = '';
               room.guessedLetters = [];
               room.wrongCount = 0;
               room.status = 'setting';
            } else {
               room.guesserIdx = room.guesserIdx % room.players.length;
               if (room.players[room.guesserIdx].id === room.setterId && room.players.length > 1) {
                 nextGuesser(room);
               }
            }
            if (room.players.length < 2 && room.status !== 'lobby') {
               room.status = 'lobby';
               room.setterId = null;
               room.guesserIdx = -1;
            }
            broadcastRoom(io, currentRoomId);
            if (room.status !== 'lobby') {
               handleBotTurn(io, currentRoomId);
            }
          }
        }
      }
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});