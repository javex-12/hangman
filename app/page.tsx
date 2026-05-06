'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Plus, X, Eye, EyeOff, User, Target, 
  AlertCircle, Loader2, RefreshCw, Bot, Send, 
  MessageSquare, Trophy, Hash, Users, Zap, Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

interface Player {
  id: string;
  name: string;
  score: number;
  isBot?: boolean;
}

interface Room {
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
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const CATEGORIES = [
  { label: '🎬 Movies',    words: ['INCEPTION','AVATAR','TITANIC','GLADIATOR','INTERSTELLAR'] },
  { label: '🐾 Animals',   words: ['ELEPHANT','PLATYPUS','CHAMELEON','NARWHAL','AXOLOTL'] },
  { label: '🌍 Countries', words: ['BRAZIL','SWITZERLAND','MADAGASCAR','MOZAMBIQUE'] },
  { label: '🍕 Food',      words: ['GUACAMOLE','CROISSANT','QUESADILLA','BRUSCHETTA'] },
];

let socket: Socket;

export default function HangmanGame() {
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  
  // Local states
  const [inApp, setInApp] = useState(false);
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [chatOpen, setChatOpen] = useState(true);

  useEffect(() => {
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomId.trim()) return;

    socket = io();

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_room', { roomId: roomId.toUpperCase(), name });
      setInApp(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setRoom(null);
      setInApp(false);
    });

    socket.on('room_state', (state: Room) => {
      setRoom(state);
    });

    socket.on('new_message', (msg: Message) => {
      setRoom(prev => prev ? { ...prev, messages: [...prev.messages, msg] } : null);
    });
  };

