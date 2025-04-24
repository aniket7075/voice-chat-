import React, { useRef, useState } from 'react';
import { DeepChat } from 'deep-chat-react';
import './App.css';

const App = () => {
  const deepChatRef = useRef(null);
  const [recording, setRecording] = useState(false);

  const startRecording = async () => {
    setRecording(true);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        const transcript = await sendToGoogleSpeechAPI(base64Audio);
        if (deepChatRef.current && transcript) {
          deepChatRef.current.addMessage({ text: transcript, role: 'user' });
        }
      };
    };

    mediaRecorder.start();
    setTimeout(() => {
      mediaRecorder.stop();
      setRecording(false);
    }, 5000);
  };

  const sendToGoogleSpeechAPI = async (base64Audio) => {
    const API_KEY = 'AIzaSyAabO3akn4x2pEvB3AsYpibYBM2qkupIw0';
    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'en-US'
          },
          audio: { content: base64Audio }
        })
      }
    );

    const result = await response.json();
    return result.results?.[0]?.alternatives?.[0]?.transcript;
  };

  return (
    <div className="app">
      <h1>Voice Chat</h1>
      <DeepChat ref={deepChatRef} />
      <div className="input-area">
        <input type="text" className="text-input" placeholder="Type a message..." disabled />
        <button onClick={startRecording} className={`mic-button ${recording ? 'recording' : ''}`}>
          🎤
        </button>
      </div>
    </div>
  );
};

export default App;