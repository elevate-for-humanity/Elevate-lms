'use client';

import React, { useEffect, useRef, useState } from 'react';
/**
 * MeetingRoom Component - Jitsi Meet Integration
 * Provides video conferencing with screen sharing, recording, and chat
 */
export function MeetingRoom({
  meetingCode,
  userName,
  isModerator = false,
  onLeave,
}) {
  const jitsiContainerRef = useRef(null);
  const [api, setApi] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // Load Jitsi Meet API
    const loadJitsiScript = () => {
      if (window.JitsiMeetExternalAPI) {
        initializeJitsi();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => initializeJitsi();
      document.body.appendChild(script);
    };
    const initializeJitsi = () => {
      const domain = process.env.REACT_APP_JITSI_DOMAIN || 'meet.jit.si';
      const options = {
        roomName: meetingCode,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: userName,
          email: '', // Optional
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableClosePage: false,
          toolbarButtons: [
            'microphone',
            'camera',
            'closedcaptions',
            'desktop',
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'profile',
            'chat',
            'recording',
            'livestreaming',
            'etherpad',
            'sharedvideo',
            'settings',
            'raisehand',
            'videoquality',
            'filmstrip',
            'feedback',
            'stats',
            'shortcuts',
            'tileview',
            'videobackgroundblur',
            'download',
            'help',
            'mute-everyone',
            'security',
          ],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          SHOW_POWERED_BY: false,
          DISPLAY_WELCOME_PAGE_CONTENT: false,
          DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
          APP_NAME: 'Elevate Meet',
          NATIVE_APP_NAME: 'Elevate Meet',
          PROVIDER_NAME: 'Elevate for Humanity',
          MOBILE_APP_PROMO: false,
        },
      };
      const jitsiApi = new window.JitsiMeetExternalAPI(domain, options);
      // Event listeners
      jitsiApi.addEventListener('videoConferenceJoined', (event) => {
        //
        setIsLoading(false);
      });
      jitsiApi.addEventListener('participantJoined', (event) => {
        //
        updateParticipants(jitsiApi);
      });
      jitsiApi.addEventListener('participantLeft', (event) => {
        //
        updateParticipants(jitsiApi);
      });
      jitsiApi.addEventListener('videoConferenceLeft', () => {
        //
        if (onLeave) onLeave();
      });
      jitsiApi.addEventListener('recordingStatusChanged', (event) => {
        setIsRecording(event.on);
      });
      setApi(jitsiApi);
    };
    const updateParticipants = async (jitsiApi) => {
      const participantsList = await jitsiApi.getParticipantsInfo();
      setParticipants(participantsList);
    };
    loadJitsiScript();
    // Cleanup
    return () => {
      if (api) {
        api.dispose();
      }
    };
  }, [meetingCode, userName, onLeave]);
  const handleStartRecording = () => {
    if (api && isModerator) {
      api.executeCommand('startRecording', {
        mode: 'file', // or 'stream' for live streaming
      });
    }
  };
  const handleStopRecording = () => {
    if (api && isModerator) {
      api.executeCommand('stopRecording', 'file');
    }
  };
  const handleToggleAudio = () => {
    if (api) {
      api.executeCommand('toggleAudio');
    }
  };
  const handleToggleVideo = () => {
    if (api) {
      api.executeCommand('toggleVideo');
    }
  };
  const handleShareScreen = () => {
    if (api) {
      api.executeCommand('toggleShareScreen');
    }
  };
  const handleLeaveMeeting = () => {
    if (api) {
      api.executeCommand('hangup');
    }
  };
  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#000',
      }}
    >
      {/* Loading indicator */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            fontSize: '1.5rem',
            zIndex: 1000,
          }}
        >
          Joining meeting...
        </div>
      )}
      {/* Meeting info bar */}
      <div
        style={{
          padding: '1rem',
          backgroundColor: '#1a1a1a',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>Elevate Meet</h3>
          <p
            style={{
              margin: '0.25rem 0 0 0',
              fontSize: '0.875rem',
              opacity: 0.7,
            }}
          >
            Meeting Code: {meetingCode}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isRecording && (
            <span
              style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: '#ef4444',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#fff',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite',
                }}
              />
              Recording
            </span>
          )}
          <span style={{ fontSize: '0.875rem' }}>
            {participants.length} participant
            {participants.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      {/* Jitsi Meet container */}
      <div
        ref={jitsiContainerRef}
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
        }}
      />
      {/* Custom controls (optional - Jitsi has built-in controls) */}
      {isModerator && (
        <div
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '0.5rem',
            zIndex: 100,
          }}
        >
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Start Recording
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6b7280',
                color: '#fff',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Stop Recording
            </button>
          )}
        </div>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
export default MeetingRoom;
