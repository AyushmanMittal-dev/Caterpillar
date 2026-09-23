import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, ChevronDown, ChevronUp, BookOpen, ShieldCheck, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage, fetchChatStatus } from '../services/api';

const MACHINE_PROMPTS = {
  'CAT-320': [
    'When should I set Dig Priority to Boom Power?',
    'What is the optimal RPM for digging compacted clay?',
    'How does Cat Grade Assist with 2D E-Fence work?'
  ],
  'CAT-420': [
    'What stabilizer stance prevents sinking in rainy mud?',
    'Why use Eco mode instead of Power for conduit trenching?',
    'How do I use Differential Lock and Boom Float?'
  ],
  'CAT-950M': [
    'Why should I avoid 100% Rimpull in wet mud or rain?',
    'How does Cat Auto-Dig automate bucket loading?',
    'What bucket fill level gives the best turnaround time?'
  ],
  'CAT-140': [
    'What blade angle and gear are best for finish grading?',
    'Why does 3rd gear cause washboard ripples on sub-base?',
    'How does Cat Grade with Cross Slope maintain crowns?'
  ],
  'CAT-349': [
    'How do I prevent hydraulic oil overheating on high-hour shears?',
    'What tool duty cycle prevents cylinder seal blowouts?',
    'When should I select High Flow vs Medium Flow?'
  ]
};

