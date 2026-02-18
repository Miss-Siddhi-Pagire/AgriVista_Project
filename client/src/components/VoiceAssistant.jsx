import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { FaMicrophone, FaStop, FaRobot, FaUser, FaVolumeUp } from 'react-icons/fa';
import { url } from "../url";

const VoiceAssistant = ({ show, handleClose }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [status, setStatus] = useState('Idle'); // Idle, Listening, Processing, Speaking
    const [language, setLanguage] = useState('en-US'); // Default, but can be switched
    const [voices, setVoices] = useState([]);

    const recognitionRef = useRef(null);

    // 1. Load available system voices
    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        // Cleanup
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    // 2. Setup Speech Recognition
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) {
            // Fallback or alert handled elsewhere slightly
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language; // Dynamic language support

        recognition.onstart = () => {
            setIsListening(true);
            setStatus('Listening...');
            setTranscript('');
        };

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            setTranscript(text);
            handleVoiceQuery(text);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setStatus('Error: ' + event.error);
            setIsListening(false);
        };

        // recognition.onend is implicitly handled by onresult stopping it, or explicit stopListening
        // recognition.onend = () => {
        //     setIsListening(false);
        // };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            // No synthRef.current.cancel() needed here as it's handled by the new voices useEffect
        };
    }, [language]);

    const startListening = () => {
        if (recognitionRef.current) {
            window.speechSynthesis.cancel(); // Stop talking if listening
            setResponse(''); // Clear previous response
            recognitionRef.current.start();
        } else {
            alert("Voice recognition not supported in this browser.");
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            setStatus('Idle');
        }
    };

    const handleVoiceQuery = async (query) => {
        setStatus('Processing...');
        try {
            const res = await axios.post(`${url}/api/voice/query`, { query });
            if (res.data.success) {
                const aiResponse = res.data.response;
                setResponse(aiResponse);
                speakResponse(aiResponse);
            }
        } catch (error) {
            console.error("Error processing voice query:", error);
            setStatus('Error processing query.');
        }
    };

    // 3. Enhanced TTS Logic
    const speakResponse = (text) => {
        if (!text) return;

        window.speechSynthesis.cancel(); // Stop any previous speech
        setStatus('Speaking...');

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;

        // Attempt to find a matching voice for better quality
        // 1. Exact match (e.g., 'hi-IN')
        // 2. Language match (e.g., 'hi')
        // 3. Default
        const exactVoice = voices.find(v => v.lang === language);
        const langVoice = voices.find(v => v.lang.startsWith(language.split('-')[0]));

        if (exactVoice) {
            utterance.voice = exactVoice;
        } else if (langVoice) {
            utterance.voice = langVoice;
        }

        console.log(`Speaking in ${language} using voice:`, utterance.voice ? utterance.voice.name : 'Default');

        utterance.onend = () => setStatus('Idle');
        utterance.onerror = (e) => {
            console.error("TTS Error", e);
            setStatus('Idle');
        };

        window.speechSynthesis.speak(utterance);
    };

    // handleLanguageChange is now inline in the JSX

    // Auto-start listening when modal opens? Maybe better to let user click start.
    // Let's simple auto-focus visuals.

    const colors = {
        primaryGreen: "#6A8E23",
        deepGreen: "#4A6317",
        lightGreen: "#e9f5db"
    };

    return (
        <Modal show={show} onHide={() => { stopListening(); handleClose(); }} centered>
            <Modal.Header closeButton style={{ backgroundColor: colors.deepGreen, color: 'white' }}>
                <Modal.Title><i className="bi bi-mic-fill me-2"></i>AgriVoice Assistant</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center p-4">

                <div className="mb-3">
                    <select
                        className="form-select w-auto mx-auto"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        <option value="en-US">English (US)</option>
                        <option value="en-IN">English (India)</option>
                        <option value="hi-IN">Hindi (हिन्दी)</option>
                        <option value="mr-IN">Marathi (मराठी)</option>
                        <option value="gu-IN">Gujarati (ગુજરાતી)</option>
                        <option value="ta-IN">Tamil (தமிழ்)</option>
                        <option value="te-IN">Telugu (తెలుగు)</option>
                    </select>
                    <small className="text-muted">Select Language for better accuracy</small>
                </div>

                <div className="my-4">
                    <div
                        className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${isListening ? 'listening-pulse' : ''}`}
                        style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: isListening ? '#dc3545' : colors.primaryGreen,
                            color: 'white',
                            fontSize: '2rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                        }}
                        onClick={isListening ? stopListening : startListening}
                    >
                        {isListening ? <FaStop /> : <FaMicrophone />}
                    </div>
                    <p className="mt-3 fs-5 fw-bold" style={{ color: colors.deepGreen }}>{status}</p>
                </div>

                {transcript && (
                    <div className="d-flex align-items-start mb-3 text-start bg-light p-3 rounded">
                        <FaUser className="mt-1 me-2 text-secondary" />
                        <div>
                            <small className="d-block fw-bold text-muted">You</small>
                            {transcript}
                        </div>
                    </div>
                )}

                {response && (
                    <div className="d-flex align-items-start text-start p-3 rounded position-relative" style={{ backgroundColor: colors.lightGreen }}>
                        <FaRobot className="mt-1 me-2" style={{ color: colors.deepGreen }} />
                        <div>
                            <small className="d-block fw-bold" style={{ color: colors.deepGreen }}>AgriVoice</small>
                            {response}
                        </div>
                        <button
                            className="btn btn-sm btn-link position-absolute top-0 end-0 mt-1 me-1 text-dark"
                            onClick={() => speakResponse(response)}
                            title="Replay Audio"
                        >
                            <FaVolumeUp />
                        </button>
                    </div>
                )}

            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => { stopListening(); handleClose(); }}>
                    Close
                </Button>
            </Modal.Footer>

            <style>{`
                .listening-pulse {
                    animation: pulse-red 1.5s infinite;
                }
                @keyframes pulse-red {
                    0% {
                        box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
                    }
                    70% {
                        box-shadow: 0 0 0 15px rgba(220, 53, 69, 0);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
                    }
                }
            `}</style>
        </Modal>
    );
};

export default VoiceAssistant;
