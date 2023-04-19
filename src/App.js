import React, { useState, useEffect } from 'react';
import { ReactMic } from 'react-mic';
import axios from 'axios';
import './App.css';

function App() {
  const apiKey = process.env.REACT_APP_OPEN_API_KEY;
  const [record, setRecord] = useState(false);
  const [recordings, setRecordings] = useState([]);


  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        if (!record) {
          startRecording();
        } else {
          stopRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [record]);
  const startRecording = () => {
    setRecord(true);
  };

  const stopRecording = () => {
    setRecord(false);
  };

  const onData = (recordedBlob) => {
    console.log('chunk of real-time data is: ', recordedBlob);
  };

  const onStop = (recordedBlob) => {
    const newIndex = recordings.length;
    setRecordings([...recordings, { ...recordedBlob, transcription: '', translation: '' }]);
    transcribeAndTranslateAudio(recordedBlob.blob, newIndex);
  };

  const transcribeAndTranslateAudio = async (audioBlob, index) => {
    const audioFile = new File([audioBlob], 'audio.wav', {
      type: 'audio/wav',
    });

    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');

    try {
      const transcriptionResponse = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const englishTranslation = transcriptionResponse.data.text;

      const translatedText = `Translate the following into Japanese: ${englishTranslation}`;
      const chatCompletionResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: translatedText }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      const japaneseTranslation = chatCompletionResponse.data.choices[0].message.content;

      setRecordings((prevRecordings) => {
        return prevRecordings.map((recording, idx) => {
          if (idx === index) {
            return {
              ...recording,
              transcription: englishTranslation,
              englishTranslation,
              japaneseTranslation,
            };
          }
          return recording;
        });
      });
    } catch (error) {
      console.error('Error processing audio:', error.response ? error.response.data : error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Audio Recorder</h1>
        <ReactMic
          record={record}
          className="sound-wave"
          onStop={onStop}
          onData={onData}
          strokeColor="#000000"
          backgroundColor="#FF4081"
        />
        <button
          onClick={record ? stopRecording : startRecording}
          className="mic-button"
        >
          {record ? 'Stop Recording' : 'Start Recording'}
        </button>
        <div>
          {recordings.map((recording, index) => (
            <div key={index} className="recording">
              <p>Recording {index + 1}</p>
              <audio src={recording.blobURL} controls />
              <div className="transcription">
                <h3>Transcription:</h3>
                <p>{recording.transcription}</p>
              </div>
              <div className="english-translation">
                <h3>English Translation:</h3>
                <p>{recording.englishTranslation}</p>
              </div>
              <div className="japanese-translation">
                <h3>Japanese Translation:</h3>
                <p>{recording.japaneseTranslation}</p>
              </div>
            </div>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;
