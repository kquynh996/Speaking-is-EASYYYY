import React, { useState, useRef } from "react";
import { Award, BookOpen, CheckCircle, RefreshCw, Bookmark, BookmarkCheck, FileText, ChevronRight, CornerDownRight, MessageSquare, Compass, Info, Volume2, Download, Star } from "lucide-react";
import { IELTSFeedback, SavedCollocation, IELTSQuestion, IELTSTopic } from "../types";

interface FeedbackViewProps {
  feedback: IELTSFeedback;
  transcript: string;
  selectedQuestion: IELTSQuestion;
  selectedTopic: IELTSTopic;
  savedCollocations: SavedCollocation[];
  onSaveCollocation: (collocation: Omit<SavedCollocation, "id" | "savedAt">) => void;
  onUnsaveCollocation: (phrase: string) => void;
  onSaveReflection: (answers: { [key: number]: string }, learningPoint: string, generalNotes: string, confidence: number) => void;
  onNewSession: () => void;
  username: string;
}

export default function FeedbackView({
  feedback,
  transcript,
  selectedQuestion,
  selectedTopic,
  savedCollocations,
  onSaveCollocation,
  onUnsaveCollocation,
  onSaveReflection,
  onNewSession,
  username,
}: FeedbackViewProps) {
  const [activeTab, setActiveTab] = useState<"grades" | "corrections" | "vocabulary" | "reflection">("grades");
  const [reflectionAnswers, setReflectionAnswers] = useState<{ [key: number]: string }>({});
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);
  const [generalNotes, setGeneralNotes] = useState("");
  const [selfConfidence, setSelfConfidence] = useState(3); // Default 3 stars

  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const ttsUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const handleToggleTTS = () => {
    if (isPlayingTTS) {
      window.speechSynthesis.cancel();
      setIsPlayingTTS(false);
      return;
    }

    const name = username || "Learner";
    const textToSpeak = `Hello ${name}. Here is your IELTS speaking feedback for the topic: ${selectedTopic.title}. Your overall band score is ${feedback.overallBandScore}. For fluency and coherence, you scored ${feedback.fluencyAndCoherence.score}. ${feedback.fluencyAndCoherence.comment}. For lexical resource, you scored ${feedback.lexicalResource.score}. ${feedback.lexicalResource.comment}. The main focus point for you today is: ${feedback.todayLearningPoint}. Keep practicing!`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "en-US";
    utterance.rate = 0.95; // Slightly slower for clear instruction
    
    utterance.onend = () => {
      setIsPlayingTTS(false);
    };
    utterance.onerror = () => {
      setIsPlayingTTS(false);
    };

    ttsUtteranceRef.current = utterance;
    setIsPlayingTTS(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleExportDocument = () => {
    const name = username || "Learner";
    const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
    
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <title>IELTS Speaking Coach Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; }
          h1 { color: #D97706; border-bottom: 2px solid #D97706; padding-bottom: 5px; }
          h2 { color: #1E3A8A; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #F3F4F6; font-weight: bold; }
          .highlight { background-color: #FEF3C7; padding: 10px; border-left: 4px solid #D97706; margin: 10px 0; font-style: italic; }
          .error-box { background-color: #FEE2E2; padding: 10px; border-left: 4px solid #DC2626; margin: 5px 0; }
          .correction-box { background-color: #D1FAE5; padding: 10px; border-left: 4px solid #059669; margin: 5px 0; }
        </style>
      </head>
      <body>
        <h1>IELTS Speaking Excellence Coach - Study Report</h1>
        <p><strong>Student Name:</strong> ${name}</p>
        <p><strong>Date:</strong> ${dateStr}</p>
        <p><strong>Topic:</strong> ${selectedTopic.title}</p>
        <p><strong>Question:</strong> "${selectedQuestion.questionText}"</p>
        
        <hr/>
        
        <h2>1. Evaluation Grades & Ratings</h2>
        <table>
          <tr><th>Criteria</th><th>Band Score</th></tr>
          <tr><td>Overall Band Score</td><td><strong>${feedback.overallBandScore} / 9.0</strong></td></tr>
          <tr><td>Fluency and Coherence</td><td>${feedback.fluencyAndCoherence.score} / 9.0</td></tr>
          <tr><td>Lexical Resource (Vocabulary)</td><td>${feedback.lexicalResource.score} / 9.0</td></tr>
          <tr><td>Grammar Range & Accuracy</td><td>${feedback.grammaticalRangeAccuracy.score} / 9.0</td></tr>
          <tr><td>Pronunciation Proxy</td><td>${feedback.pronunciation.score} / 9.0</td></tr>
        </table>
        
        <h3>Examiner Feedback Pointers:</h3>
        <ul>
          <li><strong>Fluency:</strong> ${feedback.fluencyAndCoherence.comment}</li>
          <li><strong>Vocabulary:</strong> ${feedback.lexicalResource.comment}</li>
          <li><strong>Grammar:</strong> ${feedback.grammaticalRangeAccuracy.comment}</li>
          <li><strong>Pronunciation:</strong> ${feedback.pronunciation.comment}</li>
        </ul>
        
        <div class="highlight">
          <strong>Today's Focus Learning Point:</strong> ${feedback.todayLearningPoint}
        </div>
        
        <hr/>
        
        <h2>2. Speech Transcript</h2>
        <p style="font-style: italic; color: #555;">"${transcript}"</p>
        
        <hr/>
        
        <h2>3. Grammar Corrections & Upgrades</h2>
        ${feedback.errorsIdentified && feedback.errorsIdentified.length > 0 ? 
          feedback.errorsIdentified.map(err => `
            <div class="error-box"><strong>Mistake:</strong> "${err.error}"</div>
            <div class="correction-box"><strong>Correction:</strong> "${err.correction}"</div>
            <p style="margin-left: 15px;"><em>Explanation:</em> ${err.explanation}</p>
          `).join('') : '<p>No grammatical errors identified.</p>'
        }
        
        <h3>Suggested Sentence Upgrades:</h3>
        <ul>
          ${feedback.suggestedImprovements ? feedback.suggestedImprovements.map(imp => `
            <li><strong>Original:</strong> "${imp.original}" <br/> <strong>Upgrade:</strong> "${imp.betterWay}"</li>
          `).join('') : '<li>No upgrades suggested.</li>'}
        </ul>
        
        <hr/>
        
        <h2>4. High-Scoring Collocations</h2>
        <table>
          <tr><th>Phrase</th><th>Meaning</th><th>Example</th></tr>
          ${feedback.keyCollocations ? feedback.keyCollocations.map(col => `
            <tr>
              <td><strong>${col.phrase}</strong></td>
              <td>${col.explanation}</td>
              <td>"${col.example}"</td>
            </tr>
          `).join('') : '<tr><td colspan="3">No collocations.</td></tr>'}
        </table>
        
        <hr/>
        
        <h2>5. Model Answer (Band 8.5+)</h2>
        <p style="white-space: pre-line;">${feedback.sampleAnswer}</p>
        
        <hr/>
        
        <h2>6. Self-Reflection Worksheet</h2>
        ${feedback.selfReflectionQuestions ? feedback.selfReflectionQuestions.map((q, idx) => `
          <p><strong>Q${idx+1}: ${q}</strong></p>
          <p><em>A:</em> ${reflectionAnswers[idx] || 'Not answered.'}</p>
        `).join('') : ''}
        
        <p><strong>General Notes / Takeaways:</strong></p>
        <p>${generalNotes || 'None'}</p>
        <p><strong>Self-Confidence Rating:</strong> ${'★'.repeat(selfConfidence) + '☆'.repeat(5 - selfConfidence)}</p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IELTS_Speaking_Report_${selectedTopic.title.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper to determine score color
  const getScoreColor = (score: number) => {
    if (score >= 7.5) return "text-emerald-400 bg-emerald-950/20 border-emerald-900/30";
    if (score >= 6.0) return "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20";
    if (score >= 4.5) return "text-orange-400 bg-orange-950/20 border-orange-900/30";
    return "text-red-400 bg-red-950/20 border-red-900/30";
  };

  const getStrokeDash = (score: number) => {
    // 2 * PI * r = 2 * 3.14 * 18 = 113
    const max = 113;
    const percentage = score / 9.0;
    return max - percentage * max;
  };

  const isCollocationSaved = (phrase: string) => {
    return savedCollocations.some((item) => item.phrase.toLowerCase() === phrase.toLowerCase());
  };

  const handleToggleCollocation = (colloc: { phrase: string; explanation: string; example: string }) => {
    if (isCollocationSaved(colloc.phrase)) {
      onUnsaveCollocation(colloc.phrase);
    } else {
      onSaveCollocation({
        phrase: colloc.phrase,
        explanation: colloc.explanation,
        example: colloc.example,
        topicTitle: selectedTopic.title,
      });
    }
  };

  const handleSubmitReflection = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveReflection(reflectionAnswers, feedback.todayLearningPoint, generalNotes, selfConfidence);
    setReflectionSubmitted(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Overview Card */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-sm p-6 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-5 transform translate-y-6 translate-x-6">
          <Award className="w-64 h-64 text-white" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <span className="inline-block bg-[#1E1E26] border border-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-bold font-mono px-3 py-1 rounded-sm uppercase tracking-wider">
              Coaching Report Completed
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-normal text-white">
              Evaluation & Upgrades
            </h2>
            <p className="text-[#A1A1AA] text-sm max-w-xl">
              Topic: <span className="text-white font-semibold">{selectedTopic.title}</span> • Question: <span className="text-white font-semibold">"{selectedQuestion.questionText}"</span>
            </p>
            
            <div className="flex flex-wrap gap-2 pt-1.5">
              <button
                onClick={handleToggleTTS}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold border transition-all cursor-pointer ${
                  isPlayingTTS
                    ? "bg-red-950/20 text-red-400 border-red-900/30 font-bold"
                    : "bg-[#1E1E26] text-[#F59E0B] border-[#F59E0B]/20 hover:border-[#F59E0B]"
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                {isPlayingTTS ? "Stop Reading" : "Read Aloud Evaluation"}
              </button>

              <button
                onClick={handleExportDocument}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold bg-[#1E1E26] text-white border border-[#1E1E26] hover:border-[#71717A] hover:bg-[#1A1A1F] transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#F59E0B]" />
                Export Word Document
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[#1A1A1F] border border-[#1E1E26] rounded-sm p-4 self-start md:self-auto">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="#1E1E26" strokeWidth="4" fill="none" />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#F59E0B"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="175"
                  strokeDashoffset={175 - (feedback.overallBandScore / 9.0) * 175}
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-xl font-bold font-mono text-white">{feedback.overallBandScore}</span>
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-widest">Overall Band</div>
              <div className="text-xs font-semibold text-[#A1A1AA]">Coach Approved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex bg-[#111116] border border-[#1E1E26] p-1 rounded-sm overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("grades")}
          className={`flex-1 min-w-[120px] text-center py-2.5 text-xs font-semibold rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "grades"
              ? "bg-[#F59E0B] text-[#0A0A0C] font-bold"
              : "text-[#A1A1AA] hover:text-white hover:bg-[#1E1E26]"
          }`}
        >
          <Award className="w-4 h-4" />
          Metrics & Grades
        </button>
        <button
          onClick={() => setActiveTab("corrections")}
          className={`flex-1 min-w-[120px] text-center py-2.5 text-xs font-semibold rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "corrections"
              ? "bg-[#F59E0B] text-[#0A0A0C] font-bold"
              : "text-[#A1A1AA] hover:text-white hover:bg-[#1E1E26]"
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Grammar & Errors
        </button>
        <button
          onClick={() => setActiveTab("vocabulary")}
          className={`flex-1 min-w-[120px] text-center py-2.5 text-xs font-semibold rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "vocabulary"
              ? "bg-[#F59E0B] text-[#0A0A0C] font-bold"
              : "text-[#A1A1AA] hover:text-white hover:bg-[#1E1E26]"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Vocabulary & Model
        </button>
        <button
          onClick={() => setActiveTab("reflection")}
          className={`flex-1 min-w-[120px] text-center py-2.5 text-xs font-semibold rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "reflection"
              ? "bg-[#F59E0B] text-[#0A0A0C] font-bold"
              : "text-[#A1A1AA] hover:text-white hover:bg-[#1E1E26]"
          }`}
        >
          <FileText className="w-4 h-4" />
          Reflection Worksheet
        </button>
      </div>

      {/* Tab Contents */}
      <div className="animate-fade-in">
        {/* GRADES TAB */}
        {activeTab === "grades" && (
          <div className="space-y-6">
            {/* Criteria Scores Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Fluency & Coherence", data: feedback.fluencyAndCoherence, desc: "Pacing, connectors, structure" },
                { label: "Lexical Resource", data: feedback.lexicalResource, desc: "Vocabulary range and precision" },
                { label: "Grammar Range/Accuracy", data: feedback.grammaticalRangeAccuracy, desc: "Complexity and syntax correctness" },
                { label: "Pronunciation Proxy", data: feedback.pronunciation, desc: "Word chunks, articulation indicators" },
              ].map((criteria, i) => (
                <div key={i} className="bg-[#111116] border border-[#1E1E26] rounded-sm p-5 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold text-[#71717A] uppercase tracking-wide max-w-[140px]">
                      {criteria.label}
                    </span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-sm border ${getScoreColor(criteria.data.score)}`}>
                      {criteria.data.score}/9.0
                    </span>
                  </div>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed font-sans mt-2">
                    {criteria.data.comment}
                  </p>
                  <p className="text-[10px] text-[#71717A] font-medium italic pt-2 border-t border-[#1E1E26]">
                    {criteria.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Today's Learning Point Callout */}
            <div className="bg-[#18181B] border border-[#F59E0B]/20 p-5 rounded-sm flex items-start gap-3.5">
              <Compass className="w-6 h-6 text-[#F59E0B] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-serif text-white text-base mb-1">
                  Today's Master Focus Point
                </h4>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  {feedback.todayLearningPoint}
                </p>
              </div>
            </div>

            {/* Speaking Transcript Viewer */}
            <div className="bg-[#111116] border border-[#1E1E26] rounded-sm p-6">
              <h4 className="font-serif text-white text-base mb-3">Your Spoken Transcript</h4>
              <div className="bg-[#1A1A1F] p-4 rounded-sm border border-[#1E1E26] text-xs text-[#A1A1AA] leading-relaxed italic max-h-40 overflow-y-auto font-sans">
                "{transcript}"
              </div>
            </div>
          </div>
        )}

        {/* CORRECTIONS TAB */}
        {activeTab === "corrections" && (
          <div className="space-y-6">
            {/* Grammatical and Vocabulary Errors Identified */}
            <div className="bg-[#111116] border border-[#1E1E26] rounded-sm p-6">
              <h3 className="font-serif text-white text-base mb-4 flex items-center gap-2">
                Grammar & Vocabulary Correction
              </h3>

              {feedback.errorsIdentified && feedback.errorsIdentified.length > 0 ? (
                <div className="space-y-4">
                  {feedback.errorsIdentified.map((err, i) => (
                    <div key={i} className="border border-[#1E1E26] rounded-sm p-4 bg-[#1A1A1F] space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-red-950/20 border border-red-900/30 rounded-sm p-3">
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block mb-1">Original Slip-up</span>
                          <span className="text-xs font-medium text-red-300 font-mono">"{err.error}"</span>
                        </div>
                        <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-sm p-3">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">Corrected Version</span>
                          <span className="text-xs font-semibold text-emerald-300 font-mono">"{err.correction}"</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#A1A1AA] pl-1 leading-relaxed">
                        <strong className="text-white">Grammar Rule:</strong> {err.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-sm p-8 text-center space-y-2">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="font-serif text-emerald-300 text-sm">Flawless Grammatical Flow</h4>
                  <p className="text-xs text-[#71717A] max-w-sm mx-auto">
                    The Coach couldn't detect any explicit grammatical mistakes or basic word errors in this transcript. Excellent execution!
                  </p>
                </div>
              )}
            </div>

            {/* Sentence Upgrades & Polishing */}
            <div className="bg-[#111116] border border-[#1E1E26] rounded-sm p-6">
              <h3 className="font-serif text-white text-base mb-4 flex items-center gap-2">
                Academic Upgrade Suggestions
              </h3>
              <p className="text-xs text-[#71717A] mb-4">
                To move your band score to 7.5+, substitute your basic descriptions with more academic configurations and idiomatic structures:
              </p>

              {feedback.suggestedImprovements && feedback.suggestedImprovements.length > 0 ? (
                <div className="space-y-4">
                  {feedback.suggestedImprovements.map((imp, i) => (
                    <div key={i} className="bg-[#1A1A1F] border border-[#1E1E26] rounded-sm p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-[9px] font-mono font-bold bg-[#1E1E26] text-[#A1A1AA] border border-[#1E1E26] rounded px-1.5 py-0.5 uppercase">B1 Level</span>
                        <p className="text-xs text-[#A1A1AA] italic">"{imp.original}"</p>
                      </div>
                      <div className="flex items-start gap-2 pt-2 border-t border-[#1E1E26]">
                        <span className="text-[9px] font-mono font-bold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 rounded px-1.5 py-0.5 uppercase">Upgrade Band 8+</span>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-white">"{imp.betterWay}"</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#71717A] italic">No upgrade pointers suggested for this session.</p>
              )}
            </div>
          </div>
        )}

        {/* VOCABULARY & SAMPLE ANSWER TAB */}
        {activeTab === "vocabulary" && (
          <div className="space-y-6">
            {/* High-Scoring Collocations */}
            <div className="bg-[#111116] border border-[#1E1E26] rounded-sm p-6">
              <h3 className="font-serif text-white text-base mb-2 flex items-center gap-2">
                Vocabulary Expansion (Topic-Based)
              </h3>
              <p className="text-xs text-[#71717A] mb-4">
                Bookmark these collocations to automatically save them inside your personal study bank.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedback.keyCollocations && feedback.keyCollocations.length > 0 ? (
                  feedback.keyCollocations.map((colloc, i) => {
                    const saved = isCollocationSaved(colloc.phrase);
                    return (
                      <div key={i} className="border border-[#1E1E26] rounded-sm p-4 bg-[#1A1A1F] flex justify-between items-start gap-4">
                        <div className="space-y-2">
                          <span className="inline-block bg-[#1E1E26] text-[#F59E0B] border border-[#F59E0B]/20 text-xs font-bold font-mono px-2 py-0.5 rounded-sm">
                            {colloc.phrase}
                          </span>
                          <p className="text-xs text-[#A1A1AA] leading-relaxed">
                            <strong className="text-white">Meaning:</strong> {colloc.explanation}
                          </p>
                          <div className="text-xs text-[#71717A] font-sans italic bg-[#111116] p-2 rounded-sm border border-[#1E1E26]">
                            <strong>Eg:</strong> "{colloc.example}"
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleCollocation(colloc)}
                          type="button"
                          className={`p-2 rounded-sm transition-all cursor-pointer ${
                            saved
                              ? "bg-[#F59E0B] text-[#0A0A0C] hover:bg-[#D97706]"
                              : "bg-[#1E1E26] text-[#A1A1AA] hover:bg-[#F59E0B]/10 hover:text-[#F59E0B]"
                          }`}
                          title={saved ? "Unsave Word" : "Save to Vocab Bank"}
                        >
                          {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-[#71717A] italic">No vocabulary collocation listed.</p>
                )}
              </div>
            </div>

            {/* Model Sample Answer */}
            <div className="bg-[#111116] border border-[#1E1E26] rounded-sm p-6">
              <h3 className="font-serif text-white text-base mb-3 flex items-center gap-2">
                Model Sample Answer (Band 8.5+)
              </h3>
              <p className="text-xs text-[#71717A] mb-4">
                Study how an expert organizes their speech, creates coherence, and deploys academic vocabulary:
              </p>

              <div className="bg-[#1A1A1F] p-5 rounded-sm border border-[#1E1E26] text-xs text-[#A1A1AA] leading-relaxed font-sans whitespace-pre-line">
                {feedback.sampleAnswer}
              </div>
            </div>
          </div>
        )}

        {/* REFLECTION TAB */}
        {activeTab === "reflection" && (
          <div className="space-y-6">
            <div className="bg-[#111116] border border-[#1E1E26] rounded-sm p-6">
              <div className="flex items-start gap-3.5 mb-6">
                <FileText className="w-6 h-6 text-[#F59E0B] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-serif text-white text-base mb-1">
                    Your Personalized Reflection Worksheet
                  </h3>
                  <p className="text-xs text-[#71717A]">
                    Self-reflection is the secret weapon to double your learning speed. Complete this worksheet to cement your breakthroughs into your history log.
                  </p>
                </div>
              </div>

              {reflectionSubmitted ? (
                <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-sm p-6 text-center space-y-2 animate-fade-in">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="font-serif text-emerald-300 text-sm">Reflection Worksheet Saved</h4>
                  <p className="text-xs text-[#A1A1AA] max-w-md mx-auto">
                    Your responses have been archived to your Study Library! You can review your self-assessments anytime under the "Study Library" tab in the dashboard.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReflection} className="space-y-6">
                  <div className="bg-[#1A1A1F] p-4 rounded-sm border border-[#1E1E26] text-xs text-[#A1A1AA]">
                    <strong className="text-[#F59E0B]">Lesson of the Session:</strong> {feedback.todayLearningPoint}
                  </div>

                  {/* Confidence Rating */}
                  <div className="bg-[#1A1A1F] p-4 rounded-sm border border-[#1E1E26] space-y-2">
                    <label className="block text-xs font-semibold text-white">
                      Rate your speaking confidence in this session:
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setSelfConfidence(star)}
                          className="p-1 text-[#F59E0B] hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className="w-6 h-6"
                            fill={star <= selfConfidence ? "#F59E0B" : "none"}
                            stroke="currentColor"
                          />
                        </button>
                      ))}
                      <span className="text-xs text-[#71717A] ml-2 font-mono">({selfConfidence}/5 stars)</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {feedback.selfReflectionQuestions && feedback.selfReflectionQuestions.map((q, idx) => (
                      <div key={idx} className="space-y-2">
                        <label className="block text-xs font-semibold text-white">
                          {idx + 1}. {q}
                        </label>
                        <textarea
                          required
                          value={reflectionAnswers[idx] || ""}
                          onChange={(e) => setReflectionAnswers({ ...reflectionAnswers, [idx]: e.target.value })}
                          placeholder="Write your honest assessment or notes here..."
                          className="w-full h-20 bg-[#1A1A1F] border border-[#1E1E26] text-white rounded-sm p-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#F59E0B]/30 focus:border-[#F59E0B] transition-all resize-none font-sans"
                        />
                      </div>
                    ))}
                  </div>

                  {/* General notes */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-white">
                      My General Reflection & Key Takeaways
                    </label>
                    <textarea
                      value={generalNotes}
                      onChange={(e) => setGeneralNotes(e.target.value)}
                      placeholder="Write down any personal notes, key phrases, or reminders you want to remember..."
                      className="w-full h-24 bg-[#1A1A1F] border border-[#1E1E26] text-white rounded-sm p-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#F59E0B]/30 focus:border-[#F59E0B] transition-all resize-none font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0C] font-bold py-3 px-4 rounded-sm text-xs transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    Save Reflection Worksheet
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNewSession}
          className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0C] font-bold px-6 py-3 rounded-sm transition-all text-xs cursor-pointer uppercase tracking-wider"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Practice Another Question
        </button>
      </div>
    </div>
  );
}
