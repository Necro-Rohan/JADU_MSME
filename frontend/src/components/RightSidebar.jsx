
import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
    X, Send, Sparkles, Bot, User, Users, ToggleLeft, ToggleRight, Mic, StopCircle,
    Terminal, ChevronDown, ChevronUp
} from 'lucide-react';

// Sub-component for AI Logs
const LogViewer = ({ logs }) => {
    // Auto-open if there is an error in logs
    const hasError = logs?.some(l => l.message.includes('ERROR') || l.message.includes('Failed'));
    const [isOpen, setIsOpen] = useState(hasError);
    if (!logs || logs.length === 0) return null;

    return (
        <div className="mt-2 pt-2 border-t border-slate-100">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[#033543] transition-colors"
            >
                <Terminal size={12} />
                {isOpen ? 'Hide AI Thought Process' : 'Show AI Thought Process'}
                {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {isOpen && (
                <div className="mt-2 p-3 bg-[#0f172a] text-emerald-400 rounded-xl font-mono text-[10px] leading-relaxed overflow-x-auto shadow-inner">
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1 last:mb-0 border-b border-slate-800 last:border-0 pb-1 last:pb-0">
                            <span className="text-slate-500 mr-2 select-none">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span className="whitespace-pre-wrap">{log.message}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Sub-component for Staff Settings
const StaffSettingsModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:3000/staff', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaffList(res.data);
        } catch (err) {
            console.error("Failed to fetch staff", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleAvailability = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:3000/staff/${id}/availability`,
                { isAvailable: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStaffList(prev => prev.map(s => s.id === id ? { ...s, isAvailable: !currentStatus } : s));
        } catch (err) {
            alert('Failed to update status');
        }
    };

    return (
        <>
            <button
                onClick={() => { fetchStaff(); setIsOpen(true); }}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                title="Staff Settings"
            >
                <Users size={20} />
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800">Staff Availability</h3>
                            <button onClick={() => setIsOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {loading ? <p className="text-sm text-slate-500">Loading...</p> : (
                                staffList.map(staff => (
                                    <div key={staff.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold text-sm text-slate-700">{staff.name}</p>
                                            <p className="text-xs text-slate-400">{staff.role}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleAvailability(staff.id, staff.isAvailable)}
                                            className={`${staff.isAvailable ? 'text-emerald-600' : 'text-slate-400'}`}
                                        >
                                            {staff.isAvailable ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const RightSidebar = ({ isOpen, onClose }) => {
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { type: 'bot', text: 'Hello! I am your AI assistant. How can I help you optimize your business today?' }
    ]);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const [transcribing, setTranscribing] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [chatHistory, transcribing]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!message.trim()) return;

        // Add user message
        const newHistory = [...chatHistory, { type: 'user', text: message }];
        setChatHistory(newHistory);
        const userQuery = message;
        setMessage('');

        // Call Backend Agent
        try {
            // Include loading state bubble
            setChatHistory(prev => [...prev, { type: 'bot', text: 'Thinking...', isLoading: true }]);

            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:3000/agent/chat',
                { query: userQuery, history: newHistory },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Remove loading bubble and add real response
            setChatHistory(prev => {
                const filtered = prev.filter(msg => !msg.isLoading);
                return [...filtered, {
                    type: 'bot',
                    text: res.data.response,
                    logs: res.data.logs
                }];
            });

        } catch (err) {
            console.error("Agent Error", err);
            const errorLogs = err.response?.data?.logs || [];
            const errorText = err.response?.data?.error || "Sorry, I encountered an error connecting to the brain.";

            setChatHistory(prev => {
                const filtered = prev.filter(msg => !msg.isLoading);
                return [...filtered, {
                    type: 'bot',
                    text: errorText,
                    logs: errorLogs
                }];
            });
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });

                setTranscribing(true);
                const formData = new FormData();
                formData.append("file", audioBlob, "speech.webm");
                formData.append("model", "whisper-1");

                try {
                    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
                    if (!apiKey) {
                        alert("OpenAI API Key not found. Please check your implementation.");
                        return;
                    }

                    const response = await axios.post(
                        "https://api.openai.com/v1/audio/transcriptions",
                        formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                                "Authorization": `Bearer ${apiKey}`,
                            },
                        }
                    );

                    const text = response.data.text;
                    if (text) {
                        setMessage(prev => (prev ? prev + " " + text : text));
                    }
                } catch (error) {
                    console.error("Transcription Error:", error);
                    alert("Failed to transcribe audio.");
                } finally {
                    setTranscribing(false);
                    // Stop tracks
                    stream.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic Error:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`fixed inset-y-0 right-0 z-50 w-[450px] max-w-[90vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out border-l border-slate-100 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-[#033543] to-[#054b5e] rounded-xl shadow-lg shadow-[#033543]/20">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-slate-800">AI Assistant</h2>
                            <p className="text-xs text-slate-500 font-medium">Always here to help</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <StaffSettingsModal />
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                    {chatHistory.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex gap-4 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.type === 'user'
                                ? 'bg-[#033543] text-white'
                                : 'bg-white text-emerald-600 border border-slate-100'
                                }`}>
                                {msg.type === 'user' ? <User size={18} /> : <Bot size={18} />}
                            </div>

                            {/* Message Bubble */}
                            <div className={`flex flex-col gap-1 max-w-[80%] ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`p-4 text-sm leading-relaxed shadow-sm ${msg.type === 'user'
                                    ? 'bg-[#033543] text-white rounded-2xl rounded-tr-none'
                                    : 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                    {/* Logs Viewer */}
                                    {msg.type === 'bot' && <LogViewer logs={msg.logs} />}
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium px-1">
                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}
                    {transcribing && (
                        <div className="flex gap-4 flex-row">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-emerald-600 border border-slate-100">
                                <Bot size={18} />
                            </div>
                            <div className="p-4 bg-white text-slate-500 text-sm border border-slate-100 rounded-2xl rounded-tl-none italic flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                Transcribing audio...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-5 bg-white border-t border-slate-100">
                    <form onSubmit={handleSend} className="relative flex items-center gap-2">
                        {/* Mic Button */}
                        <button
                            type="button"
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`p-3.5 rounded-xl transition-all shadow-lg active:scale-95 ${isRecording
                                ? 'bg-red-500 text-white shadow-red-500/20 animate-pulse'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                                }`}
                            title={isRecording ? "Stop Recording" : "Start Voice Input"}
                        >
                            {isRecording ? <StopCircle size={18} /> : <Mic size={18} />}
                        </button>

                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Ask me anything..."
                                className="w-full pl-5 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543]/20 transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!message.trim()}
                            className="p-3.5 bg-[#033543] text-white rounded-xl hover:bg-[#033543]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#033543]/20 hover:shadow-xl hover:shadow-[#033543]/30 active:scale-95 transform"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                    <div className="text-center mt-3">
                        <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                            POWERED BY AGENTIC AI
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default RightSidebar;
