import React, { useState } from "react";
import { History, Book, FileText, Trash2, ArrowUpRight, Award, Calendar, BookOpen, Star, Sparkles, Check, RefreshCw, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { PracticeSession, SavedCollocation, ReflectionWorksheet } from "../types";

interface StudyLibraryProps {
  sessions: PracticeSession[];
  vocabulary: SavedCollocation[];
  worksheets: ReflectionWorksheet[];
  onDeleteSession: (id: string) => void;
  onDeleteVocabulary: (id: string) => void;
  onDeleteWorksheet: (id: string) => void;
  onSelectPastSession: (session: PracticeSession) => void;
}

export default function StudyLibrary({
  sessions,
  vocabulary,
  worksheets,
  onDeleteSession,
  onDeleteVocabulary,
  onDeleteWorksheet,
  onSelectPastSession,
}: StudyLibraryProps) {
  const [libraryTab, setLibraryTab] = useState<"history" | "vocabulary" | "worksheets">("history");

  // --- Flashcard Game State ---
  const [gameActive, setGameActive] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [masteredCards, setMasteredCards] = useState<string[]>([]);

  // Filter unmastered cards for review
  const activeReviewCards = vocabulary.filter(v => !masteredCards.includes(v.id));

  const handleNextCard = (wasMastered = false) => {
    if (wasMastered && activeReviewCards[currentCardIndex]) {
      const cardId = activeReviewCards[currentCardIndex].id;
      setMasteredCards(prev => [...prev, cardId]);
      setGameScore(prev => prev + 10);
    }
    setIsFlipped(false);
    
    // Adjust index if we are completing the last item
    if (activeReviewCards.length <= 1) {
      setCurrentCardIndex(0);
    } else {
      setCurrentCardIndex((prev) => (prev + 1) % (activeReviewCards.length - (wasMastered ? 1 : 0)));
    }
  };

  const handleResetGame = () => {
    setMasteredCards([]);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setGameScore(0);
  };

  // --- SVG Chart Calculations ---
  const getProgressChart = () => {
    if (sessions.length < 2) return null;
    
    // Take up to last 7 sessions in chronological order
    const chartSessions = [...sessions].reverse().slice(-7);
    const width = 450;
    const height = 180;
    const paddingX = 40;
    const paddingY = 30;

    const points = chartSessions.map((s, idx) => {
      const x = paddingX + idx * (width - 2 * paddingX) / (chartSessions.length - 1);
      // Map overallBandScore (1 to 9) to height
      const y = height - paddingY - (s.feedback.overallBandScore - 1) * (height - 2 * paddingY) / 8;
      return { x, y, score: s.feedback.overallBandScore, label: s.topicTitle.slice(0, 10) + "..." };
    });

    const pathD = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");

    return (
      <div className="bg-[#111116] border border-[#1E1E26] rounded-sm p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Band Score Progression</span>
          <span className="text-[10px] font-semibold text-[#F59E0B]">Showing last {chartSessions.length} sessions</span>
        </div>
        <div className="relative w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[320px] h-32">
            {/* Grid lines */}
            {[1, 3, 5, 7, 9].map((val) => {
              const y = height - paddingY - (val - 1) * (height - 2 * paddingY) / 8;
              return (
                <g key={val}>
                  <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#1E1E26" strokeWidth="1" strokeDasharray="4 4" />
                  <text x={paddingX - 10} y={y + 4} fill="#71717A" fontSize="9" className="font-mono text-right" textAnchor="end">{val.toFixed(1)}</text>
                </g>
              );
            })}

            {/* Line Path */}
            <path d={pathD} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Scatter Dots */}
            {points.map((p, idx) => (
              <g key={idx} className="group">
                <circle cx={p.x} cy={p.y} r="4" fill="#0A0A0C" stroke="#F59E0B" strokeWidth="2" className="cursor-pointer hover:r-6 hover:fill-[#F59E0B] transition-all" />
                <text x={p.x} y={p.y - 10} fill="#white" fontSize="9" fontWeight="bold" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity font-mono bg-black">{p.score}</text>
              </g>
            ))}

            {/* Bottom labels */}
            {points.map((p, idx) => (
              <text key={idx} x={p.x} y={height - 10} fill="#71717A" fontSize="8" textAnchor="middle">{idx + 1}</text>
            ))}
          </svg>
        </div>
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#1E1E26] text-center">
          <div>
            <span className="text-[8px] text-[#71717A] uppercase block">Fluency</span>
            <span className="text-xs font-bold text-white">{(sessions.reduce((acc, s) => acc + s.feedback.fluencyAndCoherence.score, 0) / sessions.length).toFixed(1)}</span>
          </div>
          <div>
            <span className="text-[8px] text-[#71717A] uppercase block">Lexical</span>
            <span className="text-xs font-bold text-white">{(sessions.reduce((acc, s) => acc + s.feedback.lexicalResource.score, 0) / sessions.length).toFixed(1)}</span>
          </div>
          <div>
            <span className="text-[8px] text-[#71717A] uppercase block">Grammar</span>
            <span className="text-xs font-bold text-white">{(sessions.reduce((acc, s) => acc + s.feedback.grammaticalRangeAccuracy.score, 0) / sessions.length).toFixed(1)}</span>
          </div>
          <div>
            <span className="text-[8px] text-[#71717A] uppercase block">Pronunciation</span>
            <span className="text-xs font-bold text-white">{(sessions.reduce((acc, s) => acc + s.feedback.pronunciation.score, 0) / sessions.length).toFixed(1)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-[#E0E0E6]">
      {/* Tab bar header */}
      <div className="flex bg-[#111116] border border-[#1E1E26] p-1 rounded-sm overflow-x-auto gap-1">
        <button
          onClick={() => setLibraryTab("history")}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-sm transition-all cursor-pointer ${
            libraryTab === "history"
              ? "bg-[#F59E0B] text-[#0A0A0C] font-bold shadow-sm"
              : "text-[#A1A1AA] hover:text-white hover:bg-[#1E1E26]"
          }`}
        >
          <History className="w-4 h-4" />
          Practice History ({sessions.length})
        </button>
        <button
          onClick={() => setLibraryTab("vocabulary")}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-sm transition-all cursor-pointer ${
            libraryTab === "vocabulary"
              ? "bg-[#F59E0B] text-[#0A0A0C] font-bold shadow-sm"
              : "text-[#A1A1AA] hover:text-white hover:bg-[#1E1E26]"
          }`}
        >
          <Book className="w-4 h-4" />
          Vocabulary Notebook ({vocabulary.length})
        </button>
        <button
          onClick={() => setLibraryTab("worksheets")}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-sm transition-all cursor-pointer ${
            libraryTab === "worksheets"
              ? "bg-[#F59E0B] text-[#0A0A0C] font-bold shadow-sm"
              : "text-[#A1A1AA] hover:text-white hover:bg-[#1E1E26]"
          }`}
        >
          <FileText className="w-4 h-4" />
          Reflection Journals ({worksheets.length})
        </button>
      </div>

      {/* Library View Area */}
      <div className="animate-fade-in">
        {/* HISTORY LOGS */}
        {libraryTab === "history" && (
          <div className="space-y-6">
            {/* Display Progression Chart if enough data */}
            {sessions.length >= 2 && getProgressChart()}

            {sessions.length === 0 ? (
              <div className="bg-[#111116] border border-[#1E1E26] rounded-sm p-12 text-center space-y-3">
                <History className="w-12 h-12 text-[#71717A] mx-auto" />
                <h4 className="font-serif text-white text-base">No speaking sessions logged yet</h4>
                <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto">
                  Get in front of the coach! Choose a topic, record your speaking answer, and submit it for review to populate your personal learning logs.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-[#111116] border border-[#1E1E26] rounded-sm p-5 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <span className="inline-block bg-[#1E1E26] text-[#F59E0B] border border-[#F59E0B]/20 text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm">
                            Part {session.part} • CEFR {session.levelUsed} Target
                          </span>
                          <h4 className="font-serif text-white text-sm mt-1.5 leading-snug line-clamp-1">
                            {session.questionText}
                          </h4>
                          <span className="text-[9px] text-[#71717A] font-semibold flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(session.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="bg-[#1E1E26] border border-[#1E1E26] rounded-sm p-2 text-center min-w-[50px]">
                          <span className="text-[8px] text-[#F59E0B] font-bold block uppercase tracking-wider">Band</span>
                          <span className="font-mono text-base font-bold text-white">
                            {session.feedback.overallBandScore}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#A1A1AA] line-clamp-2 italic bg-[#1A1A1F] p-2.5 rounded-sm border border-[#1E1E26] font-sans">
                        "{session.transcript}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#1E1E26] pt-4 mt-4">
                      <button
                        onClick={() => onSelectPastSession(session)}
                        className="text-xs font-bold text-[#F59E0B] hover:text-[#D97706] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        Review Coaching Detail
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteSession(session.id)}
                        className="text-[#71717A] hover:text-red-400 p-1.5 rounded-sm hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-colors cursor-pointer"
                        title="Delete session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SAVED VOCABULARY NOTEBOOK */}
        {libraryTab === "vocabulary" && (
          <div className="space-y-6">
            {/* Gamified Flashcard Section */}
            {vocabulary.length > 0 && (
              <div className="bg-[#111116] border border-[#1E1E26] rounded-sm p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-[#1E1E26] pb-3">
                  <h4 className="font-serif text-white text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                    Vocabulary Flashcard Review
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-bold text-[#F59E0B] bg-[#1E1E26] px-2 py-0.5 rounded-sm border border-[#F59E0B]/20">
                      Score: {gameScore} pts
                    </span>
                    <button
                      onClick={() => setGameActive(!gameActive)}
                      className="text-xs bg-[#1E1E26] border border-[#1E1E26] hover:border-[#71717A] text-[#A1A1AA] hover:text-white px-3 py-1 rounded-sm cursor-pointer transition-all"
                    >
                      {gameActive ? "Close game" : "Start review game"}
                    </button>
                  </div>
                </div>

                {gameActive && (
                  <div className="bg-[#1A1A1F] border border-[#1E1E26] rounded-sm p-6 text-center space-y-6 max-w-lg mx-auto">
                    {activeReviewCards.length === 0 ? (
                      <div className="space-y-4">
                        <Check className="w-12 h-12 text-emerald-400 mx-auto bg-emerald-950/20 p-2 rounded-full border border-emerald-900/30" />
                        <h4 className="font-serif text-emerald-300 text-sm">Review Cycle Completed!</h4>
                        <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto">
                          Wow! You have successfully reviewed and mastered all your saved vocabulary items. Keep adding more words to train.
                        </p>
                        <button
                          onClick={handleResetGame}
                          className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0C] font-bold text-xs px-4 py-2 mx-auto rounded-sm cursor-pointer transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Restart Study Session
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-[10px] text-[#71717A] font-semibold uppercase tracking-widest">
                          Card {currentCardIndex + 1} of {activeReviewCards.length} (Mastered: {masteredCards.length})
                        </div>

                        {/* Flashcard container */}
                        <div
                          onClick={() => setIsFlipped(!isFlipped)}
                          className="bg-[#111116] border border-[#1E1E26] hover:border-[#F59E0B]/30 h-40 flex flex-col justify-center items-center p-6 rounded-sm cursor-pointer transition-all select-none relative overflow-hidden"
                        >
                          <div className="absolute top-1.5 right-1.5 text-[8px] uppercase tracking-wider text-[#71717A] font-bold">
                            Click to flip
                          </div>
                          {!isFlipped ? (
                            <div className="space-y-2">
                              <span className="text-[10px] bg-[#1E1E26] text-[#F59E0B] px-2 py-0.5 rounded-sm font-mono border border-[#F59E0B]/20">
                                Concept / Definition
                              </span>
                              <p className="text-sm font-serif text-white font-medium leading-relaxed max-w-sm">
                                {activeReviewCards[currentCardIndex].explanation}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3 animate-fade-in">
                              <span className="text-[10px] bg-emerald-950/40 text-emerald-400 px-2 py-0.5 rounded-sm font-mono border border-emerald-900/30">
                                Target Collocation
                              </span>
                              <h3 className="text-xl font-bold text-white tracking-wide">
                                {activeReviewCards[currentCardIndex].phrase}
                              </h3>
                              <p className="text-xs text-[#71717A] italic">
                                Eg: "{activeReviewCards[currentCardIndex].example}"
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Game controls */}
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleNextCard(false)}
                            className="bg-[#1E1E26] text-[#A1A1AA] hover:text-white border border-[#1E1E26] hover:border-[#71717A] text-xs font-semibold px-4 py-2 rounded-sm cursor-pointer transition-all"
                          >
                            Skip
                          </button>
                          <button
                            onClick={() => handleNextCard(true)}
                            className="bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0C] font-bold text-xs px-5 py-2 rounded-sm cursor-pointer transition-all flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            I know this word!
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {vocabulary.length === 0 ? (
              <div className="bg-[#111116] border border-[#1E1E26] rounded-sm p-12 text-center space-y-3">
                <Book className="w-12 h-12 text-[#71717A] mx-auto" />
                <h4 className="font-serif text-white text-base">Vocabulary Notebook is empty</h4>
                <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto">
                  When getting graded, press the bookmark icons next to key academic collocations to build your personal high-band vocabulary notebook!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vocabulary.map((vocab) => {
                  const mastered = masteredCards.includes(vocab.id);
                  return (
                    <div
                      key={vocab.id}
                      className={`bg-[#111116] border rounded-sm p-5 flex justify-between items-start gap-4 transition-all ${
                        mastered ? "border-emerald-500/20 bg-emerald-950/5" : "border-[#1E1E26]"
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-[#1E1E26] text-[#F59E0B] text-xs font-bold font-mono px-2 py-0.5 rounded-sm border border-[#F59E0B]/20">
                            {vocab.phrase}
                          </span>
                          <span className="text-[9px] text-[#71717A] font-bold uppercase tracking-wider">
                            {vocab.topicTitle}
                          </span>
                          {mastered && (
                            <span className="text-[8px] bg-emerald-950/50 text-emerald-400 border border-emerald-900/30 px-1.5 py-0.2 rounded-sm font-semibold uppercase tracking-wider">
                              Mastered
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#A1A1AA] leading-relaxed">
                          <strong className="text-white">Meaning:</strong> {vocab.explanation}
                        </p>

                        <p className="text-xs text-[#71717A] italic bg-[#1A1A1F] p-2.5 rounded-sm border border-[#1E1E26] font-sans">
                          <strong>Usage:</strong> "{vocab.example}"
                        </p>
                      </div>

                      <button
                        onClick={() => onDeleteVocabulary(vocab.id)}
                        className="text-[#71717A] hover:text-red-400 p-1.5 rounded-sm hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-colors cursor-pointer shrink-0"
                        title="Unsave collocation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* REFLECTION WORKHSEETS */}
        {libraryTab === "worksheets" && (
          <div className="space-y-4">
            {worksheets.length === 0 ? (
              <div className="bg-[#111116] border border-[#1E1E26] rounded-sm p-12 text-center space-y-3">
                <FileText className="w-12 h-12 text-[#71717A] mx-auto" />
                <h4 className="font-serif text-white text-base">No reflection logs found</h4>
                <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto">
                  Complete your self-assessment worksheets at the end of each speaking feedback session to store your progress and commit words to memory!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {worksheets.map((sheet) => (
                  <div key={sheet.id} className="bg-[#111116] border border-[#1E1E26] rounded-sm p-6 space-y-4">
                    <div className="flex justify-between items-start gap-4 pb-3 border-b border-[#1E1E26]">
                      <div>
                        <span className="text-[9px] font-bold text-[#F59E0B] uppercase tracking-wider block font-mono">Completed Reflection</span>
                        <h4 className="font-serif text-white text-base mt-1">
                          Topic: {sheet.topicTitle}
                        </h4>
                        <p className="text-[10px] text-[#A1A1AA] italic font-sans mt-0.5">
                          Question: "{sheet.questionText}"
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[9px] text-[#71717A] font-semibold">
                          {new Date(sheet.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <button
                          onClick={() => onDeleteWorksheet(sheet.id)}
                          className="text-[#71717A] hover:text-red-400 p-1.5 rounded-sm hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-colors cursor-pointer"
                          title="Delete reflection"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#1A1A1F] p-3 rounded-sm border border-[#1E1E26] text-xs text-[#A1A1AA]">
                      <strong className="text-[#F59E0B]">Focus Learning Point:</strong> {sheet.todayLearningPoint}
                    </div>

                    {sheet.selfConfidence !== undefined && (
                      <div className="flex items-center gap-1.5 bg-[#18181B] p-2.5 rounded-sm border border-[#1E1E26] w-fit">
                        <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Confidence:</span>
                        <div className="flex text-[#F59E0B]">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className="w-3.5 h-3.5"
                              fill={star <= (sheet.selfConfidence || 0) ? "#F59E0B" : "none"}
                              stroke="currentColor"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {Object.keys(sheet.answers).map((qIdxString) => {
                        const idx = parseInt(qIdxString, 10);
                        return (
                          <div key={idx} className="space-y-1 bg-[#1A1A1F] p-3 rounded-sm border border-[#1E1E26]">
                            <span className="block text-[9px] font-bold text-[#71717A] uppercase tracking-wide">
                              Journal Entry {idx + 1}
                            </span>
                            <p className="text-xs text-[#A1A1AA] font-sans pl-1">
                              {sheet.answers[idx]}
                            </p>
                          </div>
                        );
                      })}
                      
                      {sheet.generalNotes && (
                        <div className="space-y-1 bg-[#1A1A1F] p-3 rounded-sm border border-[#1E1E26] border-l-2 border-l-[#F59E0B]">
                          <span className="block text-[9px] font-bold text-[#F59E0B] uppercase tracking-wide">
                            My Key Takeaways & General Notes
                          </span>
                          <p className="text-xs text-[#A1A1AA] font-sans pl-1 whitespace-pre-wrap">
                            {sheet.generalNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
