import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Award, BookOpen, Trophy, Sparkles, User, Settings, Calendar, History, TrendingUp, Flame, Play, AlertCircle, RefreshCw } from "lucide-react";
import { CEFRLevel, UserProfile, PracticeSession, SavedCollocation, ReflectionWorksheet, IELTSFeedback, IELTSQuestion, IELTSTopic } from "./types";
import SpeakingArena from "./components/SpeakingArena";
import FeedbackView from "./components/FeedbackView";
import StudyLibrary from "./components/StudyLibrary";

export default function App() {
  // --- Persistent State from LocalStorage ---
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("ielts_profile");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      username: "Khanh Quynh",
      currentLevel: CEFRLevel.B1,
      targetBand: 7.5,
      joinedAt: new Date().toISOString(),
      geminiApiKey: "",
      aiModel: "gemini-3-flash-preview",
    };
  });

  const [sessions, setSessions] = useState<PracticeSession[]>(() => {
    const saved = localStorage.getItem("ielts_sessions");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [savedCollocations, setSavedCollocations] = useState<SavedCollocation[]>(() => {
    const saved = localStorage.getItem("ielts_collocations");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [worksheets, setWorksheets] = useState<ReflectionWorksheet[]>(() => {
    const saved = localStorage.getItem("ielts_worksheets");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  // --- Active Workspace & Interaction states ---
  const [activeTab, setActiveTab] = useState<"practice" | "library" | "settings">("practice");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [currentFeedback, setCurrentFeedback] = useState<IELTSFeedback | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState<string>("");
  const [currentQuestion, setCurrentQuestion] = useState<IELTSQuestion | null>(null);
  const [currentTopic, setCurrentTopic] = useState<IELTSTopic | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.username);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  useEffect(() => {
    if (!profile.geminiApiKey) {
      setShowApiKeyModal(true);
    } else {
      setShowApiKeyModal(false);
    }
  }, [profile.geminiApiKey]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem("ielts_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("ielts_sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem("ielts_collocations", JSON.stringify(savedCollocations));
  }, [savedCollocations]);

  useEffect(() => {
    localStorage.setItem("ielts_worksheets", JSON.stringify(worksheets));
  }, [worksheets]);

  // --- Stats Calculation ---
  const totalPracticed = sessions.length;
  const averageBand = totalPracticed > 0 
    ? parseFloat((sessions.reduce((acc, s) => acc + s.feedback.overallBandScore, 0) / totalPracticed).toFixed(2)) 
    : 0;

  const currentStreak = totalPracticed > 0 ? Math.min(totalPracticed, 7) : 0; // Simple simulation for user engagement

  // --- Actions ---
  const handleEvaluate = async (transcriptText: string, question: IELTSQuestion, topic: IELTSTopic) => {
    setIsEvaluating(true);
    setErrorMessage("");
    setCurrentFeedback(null);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-gemini-key": profile.geminiApiKey || ""
        },
        body: JSON.stringify({
          transcript: transcriptText,
          questionText: question.questionText,
          part: question.part,
          level: profile.currentLevel,
          username: profile.username,
          model: profile.aiModel || "gemini-3-flash-preview",
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to contact IELTS Coach server.");
      }

      const feedbackData: IELTSFeedback = await response.json();
      
      // Save practice session in history
      const newSession: PracticeSession = {
        id: Math.random().toString(36).substring(2, 9),
        username: profile.username,
        topicTitle: topic.title,
        questionText: question.questionText,
        part: question.part,
        transcript: transcriptText,
        feedback: feedbackData,
        levelUsed: profile.currentLevel,
        createdAt: new Date().toISOString(),
      };

      setSessions((prev) => [newSession, ...prev]);
      setCurrentFeedback(feedbackData);
      setCurrentTranscript(transcriptText);
      setCurrentQuestion(question);
      setCurrentTopic(topic);
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred during evaluation.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSaveCollocation = (colloc: Omit<SavedCollocation, "id" | "savedAt">) => {
    const newCollocation: SavedCollocation = {
      ...colloc,
      id: Math.random().toString(36).substring(2, 9),
      savedAt: new Date().toISOString(),
    };
    setSavedCollocations((prev) => [newCollocation, ...prev]);
  };

  const handleUnsaveCollocation = (phrase: string) => {
    setSavedCollocations((prev) => prev.filter((item) => item.phrase.toLowerCase() !== phrase.toLowerCase()));
  };

  const handleSaveReflection = (answers: { [key: number]: string }, learningPoint: string, generalNotes: string, confidence: number) => {
    if (!currentQuestion || !currentTopic) return;
    const newWorksheet: ReflectionWorksheet = {
      id: Math.random().toString(36).substring(2, 9),
      sessionId: sessions[0]?.id || "unknown",
      topicTitle: currentTopic.title,
      questionText: currentQuestion.questionText,
      todayLearningPoint: learningPoint,
      answers,
      createdAt: new Date().toISOString(),
      generalNotes,
      selfConfidence: confidence,
    };
    setWorksheets((prev) => [newWorksheet, ...prev]);
  };

  // Select a historical session to re-read feedback details
  const handleSelectPastSession = (session: PracticeSession) => {
    const matchedTopic = { title: session.topicTitle, id: "", category: "", questions: [] };
    const matchedQuestion = { part: session.part, questionText: session.questionText, id: "" };
    
    setCurrentFeedback(session.feedback);
    setCurrentTranscript(session.transcript);
    setCurrentQuestion(matchedQuestion);
    setCurrentTopic(matchedTopic);
    setActiveTab("practice");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#E0E0E6] flex flex-col font-sans">
      {/* Top Banner Header */}
      <header className="sticky top-0 z-50 bg-[#0A0A0C]/90 backdrop-blur-md border-b border-[#1E1E26] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4">
            <div className="space-y-1">
              <h1 className="text-[10px] tracking-[0.3em] uppercase text-[#A1A1AA] font-semibold leading-none">
                IELTS Speaking Excellence Coach
              </h1>
              <div className="flex items-baseline gap-2">
                {isEditingName ? (
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={() => {
                      setIsEditingName(false);
                      if (tempName.trim()) {
                        setProfile({ ...profile, username: tempName.trim() });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setIsEditingName(false);
                        if (tempName.trim()) {
                          setProfile({ ...profile, username: tempName.trim() });
                        }
                      }
                    }}
                    className="bg-[#1A1A1F] border border-[#F59E0B] text-white rounded-sm px-2 py-0.5 text-base font-serif italic focus:outline-none w-40"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => { setIsEditingName(true); setTempName(profile.username); }}
                    className="text-2xl font-serif italic text-white leading-none cursor-pointer border-b border-dashed border-[#71717A] hover:border-white hover:text-[#F59E0B] transition-colors"
                    title="Click to edit name"
                  >
                    Welcome back, {profile.username}.
                  </span>
                )}
                <span className="text-[9px] bg-[#1E1E26] px-2 py-0.5 rounded text-[#F59E0B] border border-[#F59E0B]/30 font-medium">
                  CEFR {profile.currentLevel} Level
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3">
            <button
              onClick={() => { setCurrentFeedback(null); setActiveTab("practice"); }}
              className={`px-4 py-2 rounded-sm text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "practice" && !currentFeedback
                  ? "bg-[#F59E0B] text-[#0A0A0C] font-bold"
                  : "text-[#A1A1AA] hover:text-white hover:bg-[#1E1E26]"
              }`}
            >
              Practice Arena
            </button>
            <button
              onClick={() => { setActiveTab("library"); }}
              className={`px-4 py-2 rounded-sm text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "library"
                  ? "bg-[#F59E0B] text-[#0A0A0C] font-bold"
                  : "text-[#A1A1AA] hover:text-white hover:bg-[#1E1E26]"
              }`}
            >
              Study Library
            </button>
            <button
              onClick={() => { setActiveTab("settings"); }}
              className={`px-4 py-2 rounded-sm text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "settings" ? "bg-[#1E1E26] text-white" : "text-[#A1A1AA] hover:text-white hover:bg-[#1E1E26]"
              }`}
            >
              <Settings className="w-4.5 h-4.5" />
              Settings
              {!profile.geminiApiKey && (
                <span className="text-[8px] text-red-400 font-bold ml-1.5 animate-pulse bg-red-950/40 border border-red-900/30 px-1.5 py-0.5 rounded-sm">
                  Lấy API key để sử dụng app
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Hand side Analytics & Profile Dashboard Panel */}
        <section className="lg:col-span-1 space-y-6">
          {/* Welcome profile badge */}
          <div className="bg-[#111116] border border-[#1E1E26] p-5 rounded-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-[#1A1A1F] border border-[#1E1E26] flex items-center justify-center text-[#F59E0B]">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-white text-base">{profile.username}’s Hub</h3>
                <span className="text-[10px] text-[#71717A] uppercase tracking-wider block">
                  Target Band: {profile.targetBand}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#1E1E26]">
              <div className="bg-[#1A1A1F] p-2 rounded-sm border border-[#1E1E26]">
                <span className="text-[8px] text-[#71717A] font-semibold block uppercase tracking-wider">Level Target</span>
                <span className="text-xs font-mono text-[#F59E0B] font-semibold">CEFR {profile.currentLevel}</span>
              </div>
              <div className="bg-[#1A1A1F] p-2 rounded-sm border border-[#1E1E26]">
                <span className="text-[8px] text-[#71717A] font-semibold block uppercase tracking-wider">Active Path</span>
                <span className="text-[10px] font-semibold text-[#A1A1AA]">
                  {new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics stats */}
          <div className="bg-[#111116] border border-[#1E1E26] p-5 rounded-sm space-y-4">
            <h4 className="text-[10px] uppercase tracking-widest text-[#71717A]">Coaching Analytics</h4>
            
            <div className="space-y-3">
              {/* Session Practiced count */}
              <div className="flex items-center justify-between p-3 rounded-sm bg-[#1A1A1F] border border-[#1E1E26]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-sm bg-[#111116] flex items-center justify-center text-[#A1A1AA]">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-[#71717A] uppercase block tracking-wider">Graded</span>
                    <span className="text-xs font-semibold text-white">Practice Runs</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#F59E0B] text-xs bg-[#111116] px-2 py-1 rounded-sm border border-[#1E1E26]">
                  {totalPracticed}
                </span>
              </div>

              {/* Average Band score */}
              <div className="flex items-center justify-between p-3 rounded-sm bg-[#1A1A1F] border border-[#1E1E26]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-sm bg-[#111116] flex items-center justify-center text-[#F59E0B]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-[#71717A] uppercase block tracking-wider">Average</span>
                    <span className="text-xs font-semibold text-white">Band Rating</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#F59E0B] text-xs bg-[#111116] px-2 py-1 rounded-sm border border-[#1E1E26]">
                  {averageBand || "N/A"}
                </span>
              </div>

              {/* Practice Streak */}
              <div className="flex items-center justify-between p-3 rounded-sm bg-[#1A1A1F] border border-[#1E1E26]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-sm bg-[#111116] flex items-center justify-center text-[#F59E0B]">
                    <Flame className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-[#71717A] uppercase block tracking-wider">Active</span>
                    <span className="text-xs font-semibold text-white">Streak</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#F59E0B] text-xs bg-[#111116] px-2 py-1 rounded-sm border border-[#1E1E26]">
                  {currentStreak} days
                </span>
              </div>
            </div>
          </div>

          {/* Core Philosophy card */}
          <div className="bg-[#18181B] border border-[#F59E0B]/20 p-5 rounded-sm space-y-2">
            <h5 className="text-[11px] uppercase tracking-widest text-[#F59E0B] font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              IELTS Speaking Secrets
            </h5>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Examiners evaluate <strong>Fluency & Coherence</strong>, <strong>Lexical range</strong>, <strong>Grammar Accuracy</strong>, and <strong>Pronunciation</strong>. Make sure you use robust academic connectors and avoid long empty hesitations!
            </p>
          </div>
        </section>

        {/* Right Hand side Active Tab Workspace Area */}
        <section className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === "practice" && (
              <motion.div
                key="practice-arena"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {currentFeedback ? (
                  /* Graded feedback results view */
                  <FeedbackView
                    feedback={currentFeedback}
                    transcript={currentTranscript}
                    selectedQuestion={currentQuestion!}
                    selectedTopic={currentTopic!}
                    savedCollocations={savedCollocations}
                    onSaveCollocation={handleSaveCollocation}
                    onUnsaveCollocation={handleUnsaveCollocation}
                    onSaveReflection={handleSaveReflection}
                    onNewSession={() => setCurrentFeedback(null)}
                    username={profile.username}
                  />
                ) : (
                  /* Standard practice speaking arena */
                  <SpeakingArena
                    currentLevel={profile.currentLevel}
                    username={profile.username}
                    onEvaluate={handleEvaluate}
                    isEvaluating={isEvaluating}
                    onChangeLevel={(lvl) => setProfile({ ...profile, currentLevel: lvl })}
                  />
                )}

                {errorMessage && (
                  <div className="mt-4 bg-amber-950/20 border border-amber-900/30 rounded-sm p-4 flex items-start gap-3 text-xs text-amber-300">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold uppercase tracking-wider text-[10px]">Evaluation Blocked</p>
                      <p>{errorMessage}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "library" && (
              <motion.div
                key="library-board"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <StudyLibrary
                  sessions={sessions}
                  vocabulary={savedCollocations}
                  worksheets={worksheets}
                  onDeleteSession={(id) => setSessions((prev) => prev.filter((s) => s.id !== id))}
                  onDeleteVocabulary={(id) => setSavedCollocations((prev) => prev.filter((v) => v.id !== id))}
                  onDeleteWorksheet={(id) => setWorksheets((prev) => prev.filter((w) => w.id !== id))}
                  onSelectPastSession={handleSelectPastSession}
                />
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings-page"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-[#111116] border border-[#1E1E26] p-6 rounded-sm space-y-6"
              >
                <div>
                  <h3 className="font-serif text-lg text-white">Profile & Training Settings</h3>
                  <p className="text-xs text-[#71717A]">Configure your personal companion parameters here.</p>
                </div>

                <div className="space-y-4 max-w-md">
                  {/* Username editing */}
                  <div>
                    <label className="block text-xs font-bold text-[#71717A] uppercase tracking-wider mb-2">Username</label>
                    <input
                      type="text"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      placeholder="Enter your name"
                      className="w-full bg-[#1A1A1F] border border-[#1E1E26] text-white rounded-sm px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#F59E0B]/40 focus:border-[#F59E0B]"
                    />
                  </div>

                  {/* Gemini API Key */}
                  <div>
                    <label className="block text-xs font-bold text-[#71717A] uppercase tracking-wider mb-2">Gemini API Key</label>
                    <input
                      type="password"
                      value={profile.geminiApiKey || ""}
                      onChange={(e) => setProfile({ ...profile, geminiApiKey: e.target.value })}
                      placeholder="Enter your Gemini API key (AIzaSy...)"
                      className="w-full bg-[#1A1A1F] border border-[#1E1E26] text-white rounded-sm px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#F59E0B]/40 focus:border-[#F59E0B]"
                    />
                    <span className="text-[10px] text-[#71717A] mt-1.5 block">
                      Lấy mã API key miễn phí tại 
                      <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[#F59E0B] underline font-semibold ml-1">
                        Google AI Studio
                      </a>.
                    </span>
                  </div>

                  {/* AI Model selection Cards */}
                  <div>
                    <label className="block text-xs font-bold text-[#71717A] uppercase tracking-wider mb-2">Select AI Engine Model</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "gemini-3-flash-preview", name: "Gemini 3 Flash", desc: "Fast (Default)" },
                        { id: "gemini-3-pro-preview", name: "Gemini 3 Pro", desc: "Heavy reasoning" },
                        { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", desc: "Standard stable" }
                      ].map((m) => (
                        <div
                          key={m.id}
                          onClick={() => setProfile({ ...profile, aiModel: m.id })}
                          className={`border rounded-sm p-3 cursor-pointer transition-all flex flex-col justify-between ${
                            (profile.aiModel || "gemini-3-flash-preview") === m.id
                              ? "border-[#F59E0B] bg-[#1A1A1F] text-white"
                              : "border-[#1E1E26] bg-[#111116] text-[#A1A1AA] hover:border-[#71717A]"
                          }`}
                        >
                          <span className="text-xs font-bold block">{m.name}</span>
                          <span className="text-[9px] text-[#71717A] mt-1">{m.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CEFR Current level */}
                  <div>
                    <label className="block text-xs font-bold text-[#71717A] uppercase tracking-wider mb-2">Your Current CEFR Speaking Level</label>
                    <select
                      value={profile.currentLevel}
                      onChange={(e) => setProfile({ ...profile, currentLevel: e.target.value as CEFRLevel })}
                      className="w-full bg-[#1A1A1F] border border-[#1E1E26] text-white rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#F59E0B]/40 focus:border-[#F59E0B] cursor-pointer font-medium"
                    >
                      {Object.values(CEFRLevel).map((lvl) => (
                        <option key={lvl} value={lvl} className="bg-[#111116]">
                          CEFR {lvl} ({lvl === CEFRLevel.A1 || lvl === CEFRLevel.A2 ? "Basic" : lvl === CEFRLevel.B1 || lvl === CEFRLevel.B2 ? "Independent" : "Proficient"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Band score */}
                  <div>
                    <label className="block text-xs font-bold text-[#71717A] uppercase tracking-wider mb-2">Target IELTS Band</label>
                    <select
                      value={profile.targetBand}
                      onChange={(e) => setProfile({ ...profile, targetBand: parseFloat(e.target.value) })}
                      className="w-full bg-[#1A1A1F] border border-[#1E1E26] text-white rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#F59E0B]/40 focus:border-[#F59E0B] cursor-pointer font-medium"
                    >
                      {[5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((band) => (
                        <option key={band} value={band} className="bg-[#111116]">
                          Band {band.toFixed(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1E1E26] flex items-center justify-between">
                  <div className="text-xs text-[#71717A]">
                    Data stored offline securely inside your browser local session.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to reset all your practice logs and saved vocab?")) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 px-4 py-2 rounded-sm transition-colors cursor-pointer"
                  >
                    Reset Application Data
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Humble Footer */}
      <footer className="bg-[#111116] border-t border-[#1E1E26] py-6 px-6 text-center mt-12 text-xs text-[#71717A] font-medium">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>
            Designed with expert IELTS criteria. Powered securely by Gemini 3.5 Flash server-side.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[#F59E0B]">English 100% Mode Only</span>
            <span>•</span>
            <span>Standard Examiner Rules</span>
          </div>
        </div>
      </footer>
      {/* Onboarding Mandatory API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-[#111116] border border-[#1E1E26] rounded-sm p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-red-500" />
            
            <div className="space-y-1">
              <h3 className="text-lg font-serif text-white">Gemini API Key Required</h3>
              <p className="text-xs text-[#71717A]">
                An API Key is needed to communicate with the IELTS Coach server. Data is stored locally in your browser.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Your API Key
                </label>
                <input
                  type="password"
                  value={profile.geminiApiKey || ""}
                  onChange={(e) => setProfile({ ...profile, geminiApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full bg-[#1A1A1F] border border-[#1E1E26] text-white rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#F59E0B]/40 focus:border-[#F59E0B]"
                />
              </div>
              
              <div className="bg-[#18181B] border border-[#1E1E26] p-3 rounded-sm text-xs text-[#A1A1AA] leading-relaxed">
                Bạn có thể lấy mã API key miễn phí tại 
                <a
                  href="https://aistudio.google.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F59E0B] underline font-semibold ml-1 inline-block"
                >
                  Google AI Studio
                </a>.
              </div>
            </div>

            <button
              type="button"
              disabled={!profile.geminiApiKey?.trim()}
              onClick={() => setShowApiKeyModal(false)}
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:bg-[#1E1E26] disabled:text-[#71717A] text-[#0A0A0C] font-bold py-2.5 rounded-sm text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Save & Enter App
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
