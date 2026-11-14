import React, { useState, useRef, useEffect } from 'react';
/**
 * HireVue-style Video Interview Component
 * Records video responses to pre-set questions
 */
export default function VideoInterview() {
  const [recording, setRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes per question
  const [completed, setCompleted] = useState(false);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const questions = [
    {
      id: 1,
      text: 'Why do you want to join this workforce development program?',
      tips: 'Share your motivation and career goals',
    },
    {
      id: 2,
      text: 'What relevant experience or skills do you bring?',
      tips: 'Discuss your background, education, or work experience',
    },
    {
      id: 3,
      text: 'How will this training help you achieve your career goals?',
      tips: 'Be specific about your goals and how the program fits',
    },
    {
      id: 4,
      text: 'What challenges have you overcome, and what did you learn?',
      tips: 'Show resilience and problem-solving skills',
    },
  ];
  // Timer countdown
  useEffect(() => {
    if (recording && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (recording && timeLeft === 0) {
      stopRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, timeLeft]);
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      videoRef.current.srcObject = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        uploadVideo(blob);
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.start();
      setRecording(true);
      setTimeLeft(120);
    } catch (error) {
      // Error: $1
      alert('Unable to access camera. Please check permissions.');
    }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };
  const uploadVideo = async (blob) => {
    const formData = new FormData();
    formData.append('video', blob, `interview-q${currentQuestion + 1}.webm`);
    formData.append('questionId', questions[currentQuestion].id);
    formData.append('questionText', questions[currentQuestion].text);
    formData.append('timestamp', new Date().toISOString());
    try {
      const response = await fetch('/api/enrollment/video-upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        //
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setVideoBlob(null);
      setTimeLeft(120);
    } else {
      setCompleted(true);
    }
  };
  const retakeAnswer = () => {
    setVideoBlob(null);
    setTimeLeft(120);
  };
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  if (completed) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <div className="bg-brand-green-50 border-2 border-brand-green-500 rounded-lg p-8">
          <div className="text-6xl mb-4 text-4xl md:text-5xl lg:text-6xl">✅</div>
          <h2 className="text-3xl font-bold text-brand-success mb-4">Interview Complete!</h2>
          <p className="text-lg text-brand-text mb-6">
            Thank you for completing your video interview. Our team will review your responses and
            contact you within 2-3 business days.
          </p>
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-bold mb-2">What's Next?</h3>
            <ul className="text-left space-y-2">
              <li>✅ Your responses have been saved</li>
              <li>📧 Check your email for confirmation</li>
              <li>👥 Our team will review your interview</li>
              <li>📞 We'll contact you with next steps</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-sm text-brand-text-muted">
            {Math.round(((currentQuestion + 1) / questions.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-brand-border rounded-full h-2">
          <div
            className="bg-brand-info h-2 rounded-full transition-all"
            style={{
              width: `${((currentQuestion + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>
      {/* Question Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">{questions[currentQuestion].text}</h2>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
          <p className="text-sm text-brand-info">
            💡 <strong>Tip:</strong> {questions[currentQuestion].tips}
          </p>
        </div>
        <p className="text-brand-text-muted">
          You have <strong>2 minutes</strong> to answer. Take a moment to think before you start
          recording.
        </p>
      </div>
      {/* Video Container */}
      <div className="bg-gray-900 rounded-lg overflow-hidden mb-6 relative">
        <video
          ref={videoRef}
          autoPlay
          muted={recording}
          playsInline
          className="w-full aspect-video"
          style={{ transform: 'scaleX(-1)' }} // Mirror effect
        />
        {/* Timer Overlay */}
        {recording && (
          <div className="absolute top-4 right-4 bg-brand-danger text-white px-4 py-2 rounded-full font-bold">
            🔴 {formatTime(timeLeft)}
          </div>
        )}
        {/* Recording Indicator */}
        {recording && (
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <div className="w-3 h-3 bg-brand-danger rounded-full animate-pulse" />
            <span className="text-white font-medium">Recording...</span>
          </div>
        )}
      </div>
      {/* Controls */}
      <div className="flex justify-center space-x-4">
        {!recording && !videoBlob && (
          <button
            onClick={startRecording}
            className="bg-brand-info hover:bg-brand-info-hover text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors flex items-center space-x-2"
          >
            <span>🎥</span>
            <span>Start Recording</span>
          </button>
        )}
        {recording && (
          <button
            onClick={stopRecording}
            className="bg-brand-danger hover:bg-brand-danger-hover text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors flex items-center space-x-2"
          >
            <span>⏹️</span>
            <span>Stop Recording</span>
          </button>
        )}
        {videoBlob && (
          <div className="flex space-x-4">
            <button
              onClick={retakeAnswer}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-4 rounded-lg font-bold transition-colors"
            >
              🔄 Retake
            </button>
            <button
              onClick={nextQuestion}
              className="bg-brand-success hover:bg-brand-success-hover text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors flex items-center space-x-2"
            >
              <span>✅</span>
              <span>
                {currentQuestion < questions.length - 1 ? 'Next Question' : 'Complete Interview'}
              </span>
            </button>
          </div>
        )}
      </div>
      {/* Instructions */}
      {!recording && !videoBlob && (
        <div className="mt-6 bg-brand-surface rounded-lg p-4">
          <h3 className="font-bold mb-2">Before You Start:</h3>
          <ul className="space-y-1 text-sm text-brand-text">
            <li>✅ Find a quiet, well-lit location</li>
            <li>✅ Look directly at the camera</li>
            <li>✅ Speak clearly and confidently</li>
            <li>✅ You can retake your answer if needed</li>
          </ul>
        </div>
      )}
    </div>
  );
}
