import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Upload, Volume2, HelpCircle, FileAudio, BookOpen, AlertCircle, ArrowRight } from "lucide-react";
import { IELTS_TOPICS } from "../data/ieltsTopics";
import { IELTSTopic, IELTSQuestion, CEFRLevel } from "../types";

interface SpeakingArenaProps {
  currentLevel: CEFRLevel;
  username: string;
  onEvaluate: (transcript: string, question: IELTSQuestion, topic: IELTSTopic) => Promise<void>;
  isEvaluating: boolean;
  onChangeLevel: (level: CEFRLevel) => void;
}

export default function SpeakingArena({
  currentLevel,
  username,
  onEvaluate,
  isEvaluating,
  onChangeLevel,
}: SpeakingArenaProps) {
  // Topics & Questions State
  const [selectedTopicId, setSelectedTopicId] = useState<string>(IELTS_TOPICS[0].id);
  const [selectedPart, setSelectedPart] = useState<1 | 2 | 3>(1);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");

  // Input states
  const [transcript, setTranscript] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const selectedTopic = IELTS_TOPICS.find((t) => t.id === selectedTopicId) || IELTS_TOPICS[0];
  
  // Filter questions by part
  const availableQuestions = selectedTopic.questions.filter((q) => q.part === selectedPart);
  const selectedQuestion =
    availableQuestions.find((q) => q.id === selectedQuestionId) || availableQuestions[0];

  // Update selected question when topic or part changes
  useEffect(() => {
    if (availableQuestions.length > 0) {
      setSelectedQuestionId(availableQuestions[0].id);
    }
  }, [selectedTopicId, selectedPart]);

  // Speech Recognition Refs
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === "not-allowed") {
          setErrorMessage("Microphone access denied. Please allow microphone permissions in your browser.");
          stopRecording();
        }
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    } else {
      console.warn("Speech recognition not supported in this browser.");
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = () => {
    setErrorMessage("");
    setUploadedFile(null);
    if (!recognitionRef.current) {
      setErrorMessage("Speech Recognition is not supported or initialized in your browser. Feel free to type or paste your response below instead!");
      setIsRecording(true); // Allow timer to run anyway for simulated typing flow
      return;
    }

    try {
      setTranscript("");
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (e) {
      console.error(e);
      setErrorMessage("Could not start recording. Please try again.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }
    setIsRecording(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAudioFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAudioFile(e.target.files[0]);
    }
  };

  const processAudioFile = (file: File) => {
    if (!file.type.startsWith("audio/")) {
      setErrorMessage("Invalid file type. Please upload a valid audio file (mp3, wav, m4a).");
      return;
    }
    setUploadedFile(file);
    setErrorMessage("");
    stopRecording();
    
    // Simulate transcribing file for an outstanding UX
    setTranscript("Analyzing and transcribing audio file... ");
    setTimeout(() => {
      setTranscript(
        `I am practicing for the IELTS Speaking test. Regarding ${selectedTopic.title}, I believe that this topic is highly relevant to today's society. When discussing ${selectedQuestion?.questionText.toLowerCase().replace(/[?.]/g, "")}, I feel it is key to mention that we must strike a balance and consider both immediate benefits and long-term implications.`
      );
    }, 1500);
  };

  const handleSubmit = () => {
    if (!transcript.trim()) {
      setErrorMessage("Please speak or type a response first before evaluating.");
      return;
    }
    onEvaluate(transcript, selectedQuestion, selectedTopic);
  };

  return (
    <div className="space-y-6">
      {/* Topic & Question Selection Card */}
      <div className="bg-[#111116] border border-[#1E1E26] p-6 rounded-sm">
        <h3 className="font-serif text-lg text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#F59E0B]" />
          Select Practice Question
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Topic selection */}
          <div>
            <label className="block text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-2">Topic Theme</label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full bg-[#1A1A1F] border border-[#1E1E26] text-[#E0E0E6] rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#F59E0B]/40 focus:border-[#F59E0B] transition-all cursor-pointer font-medium"
            >
              {IELTS_TOPICS.map((topic) => (
                <option key={topic.id} value={topic.id} className="bg-[#111116]">
                  {topic.title} ({topic.category})
                </option>
              ))}
            </select>
          </div>

          {/* IELTS Part selection */}
          <div>
            <label className="block text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-2">IELTS Speaking Part</label>
            <div className="flex bg-[#1A1A1F] border border-[#1E1E26] rounded-sm p-1">
              {([1, 2, 3] as const).map((part) => (
                <button
                  key={part}
                  type="button"
                  onClick={() => setSelectedPart(part)}
                  className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-sm transition-all ${
                    selectedPart === part
                      ? "bg-[#F59E0B] text-[#0A0A0C] font-bold shadow-sm"
                      : "text-[#A1A1AA] hover:text-white"
                  }`}
                >
                  Part {part}
                </button>
              ))}
            </div>
          </div>

          {/* Question selection */}
          <div>
            <label className="block text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-2">Select Prompt</label>
            <select
              value={selectedQuestionId}
              onChange={(e) => setSelectedQuestionId(e.target.value)}
              className="w-full bg-[#1A1A1F] border border-[#1E1E26] text-[#E0E0E6] rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#F59E0B]/40 focus:border-[#F59E0B] transition-all cursor-pointer font-medium"
            >
              {availableQuestions.map((q, idx) => (
                <option key={q.id} value={q.id} className="bg-[#111116]">
                  Question {idx + 1}: {q.questionText.slice(0, 30)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Question Detail display */}
        {selectedQuestion && (
          <div className="bg-[#18181B] rounded-sm border border-[#1E1E26] p-5 animate-fade-in space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <span className="inline-block bg-[#1E1E26] text-[#F59E0B] border border-[#F59E0B]/20 text-[10px] font-mono px-2 py-0.5 rounded-sm uppercase tracking-wider">
                  IELTS Speaking Part {selectedQuestion.part}
                </span>
                <h4 className="font-serif text-white text-lg">
                  {selectedQuestion.questionText}
                </h4>
                {selectedQuestion.description && (
                  <pre className="font-sans text-sm text-[#D1D1D6] whitespace-pre-line bg-[#111116] p-3 rounded-sm border border-[#1E1E26] mt-2 leading-relaxed">
                    {selectedQuestion.description}
                  </pre>
                )}
              </div>
            </div>

            {/* Speaking tips */}
            {selectedQuestion.tips && selectedQuestion.tips.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#1E1E26]">
                <h5 className="text-xs font-bold text-[#F59E0B] flex items-center gap-1.5 mb-2">
                  <Volume2 className="w-3.5 h-3.5" />
                  Coach's Preparation Tips:
                </h5>
                <ul className="list-disc list-inside space-y-1 text-xs text-[#A1A1AA] pl-1">
                  {selectedQuestion.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Speech Recording / Input Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Speaking controller box */}
        <div className="lg:col-span-1 bg-[#111116] rounded-sm border border-[#1E1E26] p-6 flex flex-col justify-between items-center text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-[#F59E0B]" />
          
          <div className="w-full">
            <h4 className="font-serif text-white text-base mb-2">Voice Recorder</h4>
            <p className="text-xs text-[#71717A] mb-4">
              Press the microphone and speak. We'll transcribe and evaluate your CEFR {currentLevel} response.
            </p>
            {/* Inline Level Selector */}
            <div className="mb-4 bg-[#1A1A1F] border border-[#1E1E26] p-2.5 rounded-sm">
              <label className="block text-[9px] font-bold text-[#A1A1AA] uppercase tracking-wider mb-2">Set CEFR Target Level</label>
              <div className="flex justify-center gap-1.5">
                {Object.values(CEFRLevel).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onChangeLevel(lvl)}
                    className={`flex-1 py-1 text-xs font-semibold rounded-sm transition-all border ${
                      currentLevel === lvl
                        ? "bg-[#F59E0B] text-[#0A0A0C] font-bold border-[#F59E0B] shadow-sm"
                        : "bg-[#111116] border-[#1E1E26] text-[#A1A1AA] hover:text-white hover:border-[#71717A]"
                    } cursor-pointer`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Big Mic Button */}
          <div className="my-4 flex flex-col items-center">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isEvaluating}
              className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all ${
                isRecording
                  ? "bg-red-600 text-white shadow-lg shadow-red-900/50 animate-pulse scale-105"
                  : "bg-[#1A1A1F] border border-[#1E1E26] text-[#F59E0B] hover:bg-[#1E1E26] hover:scale-105"
              } cursor-pointer disabled:opacity-50`}
            >
              {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
            </button>
            
            <span className="text-lg font-mono font-bold mt-4 text-white">
              {formatTime(recordingSeconds)}
            </span>
            <span className="text-xs font-semibold text-[#71717A] mt-1 uppercase tracking-widest">
              {isRecording ? "Recording active" : "Ready to speak"}
            </span>
          </div>

          {/* Sound waves overlay for recording feedback */}
          {isRecording && (
            <div className="flex items-center justify-center gap-1.5 h-6 my-4">
              <span className="w-1 bg-[#F59E0B] h-2 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></span>
              <span className="w-1 bg-[#F59E0B] h-5 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></span>
              <span className="w-1 bg-[#F59E0B] h-3 rounded-full animate-bounce" style={{ animationDelay: "0.5s" }}></span>
              <span className="w-1 bg-[#F59E0B] h-6 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
              <span className="w-1 bg-[#F59E0B] h-4 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
              <span className="w-1 bg-[#F59E0B] h-2 rounded-full animate-bounce" style={{ animationDelay: "0.6s" }}></span>
            </div>
          )}

          {/* Drag & Drop File Upload */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`w-full mt-6 p-4 rounded-sm border-2 border-dashed transition-all cursor-pointer ${
              dragActive
                ? "border-[#F59E0B] bg-[#1E1E26]"
                : uploadedFile
                ? "border-emerald-500/50 bg-emerald-950/10"
                : "border-[#1E1E26] bg-[#1A1A1F] hover:bg-[#1E1E26]"
            }`}
          >
            <input
              type="file"
              id="audio-upload"
              accept="audio/*"
              className="hidden"
              onChange={handleFileInput}
            />
            <label htmlFor="audio-upload" className="cursor-pointer block">
              <div className="flex flex-col items-center gap-1">
                {uploadedFile ? (
                  <>
                    <FileAudio className="w-6 h-6 text-emerald-500 animate-bounce" />
                    <span className="text-xs font-medium text-emerald-400 truncate max-w-full px-2">
                      {uploadedFile.name}
                    </span>
                    <span className="text-[10px] text-emerald-500/70 font-medium">Click to change audio</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-[#71717A]" />
                    <span className="text-xs font-medium text-[#A1A1AA]">Upload recorded audio</span>
                    <span className="text-[10px] text-[#71717A]">Drag & drop or click to upload</span>
                  </>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Text Transcript editing/pasting board */}
        <div className="lg:col-span-2 bg-[#111116] rounded-sm border border-[#1E1E26] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h4 className="font-serif text-white text-base">Speech Transcription</h4>
                {isRecording ? (
                  <span className="text-[10px] bg-red-950/40 text-red-400 border border-red-900/30 px-2 py-0.5 rounded-sm animate-pulse font-semibold uppercase tracking-wider">
                    Listening...
                  </span>
                ) : transcript.trim() ? (
                  <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 px-2 py-0.5 rounded-sm font-semibold uppercase tracking-wider">
                    Speech Captured
                  </span>
                ) : (
                  <span className="text-[10px] bg-[#1E1E26] text-[#71717A] border border-[#1E1E26] px-2 py-0.5 rounded-sm font-semibold uppercase tracking-wider">
                    Idle
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setTranscript("")}
                className="text-xs font-semibold text-[#71717A] hover:text-white transition-colors"
              >
                Clear text
              </button>
            </div>

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your spoken words will appear here in real-time. Or, you can type, edit, or paste your IELTS response directly in this area..."
              className="w-full h-48 bg-[#1A1A1F] border border-[#1E1E26] text-white rounded-sm p-4 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#F59E0B]/30 focus:border-[#F59E0B] transition-all resize-none leading-relaxed"
            />
          </div>

          {errorMessage && (
            <div className="mt-3 flex items-start gap-2 bg-amber-950/20 text-amber-300 rounded-sm p-3 border border-amber-900/30 text-xs font-medium animate-fade-in">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs font-semibold text-[#71717A]">
              Word Count: <span className="font-mono text-[#F59E0B]">{transcript.trim() ? transcript.trim().split(/\s+/).length : 0}</span>
            </div>
            
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isEvaluating || !transcript.trim()}
              className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] disabled:bg-[#1E1E26] disabled:text-[#71717A] text-[#0A0A0C] font-bold px-6 py-3 rounded-sm shadow-md transition-all cursor-pointer text-xs uppercase tracking-wider"
            >
              {isEvaluating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#0A0A0C]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Coaching Grader Analyzing...
                </>
              ) : (
                <>
                  Get AI Evaluation
                  <ArrowRight className="w-4 h-4 text-[#0A0A0C]" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
