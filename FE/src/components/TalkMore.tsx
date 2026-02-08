/**
 * TalkMore — Conversation panel for general LLM Q&A.
 *
 * Calls POST /api/ask ONLY. Never triggers drug search or company search.
 * Shows a scrollable conversation history with question/answer pairs.
 * Appears at the bottom of the page when the user scrolls near it.
 */

import { useState } from 'react';
import { Send, MessageCircle, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchAsk } from '../api/ask';
import type { AskResponse } from '../types/api';

interface ConversationEntry {
  question: string;
  answer: string;
  status: 'answered' | 'refused' | 'error';
}

interface TalkMoreProps {
  drugContext?: string;
}

export function TalkMore({ drugContext }: TalkMoreProps) {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<ConversationEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = inputValue.trim();
    if (!question || loading) return;

    setInputValue('');
    setLoading(true);

    try {
      const result: AskResponse = await fetchAsk({
        question,
        drug_context: drugContext,
      });

      setHistory((prev) => [
        ...prev,
        {
          question,
          answer: result.answer,
          status: result.status,
        },
      ]);
    } catch (err) {
      setHistory((prev) => [
        ...prev,
        {
          question,
          answer: err instanceof Error ? err.message : 'Something went wrong.',
          status: 'error',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="relative mx-auto mt-6 max-w-[900px] px-8 pb-16"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div
        className="rounded-[32px] p-8"
        style={{
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(60px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.12)',
        }}
      >
        {/* Header */}
        <div className="mb-2 flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: 'rgba(25, 118, 210, 0.1)' }}
          >
            <MessageCircle size={18} className="text-[#1976D2]" strokeWidth={2} />
          </div>
          <div>
            <h3
              className="text-xl font-bold text-black/80"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              Talk More
            </h3>
          </div>
        </div>
        <p
          className="mb-6 text-sm font-semibold text-black/40"
          style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
        >
          Ask follow-up questions{drugContext ? ` about ${drugContext}` : ''}, explore dosing guidelines, drug interactions, or clinical details.
        </p>

        {/* Conversation History */}
        <AnimatePresence>
          {history.length > 0 && (
            <motion.div
              className="mb-6 flex max-h-[400px] flex-col gap-4 overflow-y-auto pr-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(0,0,0,0.1) transparent',
              }}
            >
              {history.map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                  className="flex flex-col gap-2"
                >
                  {/* Question */}
                  <div className="flex justify-end">
                    <div
                      className="max-w-[80%] rounded-2xl rounded-tr-md px-4 py-3"
                      style={{
                        background: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)',
                      }}
                    >
                      <p
                        className="text-sm font-semibold text-white"
                        style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
                      >
                        {entry.question}
                      </p>
                    </div>
                  </div>

                  {/* Answer */}
                  <div className="flex justify-start">
                    <div
                      className="max-w-[85%] rounded-2xl rounded-tl-md px-4 py-3"
                      style={{
                        background: entry.status === 'error' 
                          ? 'rgba(211, 47, 47, 0.08)' 
                          : entry.status === 'refused'
                          ? 'rgba(245, 166, 35, 0.08)'
                          : 'rgba(0, 0, 0, 0.04)',
                        border: entry.status === 'error'
                          ? '1px solid rgba(211, 47, 47, 0.15)'
                          : entry.status === 'refused'
                          ? '1px solid rgba(245, 166, 35, 0.15)'
                          : '1px solid rgba(0, 0, 0, 0.06)',
                      }}
                    >
                      {entry.status !== 'answered' && (
                        <div className="mb-1 flex items-center gap-1.5">
                          <AlertCircle size={12} className={entry.status === 'error' ? 'text-red-500' : 'text-amber-500'} />
                          <span
                            className="text-xs font-bold"
                            style={{
                              color: entry.status === 'error' ? '#D32F2F' : '#F5A623',
                              fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                            }}
                          >
                            {entry.status === 'error' ? 'Error' : 'Blocked'}
                          </span>
                        </div>
                      )}
                      <p
                        className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-black/75"
                        style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
                      >
                        {entry.answer}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask a question…"
              rows={3}
              disabled={loading}
              className="w-full resize-none rounded-3xl border-none bg-white/80 px-6 py-4 text-sm text-black placeholder-black/30 outline-none disabled:opacity-50"
              style={{
                fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                fontWeight: 600,
                boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.06)',
              }}
            />

            {/* Action Bar */}
            <div className="mt-3 flex items-center justify-end">

              <motion.button
                type="submit"
                className="flex items-center gap-2 rounded-full px-6 py-2.5"
                style={{
                  background:
                    inputValue.trim() && !loading
                      ? 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)'
                      : 'rgba(0, 0, 0, 0.1)',
                  color: inputValue.trim() && !loading ? 'white' : 'rgba(0, 0, 0, 0.3)',
                  fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                  fontWeight: 700,
                  boxShadow:
                    inputValue.trim() && !loading
                      ? '0 8px 24px rgba(25, 118, 210, 0.3)'
                      : 'none',
                }}
                whileHover={inputValue.trim() && !loading ? { scale: 1.05 } : {}}
                whileTap={inputValue.trim() && !loading ? { scale: 0.95 } : {}}
                disabled={!inputValue.trim() || loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-sm font-bold">Thinking…</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-bold">Ask</span>
                    <Send size={14} strokeWidth={2} />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