export default function OperatorChatBot({ currentMachine, currentTask }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello Operator! I am your Caterpillar Cab Assistant, powered by local Llama 3.2 and FAISS RAG. I am strictly grounded in the official Caterpillar Operator Training Manuals. Ask me any technical question about tuning your cab knobs, safety boundaries, or machine procedures.",
      is_grounded: true,
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState({ ollama_online: true, total_chunks: 86 });
  const [expandedSourceIndex, setExpandedSourceIndex] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const s = await fetchChatStatus();
        setChatStatus(s);
      } catch (err) {
        setChatStatus({ ollama_online: false, total_chunks: 0 });
      }
    }
    checkStatus();
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const machineId = currentMachine?.machine_id || 'CAT-320';
  const quickPrompts = MACHINE_PROMPTS[machineId] || MACHINE_PROMPTS['CAT-320'];

  const handleSend = async (messageToSend) => {
    const text = (messageToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const payload = {
        message: text,
        machine_id: currentMachine?.machine_id,
        task_id: currentTask?.task_id
      };

      const res = await sendChatMessage(payload);

      const botMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.reply,
        is_grounded: res.is_grounded,
        similarity_score: res.similarity_score,
        sources: res.sources || []
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `Communication Error: Could not reach the local RAG engine (${err.message}). Ensure backend and Ollama are running.`,
          is_grounded: false,
          sources: []
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormattedText = (text) => {
    // Process markdown bullet points and bold styling
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} style={{ color: 'var(--cat-yellow)' }}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return (
          <div key={idx} style={{ display: 'flex', gap: '6px', marginLeft: '6px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--cat-yellow)', fontWeight: 'bold' }}>&bull;</span>
            <div>{formattedLine}</div>
          </div>
        );
      }

      return (
        <div key={idx} style={{ marginBottom: line.trim() ? '6px' : '3px' }}>
          {formattedLine}
        </div>
      );
    });
  };

  return (
    <>
      {/* Floating Toggle Button (Bottom-Right) */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsOpen(true)}
          className="chat-floating-btn"
          title="Open CAT Operator Assistant Chatbot"
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="cat-chat-icon-badge">
              <Bot size={18} color="#000" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.3px', color: '#000' }}>
                CAT Cab Guide
              </div>
              <div style={{ fontSize: '10px', color: '#2B313A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className={`status-dot ${chatStatus.ollama_online ? 'online' : 'offline'}`} />
                <span>{chatStatus.ollama_online ? 'Llama 3.2 RAG' : 'Ollama Offline'}</span>
              </div>
            </div>
          </div>
        </motion.button>
      )}

      {/* Expanded Chat Console (Bottom-Right) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="chat-modal-window"
          >
            {/* Header */}
            <div className="chat-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="cat-mini-logo">CAT</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>
                    Operator Cab Assistant
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <BookOpen size={10} color="var(--cat-yellow)" />
                    <span>FAISS &bull; {currentMachine?.name?.split(' ')[0] || 'CAT'} Manuals</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="chat-close-btn"
                title="Minimize Chat"
              >
                <ChevronDown size={18} />
              </button>
            </div>

            {/* Context Header Strip */}
            <div className="chat-context-strip">
              <span style={{ color: 'var(--text-muted)' }}>Active Machine:</span>
              <strong style={{ color: 'var(--cat-yellow)' }}>{currentMachine?.name || 'Caterpillar Machine'}</strong>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="chat-prompts-bar">
              {quickPrompts.map((promptText, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSend(promptText)}
                  disabled={isLoading}
                  className="chat-prompt-pill"
                >
                  <Sparkles size={10} color="var(--cat-yellow)" />
                  <span>{promptText}</span>
                </button>
              ))}
            </div>

            {/* Messages Scroll Area */}
            <div className="chat-messages-container">
              {messages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id || index}
                    className={`chat-bubble-wrapper ${isUser ? 'user' : 'assistant'}`}
                  >
                    {!isUser && (
                      <div className="chat-avatar-cat">
                        <Bot size={13} color="#000" />
                      </div>
                    )}

                    <div className={`chat-bubble ${isUser ? 'user' : 'assistant'}`}>
                      {/* Message Content */}
                      <div style={{ fontSize: '12.5px', lineHeight: '1.45' }}>
                        {renderFormattedText(msg.text)}
                      </div>

                      {/* Grounding & Citations Guardrail Badge */}
                      {!isUser && msg.id !== 'welcome' && (
                        <div style={{ marginTop: '8px', borderTop: '1px solid var(--panel-border)', paddingTop: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px' }}>
                            {msg.is_grounded ? (
                              <span style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '700' }}>
                                <ShieldCheck size={11} /> Verified CAT Manual Grounding
                              </span>
                            ) : (
                              <span style={{ color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '700' }}>
                                <ShieldAlert size={11} /> Anti-Hallucination Guardrail Active
                              </span>
                            )}

                            {msg.sources && msg.sources.length > 0 && (
                              <button
                                onClick={() => setExpandedSourceIndex(expandedSourceIndex === index ? null : index)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--cat-yellow)',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  padding: '0'
                                }}
                              >
                                <span>{msg.sources.length} Sources</span>
                                {expandedSourceIndex === index ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                              </button>
                            )}
                          </div>

                          {/* Collapsible Citations View */}
                          {expandedSourceIndex === index && msg.sources && msg.sources.length > 0 && (
                            <div style={{ marginTop: '6px', backgroundColor: '#0D1117', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                              {msg.sources.map((src, sIdx) => (
                                <div key={sIdx} style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                                  <strong style={{ color: '#fff' }}>&bull; {src.section}</strong> ({src.similarity}% match)
                                  <div style={{ fontSize: '9px', opacity: 0.7 }}>{src.doc_title}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Thinking / Typing Pulse */}
              {isLoading && (
                <div className="chat-bubble-wrapper assistant">
                  <div className="chat-avatar-cat">
                    <Bot size={13} color="#000" />
                  </div>
                  <div className="chat-bubble assistant typing">
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                      Searching Caterpillar Training Manuals &amp; synthesizing with Llama 3.2...
                    </motion.span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="chat-input-form"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about cab knobs, site techniques..."
                className="chat-input-field"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="chat-send-btn"
                title="Send Message"
              >
                <Send size={14} color={input.trim() && !isLoading ? '#000' : '#888'} />
              </button>
            </form>

            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textAlign: 'center', padding: '4px 8px', backgroundColor: '#0D1117', borderTop: '1px solid var(--panel-border)' }}>
              Strictly grounded in Caterpillar manuals &bull; Anti-hallucination enabled
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