  if (!inApp) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-white flex items-center justify-center p-4 font-sans selection:bg-indigo-500/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_50%)]" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-[#16161a] border border-white/5 rounded-3xl p-8 md:p-12 w-full max-w-md shadow-2xl space-y-10"
        >
          <div className="text-center space-y-3">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/20"
            >
              <Zap className="w-8 h-8 text-white fill-current" />
            </motion.div>
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
              Hangman AI
            </h1>
            <p className="text-white/40 text-xs tracking-[0.2em] uppercase font-bold">Multiplayer Experience</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold ml-1">Captain Name</label>
              <input
                autoFocus
                type="text"
                maxLength={16}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all text-white placeholder:text-white/20"
                placeholder="Ex: Maverick"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold ml-1">Room Frequency</label>
              <input
                type="text"
                maxLength={8}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all uppercase text-white text-xl tracking-[0.3em] font-mono placeholder:text-white/20"
                placeholder="OMEGA"
                required
              />
            </div>
            <button
              type="submit"
              className="group w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 overflow-hidden relative"
            >
              <span className="relative z-10">Enter Arena</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
          </form>
          
          <div className="flex items-center justify-center gap-4 pt-4">
             <div className="h-px flex-1 bg-white/5" />
             <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Encrypted Connection</span>
             <div className="h-px flex-1 bg-white/5" />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <span className="text-white/40 text-xs font-mono tracking-widest uppercase">Connecting to Hive...</span>
        </div>
      </div>
    );
  }

  const me = room.players.find(p => p.id === socket?.id);
  const isSetter = room.setterId === socket?.id;
  const setterPlayer = room.players.find(p => p.id === room.setterId);
  const currentGuesser = room.players[room.guesserIdx];
  const isMyTurn = currentGuesser?.id === socket?.id;

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col md:flex-row">
      {/* Sidebar - Players & Room Info */}
      <aside className="w-full md:w-80 bg-[#111114] border-r border-white/5 flex flex-col p-6 gap-8 shrink-0">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
               <Zap className="w-5 h-5 text-white fill-current" />
             </div>
             <div>
               <h2 className="font-bold text-lg leading-tight">Room {room.id}</h2>
               <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Live Grid</span>
               </div>
             </div>
           </div>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Crew Members</span>
            <Users className="w-3 h-3 text-white/20" />
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {room.players.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-2xl border transition-all",
                    p.id === socket?.id ? "bg-indigo-500/10 border-indigo-500/20" : "bg-white/5 border-transparent hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center border",
                      p.isBot ? "bg-orange-500/10 border-orange-500/20" : "bg-white/10 border-white/10"
                    )}>
                      {p.isBot ? <Brain className="w-4 h-4 text-orange-500" /> : <User className="w-4 h-4 text-white/40" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold flex items-center gap-2">
                        {p.name}
                        {p.id === socket?.id && <span className="text-[8px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">YOU</span>}
                        {p.id === room.setterId && <Target className="w-3 h-3 text-rose-500" />}
                        {currentGuesser?.id === p.id && <Zap className="w-3 h-3 text-yellow-500 animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-white/30 font-mono">{p.score} PTS</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5">
           <button 
             onClick={() => setChatOpen(!chatOpen)}
             className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
           >
             <div className="flex items-center gap-2">
               <MessageSquare className="w-4 h-4 text-white/40" />
               <span className="text-xs font-bold uppercase tracking-widest">Comm Link</span>
             </div>
             <div className="px-2 py-0.5 rounded-full bg-indigo-500 text-[10px] font-bold">
               {room.messages.length}
             </div>
           </button>
        </div>
      </aside>

      {/* Main Arena */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.05),transparent_70%)] pointer-events-none" />
        
        <AnimatePresence mode="wait">
          {room.status === 'lobby' && (
            <LobbyScreen key="lobby" room={room} me={me} />
          )}
          {room.status === 'setting' && (
            <SetterScreen key="setting" room={room} isSetter={isSetter} setterName={setterPlayer?.name || 'Someone'} />
          )}
          {room.status === 'playing' && (
            <GameScreen key="playing" room={room} isMyTurn={isMyTurn} currentGuesserName={currentGuesser?.name} setterName={setterPlayer?.name || 'Unknown'} />
          )}
          {room.status === 'score' && (
            <ScoreScreen key="score" room={room} />
          )}
        </AnimatePresence>
      </main>

      {/* Chat Component */}
      <AnimatePresence>
        {chatOpen && (
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full md:w-80 bg-[#111114] border-l border-white/5 flex flex-col shrink-0"
          >
            <ChatWindow room={room} socket={socket} />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

function LobbyScreen({ room, me }: { room: Room, me?: Player }) {
  const isReady = room.players.length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-xl flex flex-col gap-10 text-center"
    >
      <div className="space-y-4">
        <h2 className="text-5xl font-black tracking-tighter">PREPARING ARENA</h2>
        <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-xs">Waiting for deployment clearance</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center gap-4 group hover:bg-white/10 transition-all">
           <Users className="w-8 h-8 text-indigo-500" />
           <div className="text-2xl font-bold">{room.players.length} / 8</div>
           <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Crew Size</div>
        </div>
        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center gap-4 group hover:bg-white/10 transition-all">
           <Zap className="w-8 h-8 text-yellow-500" />
           <div className="text-2xl font-bold">{room.players.filter(p => p.isBot).length}</div>
           <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">AI Units</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => socket.emit('start_game')}
          disabled={!isReady}
          className="flex-1 bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-white/20 font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg uppercase tracking-tighter shadow-xl shadow-white/5"
        >
          <Play className="w-6 h-6 fill-current" />
          {isReady ? 'Launch Match' : 'Awaiting Crew'}
        </button>
        <button
          onClick={() => socket.emit('add_bot')}
          disabled={room.players.length >= 8}
          className="bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 text-white font-bold px-8 py-5 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-tighter"
        >
          <Bot className="w-6 h-6" />
          Add AI
        </button>
      </div>
    </motion.div>
  );
}

function SetterScreen({ room, isSetter, setterName }: { room: Room, isSetter: boolean, setterName: string }) {
  const [word, setWord] = useState('');
  const [hint, setHint] = useState('');
  const [show, setShow] = useState(false);

  const isValid = word.replace(/[^A-Z]/ig, '').length >= 2;

  const handleLock = () => {
    if (isValid) {
      socket.emit('set_word', { word: word.replace(/[^A-Z]/ig, ''), hint });
    }
  };

  if (!isSetter) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="text-center space-y-8"
      >
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin" />
          <Brain className="absolute inset-0 m-auto w-10 h-10 text-indigo-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tighter uppercase">{setterName} is picking...</h2>
          <p className="text-white/40 text-xs font-bold uppercase tracking-[0.3em]">Neural link establishing</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#16161a] border border-white/5 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl space-y-8 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/50" />
      
      <div className="space-y-1">
        <h2 className="text-4xl font-black tracking-tighter uppercase italic">Target Locked</h2>
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">You are the word setter</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold italic">Neural Presets</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.label}
              onClick={() => {
                const w = cat.words[Math.floor(Math.random() * cat.words.length)];
                setWord(w);
                setHint(cat.label);
              }}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/60 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all flex items-center gap-2"
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t border-white/5">
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={word}
            onChange={(e) => setWord(e.target.value.toUpperCase())}
            placeholder="ENTER SECRET WORD"
            maxLength={20}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-14 outline-none focus:border-indigo-500 font-black tracking-[0.2em] uppercase transition-all text-white placeholder:text-white/10"
          />
          <button
            onClick={() => setShow(!show)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
          >
            {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <input
          type="text"
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="OPTIONAL INTEL (HINT)"
          maxLength={40}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 text-xs font-bold transition-all text-white placeholder:text-white/10"
        />
        <button
          onClick={handleLock}
          disabled={!isValid}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 disabled:text-white/20 text-white font-black py-5 rounded-2xl transition-all uppercase tracking-tighter text-lg italic shadow-lg shadow-indigo-600/20"
        >
          Confirm Payload
        </button>
      </div>
    </motion.div>
  );
}

function GameScreen({ room, isMyTurn, currentGuesserName, setterName }: { room: Room, isMyTurn: boolean, currentGuesserName?: string, setterName: string }) {
  
  const handleKey = (l: string) => {
    if (isMyTurn) socket.emit('guess_letter', l);
  };
  
  const handlePass = () => {
    if (isMyTurn) socket.emit('pass_turn');
  };

  const wordLetters = room.word.split('');
  
  const hangmanParts = [
    // Head
    <motion.circle key="head" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} cx="200" cy="70" r="20" stroke="white" strokeWidth="6" fill="none" />,
    // Body
    <motion.line key="body" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1="200" y1="90" x2="200" y2="150" stroke="white" strokeWidth="6" strokeLinecap="round" />,
    // Left Arm
    <motion.line key="larm" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1="200" y1="110" x2="160" y2="140" stroke="white" strokeWidth="6" strokeLinecap="round" />,
    // Right Arm
    <motion.line key="rarm" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1="200" y1="110" x2="240" y2="140" stroke="white" strokeWidth="6" strokeLinecap="round" />,
    // Left Leg
    <motion.line key="lleg" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1="200" y1="150" x2="170" y2="190" stroke="white" strokeWidth="6" strokeLinecap="round" />,
    // Right Leg
    <motion.line key="rleg" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1="200" y1="150" x2="230" y2="190" stroke="white" strokeWidth="6" strokeLinecap="round" />,
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl flex flex-col gap-8"
    >
      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex items-center gap-4">
           <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
             <Target className="w-5 h-5 text-indigo-500" />
           </div>
           <div>
             <div className="text-[10px] text-white/30 uppercase font-black tracking-widest">Setter</div>
             <div className="font-bold">{setterName}</div>
           </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex items-center gap-4">
           <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
             <AlertCircle className="w-5 h-5 text-amber-500" />
           </div>
           <div className="flex-1">
             <div className="text-[10px] text-white/30 uppercase font-black tracking-widest">Intel</div>
             <div className="font-bold truncate max-w-[150px]">{room.hint || "No Intel Provided"}</div>
           </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex items-center justify-center">
           <div className="text-center">
             <div className="text-[10px] text-white/30 uppercase font-black tracking-widest">Structural Integrity</div>
             <div className="flex gap-1 justify-center mt-1">
                {Array.from({ length: room.maxWrong }).map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-4 h-1.5 rounded-full transition-all duration-500",
                      i < room.wrongCount ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : "bg-white/10"
                    )}
                  />
                ))}
             </div>
           </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Hangman Visualization */}
        <div className="bg-[#16161a] border border-white/5 rounded-[2.5rem] p-10 flex-shrink-0 flex items-center justify-center shadow-2xl relative group">
          <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
          <svg viewBox="0 0 300 250" className="w-[240px] h-auto relative z-10">
            <line x1="60" y1="230" x2="240" y2="230" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeLinecap="round"/>
            <line x1="120" y1="230" x2="120" y2="30" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeLinecap="round"/>
            <line x1="120" y1="30" x2="200" y2="30" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeLinecap="round"/>
            <line x1="200" y1="30" x2="200" y2="60" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeLinecap="round"/>
            {hangmanParts.slice(0, room.wrongCount)}
          </svg>
        </div>

        {/* Word and Controls */}
        <div className="flex-1 flex flex-col gap-8 justify-center">
           <div className={cn(
             "w-fit px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2",
             isMyTurn ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-white/5 text-white/30"
           )}>
             {isMyTurn ? <Zap className="w-3 h-3 fill-current" /> : <Loader2 className="w-3 h-3 animate-spin" />}
             {isMyTurn ? "Your Execution Turn" : `Intercepting ${currentGuesserName}...`}
           </div>

           <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
             {wordLetters.map((l, i) => {
               const revealed = room.guessedLetters.includes(l);
               return (
                 <div key={i} className="flex flex-col items-center gap-2">
                   <motion.span 
                     initial={false}
                     animate={revealed ? { y: 0, opacity: 1, scale: 1 } : { y: 10, opacity: 0, scale: 0.5 }}
                     className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter h-12 flex items-center"
                   >
                     {revealed ? l : ''}
                   </motion.span>
                   <div className={cn(
                     "h-1.5 w-10 md:w-12 rounded-full transition-all duration-700",
                     revealed ? "bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.5)]" : "bg-white/10"
                   )} />
                 </div>
               );
             })}
           </div>

           {/* Keyboard */}
           <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {ALPHABET.map(l => {
                  const used = room.guessedLetters.includes(l);
                  const isCorrect = used && room.word.includes(l);
                  return (
                    <button
                      key={l}
                      disabled={!isMyTurn || used}
                      onClick={() => handleKey(l)}
                      className={cn(
                        "w-9 h-11 md:w-11 md:h-14 rounded-xl font-black text-lg transition-all flex items-center justify-center border",
                        used 
                          ? isCorrect 
                            ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400" 
                            : "bg-rose-500/10 border-rose-500/20 text-rose-500/30"
                          : isMyTurn 
                            ? "bg-white/5 border-white/10 hover:bg-white text-black hover:-translate-y-1 shadow-sm" 
                            : "bg-white/5 border-white/10 text-white/20 opacity-50 cursor-not-allowed"
                      )}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>

              {isMyTurn && (
                <button
                  onClick={handlePass}
                  className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest italic"
                >
                  Skip Pulse Segment &rarr;
                </button>
              )}
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function ScoreScreen({ room }: { room: Room }) {
  const isWin = room.word.split('').every(l => room.guessedLetters.includes(l));
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#16161a] border border-white/5 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl space-y-10 relative overflow-hidden"
    >
      <div className={cn(
        "absolute inset-x-0 top-0 h-1",
        isWin ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]"
      )} />

      <div className="text-center space-y-4">
        <div className="inline-block p-4 rounded-3xl bg-white/5 border border-white/10 mb-2">
           {isWin ? <Trophy className="w-12 h-12 text-yellow-500 fill-current" /> : <X className="w-12 h-12 text-rose-500" />}
        </div>
        <h2 className="text-4xl font-black tracking-tighter italic uppercase">
          {isWin ? "Victory Achieved" : "Neural Collapse"}
        </h2>
        {!isWin && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
             <div className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">Target Identity</div>
             <div className="text-2xl font-black tracking-[0.3em] text-white italic">{room.word}</div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold italic">Hall of Fame</span>
          <Hash className="w-3 h-3 text-white/20" />
        </div>
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
          {sortedPlayers.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl border transition-all",
                i === 0 && p.score > 0 ? "bg-indigo-500/10 border-indigo-500/20" : "bg-white/5 border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="font-black italic text-white/20 w-4">{i + 1}</span>
                <span className="font-bold text-sm">{p.name}</span>
              </div>
              <span className="font-mono font-bold text-xs">{p.score} <span className="text-[8px] text-white/40">PTS</span></span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 pt-4">
        <div className="flex items-center gap-3 text-white/20 text-[10px] font-black uppercase tracking-[0.2em] italic">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Recalibrating for next cycle...
        </div>
      </div>
    </motion.div>
  );
}

function ChatWindow({ room, socket }: { room: Room, socket: Socket }) {
  const [msg, setMsg] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [room.messages]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (msg.trim()) {
      socket.emit('send_message', msg);
      setMsg('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-white italic flex items-center gap-2">
           <MessageSquare className="w-4 h-4 text-indigo-500" />
           Communications
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {room.messages.map((m) => (
          <div 
            key={m.id} 
            className={cn(
              "flex flex-col gap-1 max-w-[85%]",
              m.senderId === socket.id ? "ml-auto items-end" : "items-start"
            )}
          >
            <div className="flex items-center gap-2 px-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/30 italic">
                {m.senderName}
              </span>
            </div>
            <div className={cn(
              "px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed",
              m.senderId === socket.id ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white/5 text-white/80 rounded-tl-none border border-white/5"
            )}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="p-4 bg-[#0a0a0b] border-t border-white/5">
        <div className="relative">
          <input
            type="text"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Type transmission..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-xs font-medium outline-none focus:border-indigo-500/50 transition-all text-white placeholder:text-white/20"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-500 hover:text-white transition-colors"
          >
            <Send className="w-4 h-4 fill-current" />
          </button>
        </div>
      </form>
    </div>
  );
}