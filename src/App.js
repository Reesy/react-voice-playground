import React, { useState } from 'react';
import { ReactMic } from 'react-mic';
import axios from 'axios';
import './App.css';

function App() {
  const [record, setRecord] = useState(false);
  const [recordings, setRecordings] = useState([]);

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
    setRecordings([...recordings, { ...recordedBlob, transcription: '' }]);
  };

  const transcribeAudio = async (audioBlob, index) => {
    const audioFile = new File([audioBlob], 'audio.wav', {
      type: 'audio/wav',
    });

    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer <YOUR API KEY>`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setRecordings((prevRecordings) => {
        return prevRecordings.map((recording, idx) => {
          if (idx === index) {
            return { ...recording, transcription: response.data.text };
          }
          return recording;
        });
      });
    } catch (error) {
      console.error('Error transcribing audio:', error.response ? error.response.data : error);
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
              <button
                onClick={() => transcribeAudio(recording.blob, index)}
                className="transcribe-button"
              >
                Transcribe
              </button>
              <div className="transcription">
                <h3>Transcription:</h3>
                <p>{recording.transcription}</p>
              </div>
            </div>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;
