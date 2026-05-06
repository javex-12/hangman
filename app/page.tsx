'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Plus, X, Eye, EyeOff, User, Target, 
  AlertCircle, Loader2, RefreshCw, Bot, Send, 
  MessageSquare, Trophy, Hash, Users, Zap, Brain,
  ChevronRight, LayoutDashboard, Settings2, Sparkles,
  MessageCircle, Heart, Shield
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
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

let socket: Socket;

export default function HangmanGame() {
  const [room, setRoom] = useState<Room | null>(null);
  const [inApp, setInApp] = useState(false);
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

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
      socket.emit('join_room', { roomId: roomId.toUpperCase(), name });
      setInApp(true);
    });
    socket.on('room_state', (state: Room) => setRoom(state));
    socket.on('new_message', (msg: Message) => {
      setRoom(prev => prev ? { ...prev, messages: [...prev.messages, msg] } : null);
    });
    socket.on('disconnect', () => {
      setRoom(null);
      setInApp(false);
    });
  };

  if (!inApp) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-6 font-sans antialiased selection:bg-indigo-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.05),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.05),transparent_40%)]" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md space-y-8"
        >
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-indigo-100/50 border border-indigo-50/50">
               <Sparkles className="w-10 h-10 text-indigo-600" />
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tight text-gray-900 italic">Hangman Fun</h1>
              <p className="text-gray-500 font-medium">Join friends and challenge the AI</p>
            </div>
          </div>

          <form onSubmit={handleJoin} className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Your Name</label>
              <input
                autoFocus
                type="text"
                maxLength={12}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl px-5 py-4 outline-none transition-all text-gray-900 font-bold placeholder:text-gray-300"
                placeholder="What's your name?"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Room Code</label>
              <input
                type="text"
                maxLength={6}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl px-5 py-4 outline-none transition-all uppercase text-gray-900 text-2xl tracking-[0.2em] font-black placeholder:text-gray-300"
                placeholder="Ex: HELLO"
                required
              />
            </div>
            <button
              type="submit"
              className="group w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 text-lg"
            >
              Start Playing
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          
          <div className="flex items-center justify-center gap-6 pt-4 text-gray-400">
             <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
               <Shield className="w-4 h-4" /> Secure
             </div>
             <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
               <Heart className="w-4 h-4" /> Friendly
             </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em]">Finding Arena...</span>
        </div>
      </div>
    );
  }

  const me = room.players.find(p => p.id === socket?.id);
  const currentGuesser = room.players[room.guesserIdx];
  const isMyTurn = currentGuesser?.id === socket?.id;
  const isSetter = room.setterId === socket?.id;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 flex flex-col h-screen overflow-hidden">
      {/* Friendly Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
             <Sparkles className="w-5 h-5 text-white fill-current" />
           </div>
           <div>
             <h2 className="font-black text-lg leading-tight uppercase italic tracking-tight">Room {room.id}</h2>
             <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{room.difficulty} Level</span>
           </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={() => setChatOpen(!chatOpen)}
             className={cn(
               "p-3 rounded-xl transition-all relative",
               chatOpen ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
             )}
           >
             <MessageCircle className="w-5 h-5" />
             {room.messages.length > 0 && !chatOpen && (
               <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
             )}
           </button>
           <button 
             onClick={() => setMobileMenu(!mobileMenu)}
             className="md:hidden p-3 rounded-xl bg-gray-100 text-gray-400"
           >
             <LayoutDashboard className="w-5 h-5" />
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar - Desktop Only */}
        <aside className="hidden md:flex w-72 bg-white border-r border-gray-100 flex-col p-6 gap-8 shrink-0 overflow-y-auto">
          <PlayerList room={room} socketId={socket?.id} currentGuesserId={currentGuesser?.id} />
        </aside>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenu && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="absolute inset-0 z-40 bg-white md:hidden flex flex-col p-8 gap-8"
            >
              <div className="flex justify-between items-center">
                 <h3 className="font-black text-xl italic uppercase tracking-tight">Players</h3>
                 <button onClick={() => setMobileMenu(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <PlayerList room={room} socketId={socket?.id} currentGuesserId={currentGuesser?.id} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Play Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 flex flex-col items-center">
           <div className="w-full max-w-4xl flex-1 flex flex-col">
              <AnimatePresence mode="wait">
                {room.status === 'lobby' && <LobbyScreen key="lobby" room={room} isMeHost={room.players[0]?.id === socket?.id} />}
                {room.status === 'setting' && <SetterScreen key="setting" room={room} isSetter={isSetter} setterName={room.players.find(p => p.id === room.setterId)?.name || 'Friend'} />}
                {room.status === 'playing' && <GameScreen key="playing" room={room} isMyTurn={isMyTurn} currentGuesserName={currentGuesser?.name} />}
                {room.status === 'score' && <ScoreScreen key="score" room={room} />}
              </AnimatePresence>
           </div>
        </main>

        {/* Chat Drawer */}
        <AnimatePresence>
          {chatOpen && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute md:relative inset-y-0 right-0 z-50 w-full md:w-80 bg-white border-l border-gray-100 flex flex-col shadow-2xl md:shadow-none"
            >
               <ChatWindow room={room} socket={socket} onClose={() => setChatOpen(false)} />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PlayerList({ room, socketId, currentGuesserId }: { room: Room, socketId?: string, currentGuesserId?: string }) {
  return (
    <div className="space-y-6">
       <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">The Crew</label>
          <div className="space-y-2">
            {room.players.map(p => (
              <div key={p.id} className={cn(
                "flex items-center justify-between p-3 rounded-2xl transition-all border",
                p.id === socketId ? "bg-indigo-50 border-indigo-100" : "bg-gray-50 border-transparent"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    p.isBot ? "bg-orange-100" : "bg-white"
                  )}>
                    {p.isBot ? <Brain className="w-4 h-4 text-orange-600" /> : <User className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div>
                    <div className="text-xs font-black flex items-center gap-1.5 truncate max-w-[100px]">
                      {p.name}
                      {currentGuesserId === p.id && <Zap className="w-3 h-3 text-yellow-500 fill-current" />}
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold">{p.score} pts</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
       </div>
    </div>
  );
}

function LobbyScreen({ room, isMeHost }: { room: Room, isMeHost: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-10 text-center py-10">
      <div className="space-y-2">
         <h2 className="text-5xl font-black italic tracking-tighter uppercase text-gray-900">Waiting Room</h2>
         <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Gather your crew for the challenge</p>
      </div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
         <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-2">
            <Users className="w-8 h-8 text-indigo-500 mx-auto" />
            <div className="text-2xl font-black">{room.players.length} / 8</div>
            <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Players</div>
         </div>
         <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-2">
            <Settings2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <div className="flex items-center justify-center gap-2">
               {['Easy', 'Medium', 'Hard'].map(lvl => (
                 <button 
                   key={lvl}
                   onClick={() => isMeHost && socket.emit('set_difficulty', lvl)}
                   className={cn(
                     "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tight transition-all",
                     room.difficulty === lvl ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                   )}
                 >
                   {lvl}
                 </button>
               ))}
            </div>
            <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Difficulty</div>
         </div>
         <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-2 cursor-pointer hover:bg-gray-50 transition-all" onClick={() => socket.emit('add_bot')}>
            <Bot className="w-8 h-8 text-orange-500 mx-auto" />
            <div className="text-2xl font-black">Add AI</div>
            <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Need a Friend?</div>
         </div>
      </div>

      <button
        onClick={() => socket.emit('start_game')}
        disabled={room.players.length < 2}
        className="w-full max-w-sm bg-gray-900 hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 text-white font-black py-6 rounded-3xl transition-all shadow-2xl flex items-center justify-center gap-4 text-xl uppercase italic italic tracking-tight"
      >
        <Play className="w-6 h-6 fill-current" />
        {room.players.length < 2 ? 'Need 2+ Players' : 'Launch Game'}
      </button>
    </motion.div>
  );
}

function SetterScreen({ room, isSetter, setterName }: { room: Room, isSetter: boolean, setterName: string }) {
  const [word, setWord] = useState('');
  const [hint, setHint] = useState('');
  const [show, setShow] = useState(false);

  const isValid = word.replace(/[^A-Z]/ig, '').length >= 3;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center flex-1 py-10">
      {!isSetter ? (
        <div className="text-center space-y-6">
           <div className="w-24 h-24 bg-white rounded-[2rem] border-4 border-indigo-100 border-t-indigo-600 animate-spin mx-auto flex items-center justify-center">
              <Brain className="w-10 h-10 text-indigo-600 animate-pulse" />
           </div>
           <div className="space-y-2">
             <h2 className="text-3xl font-black italic uppercase tracking-tight">{setterName} is Thinking...</h2>
             <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Waiting for the secret word</p>
           </div>
        </div>
      ) : (
        <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
          <div className="text-center">
            <h2 className="text-3xl font-black italic uppercase tracking-tight">Pick a Word</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Don't make it too hard!</p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={word}
                onChange={(e) => setWord(e.target.value.toUpperCase())}
                placeholder="Type your word"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl px-6 py-5 pr-14 outline-none font-black text-xl tracking-[0.2em] uppercase transition-all"
              />
              <button onClick={() => setShow(!show)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-indigo-600">
                {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Give them a hint (optional)"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-gray-600 transition-all"
            />
            <button
              onClick={() => isValid && socket.emit('set_word', { word, hint })}
              disabled={!isValid}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-300 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-100 uppercase italic tracking-tight text-lg"
            >
              Lock It In
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function GameScreen({ room, isMyTurn, currentGuesserName }: { room: Room, isMyTurn: boolean, currentGuesserName?: string }) {
  const hangmanParts = [
    <motion.circle key="head" initial={{ scale: 0 }} animate={{ scale: 1 }} cx="200" cy="70" r="22" stroke="currentColor" strokeWidth="8" fill="none" />,
    <motion.line key="body" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1="200" y1="92" x2="200" y2="160" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />,
    <motion.line key="larm" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1="200" y1="115" x2="160" y2="145" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />,
    <motion.line key="rarm" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1="200" y1="115" x2="240" y2="145" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />,
    <motion.line key="lleg" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1="200" y1="160" x2="170" y2="210" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />,
    <motion.line key="rleg" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1="200" y1="160" x2="230" y2="210" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />,
  ];

  return (
    <div className="flex flex-col gap-10 w-full py-6">
       {/* Game Info Cards */}
       <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-4">
             <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-500" />
             </div>
             <div className="truncate">
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Hint</div>
                <div className="font-bold text-gray-900 truncate">{room.hint || "Thinking..."}</div>
             </div>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-4">
             <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-rose-500" />
             </div>
             <div>
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Lives</div>
                <div className="font-bold text-gray-900">{room.maxWrong - room.wrongCount} Left</div>
             </div>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-4 col-span-2 sm:col-span-1">
             <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-indigo-500" />
             </div>
             <div>
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Turn</div>
                <div className="font-bold text-gray-900 truncate">{isMyTurn ? "Your Turn!" : currentGuesserName}</div>
             </div>
          </div>
       </div>

       {/* Visual Area */}
       <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start">
          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100/50 flex-shrink-0 w-full max-w-[320px]">
             <svg viewBox="0 0 300 250" className="w-full h-auto text-gray-900">
                <line x1="60" y1="230" x2="240" y2="230" stroke="currentColor" strokeWidth="12" strokeLinecap="round" opacity="0.1"/>
                <line x1="100" y1="230" x2="100" y2="30" stroke="currentColor" strokeWidth="12" strokeLinecap="round" opacity="0.1"/>
                <line x1="100" y1="30" x2="200" y2="30" stroke="currentColor" strokeWidth="12" strokeLinecap="round" opacity="0.1"/>
                <line x1="200" y1="30" x2="200" y2="55" stroke="currentColor" strokeWidth="12" strokeLinecap="round" opacity="0.1"/>
                {hangmanParts.slice(0, room.wrongCount)}
             </svg>
          </div>

          <div className="flex-1 space-y-12 w-full text-center lg:text-left">
             <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                {room.word.split('').map((l, i) => {
                  const revealed = room.guessedLetters.includes(l);
                  return (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <span className={cn(
                        "text-5xl font-black uppercase italic tracking-tighter transition-all duration-500",
                        revealed ? "text-gray-900" : "text-transparent"
                      )}>{revealed ? l : 'X'}</span>
                      <div className={cn("h-2 w-10 md:w-12 rounded-full transition-all", revealed ? "bg-indigo-600 shadow-lg shadow-indigo-100" : "bg-gray-100")} />
                    </div>
                  );
                })}
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                   {ALPHABET.map(l => {
                     const used = room.guessedLetters.includes(l);
                     const isCorrect = used && room.word.includes(l);
                     return (
                       <button
                         key={l}
                         disabled={!isMyTurn || used}
                         onClick={() => socket.emit('guess_letter', l)}
                         className={cn(
                           "w-10 h-12 md:w-12 md:h-14 rounded-2xl font-black text-lg transition-all border-2",
                           used 
                             ? isCorrect ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-gray-50 border-transparent text-gray-200"
                             : isMyTurn ? "bg-white border-gray-100 hover:border-indigo-600 hover:-translate-y-1 text-gray-900" : "bg-white border-gray-50 text-gray-300 opacity-50"
                         )}
                       >
                         {l}
                       </button>
                     );
                   })}
                </div>
                {isMyTurn && (
                  <button onClick={() => socket.emit('pass_turn')} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all">
                    Skip your turn &rarr;
                  </button>
                )}
             </div>
          </div>
       </div>
    </div>
  );
}

function ScoreScreen({ room }: { room: Room }) {
  const isWin = room.word.split('').every(l => room.guessedLetters.includes(l));
  const sorted = [...room.players].sort((a, b) => b.score - a.score);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-8 py-10 w-full max-w-md mx-auto">
      <div className="text-center space-y-4">
         <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center mx-auto">
            {isWin ? <Trophy className="w-12 h-12 text-yellow-500 fill-current" /> : <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />}
         </div>
         <h2 className="text-4xl font-black italic uppercase tracking-tighter">{isWin ? "Amazing Job!" : "Better Luck Next Time"}</h2>
         {!isWin && <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">The word was <span className="text-gray-900 font-black">{room.word}</span></p>}
      </div>

      <div className="w-full bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
         <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Scoreboard</h3>
         <div className="space-y-2">
            {sorted.map((p, i) => (
              <div key={p.id} className={cn(
                "flex items-center justify-between p-4 rounded-2xl border",
                i === 0 && p.score > 0 ? "bg-indigo-50 border-indigo-100" : "bg-gray-50 border-transparent"
              )}>
                 <div className="flex items-center gap-3">
                    <span className="font-black italic text-gray-300 w-4">{i + 1}</span>
                    <span className="font-bold text-gray-900">{p.name}</span>
                 </div>
                 <span className="font-black text-indigo-600">{p.score} <span className="text-[8px] text-gray-400">PTS</span></span>
              </div>
            ))}
         </div>
      </div>

      <div className="flex items-center gap-3 text-gray-400 text-xs font-bold uppercase tracking-widest">
         <RefreshCw className="w-4 h-4 animate-spin" />
         Starting next round soon...
      </div>
    </motion.div>
  );
}

function ChatWindow({ room, socket, onClose }: { room: Room, socket: Socket, onClose: () => void }) {
  const [msg, setMsg] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [room.messages]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (msg.trim()) {
      socket.emit('send_message', msg);
      setMsg('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-indigo-600" />
            <h3 className="font-black italic uppercase tracking-tight">Chat</h3>
         </div>
         <button onClick={onClose} className="p-2 bg-gray-50 rounded-lg md:hidden"><X className="w-4 h-4" /></button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
         {room.messages.map(m => (
           <div key={m.id} className={cn("flex flex-col gap-1", m.senderId === socket.id ? "items-end" : "items-start")}>
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-300 px-1">{m.senderName}</span>
              <div className={cn(
                "px-4 py-2.5 rounded-2xl text-xs font-bold leading-relaxed",
                m.senderId === socket.id ? "bg-indigo-600 text-white rounded-tr-none" : "bg-gray-100 text-gray-900 rounded-tl-none"
              )}>{m.text}</div>
           </div>
         ))}
      </div>

      <form onSubmit={send} className="p-6 border-t border-gray-100 bg-gray-50/50">
         <div className="relative">
            <input
              type="text"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Type your message..."
              className="w-full bg-white border-2 border-transparent focus:border-indigo-100 rounded-xl px-5 py-3 pr-12 text-xs font-bold outline-none"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-600 hover:scale-110 transition-transform">
               <Send className="w-5 h-5 fill-current" />
            </button>
         </div>
      </form>
    </div>
  );
}
