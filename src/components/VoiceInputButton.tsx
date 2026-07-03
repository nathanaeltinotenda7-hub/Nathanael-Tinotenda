import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Sparkles, Loader2, Check, X, AlertCircle } from "lucide-react";

interface VoiceInputButtonProps {
  onTranscriptComplete: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export default function VoiceInputButton({ 
  onTranscriptComplete, 
  className = "" 
}: VoiceInputButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [style, setStyle] = useState<"direct" | "casual" | "professional" | "social">("casual");
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      rec.onresult = (event: any) => {
        let finalStr = "";
        let interimStr = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript;
          } else {
            interimStr += event.results[i][0].transcript;
          }
        }

        if (finalStr) {
          setTranscript(prev => {
            const separator = prev && !prev.endsWith(" ") ? " " : "";
            return prev + separator + finalStr;
          });
        }
        setInterimTranscript(interimStr);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "aborted") {
          // 'aborted' is commonly triggered when stop() is called or when the session is ended or preempted.
          // It's not a true user-facing error we need to display.
          setIsListening(false);
          return;
        }
        if (event.error === "no-speech") {
          setError("No speech was detected. Please try speaking closer to your microphone or check your mic volume.");
          setIsListening(false);
          return;
        }
        if (event.error === "not-allowed") {
          setError("Microphone permission denied. Ensure microphone access is allowed, or try the simulator below!");
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } else {
      console.warn("Web Speech API is not supported in this browser.");
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript("");
      setInterimTranscript("");
      setError(null);
      
      if (!recognitionRef.current) {
        setError("Speech recognition is not supported in this browser. Please use Chrome/Safari or use the voice simulator below.");
        return;
      }

      try {
        recognitionRef.current.start();
      } catch (e: any) {
        console.error(e);
        setError("Could not start microphone. Try again or use the simulator.");
      }
    }
  };

  const handleSimulateVoice = (sampleText: string) => {
    setTranscript(sampleText);
    setError(null);
  };

  const handleApply = async () => {
    const fullText = (transcript + " " + interimTranscript).trim();
    if (!fullText) return;

    if (style === "direct") {
      onTranscriptComplete(fullText);
      setIsOpen(false);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/process-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fullText, style })
      });
      
      const data = await response.json();
      if (data.processedText) {
        onTranscriptComplete(data.processedText);
        setIsOpen(false);
      } else {
        throw new Error(data.error || "Failed to process audio.");
      }
    } catch (err: any) {
      console.error(err);
      setError("AI processing failed. Applying raw text instead.");
      setTimeout(() => {
        onTranscriptComplete(fullText);
        setIsOpen(false);
      }, 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} id="voice-input-container">
      {/* Microphone Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 transition-all flex items-center justify-center"
        title="Voice to Text Input"
        id="btn-voice-trigger"
      >
        <Mic className="w-4 h-4" />
      </button>

      {/* Polish Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-800 text-sm">Real-time AI Voice Input</h3>
                  <p className="text-[10px] text-slate-500">Speak and let Meta AI optimize your post or message</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isListening) recognitionRef.current?.stop();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {/* Mic Controls */}
              <div className="flex flex-col items-center justify-center py-6 bg-slate-50/50 rounded-2xl border border-slate-100 relative overflow-hidden">
                {isListening && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="w-24 h-24 rounded-full bg-indigo-400/10 animate-ping absolute" />
                    <span className="w-32 h-32 rounded-full bg-indigo-400/5 animate-pulse absolute" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={toggleListening}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all shadow-lg ${
                    isListening 
                      ? "bg-red-500 hover:bg-red-600 shadow-red-500/20 scale-105" 
                      : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
                  }`}
                  id="btn-voice-mic-active"
                >
                  {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                <span className="text-xs font-semibold mt-3 text-slate-700">
                  {isListening ? "Listening... Speak now" : "Click to Start Speaking"}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Real-time voice-to-text via your microphone</p>
              </div>

              {/* Status / Error */}
              {error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs flex gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              {/* Real-time Transcription Screen */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Live Transcript</label>
                <div className="min-h-24 bg-slate-950 text-slate-200 rounded-xl p-4 text-xs font-mono border border-slate-800 leading-relaxed max-h-40 overflow-y-auto">
                  {transcript || interimTranscript ? (
                    <>
                      <span>{transcript}</span>
                      {interimTranscript && <span className="text-slate-400 animate-pulse"> {interimTranscript}</span>}
                    </>
                  ) : (
                    <span className="text-slate-500 italic">No spoken words detected yet. Tap the mic above, or try one of the instant simulation templates below.</span>
                  )}
                </div>
              </div>

              {/* AI Style Selectors */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                  Integrated AI Styling Goal
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStyle("direct")}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      style === "direct" 
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-500" 
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span className="block font-semibold text-xs text-slate-800">Verbatim</span>
                    <span className="text-[10px] text-slate-500">Raw voice-to-text directly</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStyle("casual")}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      style === "casual" 
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-500" 
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span className="block font-semibold text-xs text-slate-800 flex items-center gap-1">
                      Casual Chat <Sparkles className="w-3 h-3 text-indigo-500" />
                    </span>
                    <span className="text-[10px] text-slate-500">Warm, polished conversational</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStyle("professional")}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      style === "professional" 
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-500" 
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span className="block font-semibold text-xs text-slate-800">Professional</span>
                    <span className="text-[10px] text-slate-500">Perfect grammar, elegant style</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStyle("social")}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      style === "social" 
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-500" 
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span className="block font-semibold text-xs text-slate-800 flex items-center gap-1">
                      Social Post ✨
                    </span>
                    <span className="text-[10px] text-slate-500">Formatted with emojis/tags</span>
                  </button>
                </div>
              </div>

              {/* Sandbox Mock Template Simulator */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block font-mono">
                  Microphone Simulator / Sample Speech
                </span>
                <p className="text-[10px] text-slate-500">
                  If you are in an iframe or have no microphone, click any template below to simulate a real-time speech transcript immediately:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSimulateVoice("hey guys i am super excited to try connections it is so fast and works offline too lets catch up")}
                    className="bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/10 text-slate-700 text-[10px] px-2 py-1 rounded-lg transition-all"
                  >
                    "Exited for Connections"
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateVoice("we should totally arrange our dinner today at seven o clock make sure to bring some chocolate ice cream")}
                    className="bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/10 text-slate-700 text-[10px] px-2 py-1 rounded-lg transition-all"
                  >
                    "Dinner arrangements"
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateVoice("this social feed is absolutely amazing congrats nathanael on the release let me know when we can test syncing")}
                    className="bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/10 text-slate-700 text-[10px] px-2 py-1 rounded-lg transition-all"
                  >
                    "Release Congratulations"
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (isListening) recognitionRef.current?.stop();
                  setIsOpen(false);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!(transcript || interimTranscript) || isProcessing}
                onClick={handleApply}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
                id="btn-voice-apply"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Polishing with AI...
                  </>
                ) : style === "direct" ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Insert Raw Text
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Optimize & Insert
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
