import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { FaMicrophone, FaStop, FaRobot, FaUser, FaVolumeUp } from 'react-icons/fa';
import Cookies from 'js-cookie';
import url from "../url";

const VoiceAssistant = ({ show, handleClose }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [status, setStatus] = useState('Idle'); 
    const [language, setLanguage] = useState('en-US'); 
    const [voices, setVoices] = useState([]);

    const username = Cookies.get("username") || "Farmer";
    const recognitionRef = useRef(null);

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        return () => window.speechSynthesis.cancel();
    }, []);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) return;

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language;

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

        recognitionRef.current = recognition;
        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [language]);

    const startListening = () => {
        if (recognitionRef.current) {
            window.speechSynthesis.cancel(); 
            setResponse(''); 
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

    const speakResponse = (text) => {
        if (!text) return;
        window.speechSynthesis.cancel(); 
        setStatus('Speaking...');

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;

        const exactVoice = voices.find(v => v.lang === language);
        const langVoice = voices.find(v => v.lang.startsWith(language.split('-')[0]));
        if (exactVoice) utterance.voice = exactVoice;
        else if (langVoice) utterance.voice = langVoice;

        utterance.onend = () => setStatus('Idle');
        utterance.onerror = (e) => setStatus('Idle');
        window.speechSynthesis.speak(utterance);
    };

    return (
        <Modal show={show} onHide={() => { stopListening(); handleClose(); }} centered contentClassName="dash-card" style={{ border: 'none' }}>
            <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, var(--leaf), var(--forest))', color: 'white', borderBottom: 'none', borderRadius: '12px 12px 0 0' }}>
                <Modal.Title style={{ fontFamily: 'var(--ff-head)', fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaMicrophone /> AgriVoice for {username}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center p-4" style={{ backgroundColor: '#fff' }}>
                <div className="mb-4">
                    <select
                        className="form-input w-auto mx-auto"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        style={{ padding: '8px 16px', borderRadius: '8px' }}
                    >
                        <option value="en-US">English (US)</option>
                        <option value="en-IN">English (India)</option>
                        <option value="hi-IN">Hindi (हिन्दी)</option>
                        <option value="mr-IN">Marathi (मराठी)</option>
                        <option value="gu-IN">Gujarati (ગુજરાતી)</option>
                        <option value="ta-IN">Tamil (தமிழ்)</option>
                        <option value="te-IN">Telugu (తెలుగు)</option>
                    </select>
                    <small className="d-block mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Select Language for better accuracy</small>
                </div>

                <div className="my-4">
                    <div
                        className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${isListening ? 'listening-pulse' : ''}`}
                        style={{
                            width: '85px',
                            height: '85px',
                            backgroundColor: isListening ? '#ef4444' : 'var(--leaf)',
                            color: 'white',
                            fontSize: '2.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: isListening ? 'none' : '0 8px 24px rgba(74,222,128, 0.4)'
                        }}
                        onClick={isListening ? stopListening : startListening}
                    >
                        {isListening ? <FaStop size={30} /> : <FaMicrophone size={34} />}
                    </div>
                    <p className="mt-4" style={{ color: 'var(--forest)', fontFamily: 'var(--ff-head)', fontWeight: 600, letterSpacing: '0.5px' }}>{status}</p>
                </div>

                {transcript && (
                    <div className="d-flex align-items-start mb-3 text-start p-3 rounded-3" style={{ backgroundColor: 'var(--mint-light)', border: '1px solid rgba(74,222,128,0.2)' }}>
                        <FaUser className="mt-1 me-2" style={{ color: 'var(--forest)' }} />
                        <div>
                            <small className="d-block mb-1" style={{ fontWeight: 600, color: 'var(--forest)' }}>{username}</small>
                            <span style={{ color: 'var(--text-dark)', fontSize: '0.9rem' }}>{transcript}</span>
                        </div>
                    </div>
                )}

                {response && (
                    <div className="d-flex align-items-start text-start p-3 rounded-3 position-relative" style={{ backgroundColor: 'var(--forest)', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <FaRobot className="mt-1 me-3" style={{ fontSize: '1.2rem' }} />
                        <div style={{ paddingRight: '24px' }}>
                            <small className="d-block mb-1" style={{ fontWeight: 600, color: 'var(--leaf-pale)' }}>AgriVoice AI</small>
                            <span style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{response}</span>
                        </div>
                        <button
                            className="btn btn-sm position-absolute top-0 end-0 mt-2 me-2"
                            style={{ color: '#fff', opacity: 0.8 }}
                            onClick={() => speakResponse(response)}
                            title="Replay Audio"
                        >
                            <FaVolumeUp />
                        </button>
                    </div>
                )}

            </Modal.Body>
            <Modal.Footer style={{ borderTop: 'none', backgroundColor: 'var(--mint-light)', borderRadius: '0 0 12px 12px' }}>
                <button className="btn-secondary" style={{ padding: '8px 20px', borderRadius: '8px' }} onClick={() => { stopListening(); handleClose(); }}>
                    Close
                </button>
            </Modal.Footer>

            <style>{`
                .listening-pulse {
                    animation: pulse-red 1.5s infinite;
                }
                @keyframes pulse-red {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
                    70% { box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>
        </Modal>
    );
};

export default VoiceAssistant;
