'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

export interface VideoRecorderHandle {
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<Blob | null>;
}

const VideoRecorder = forwardRef<VideoRecorderHandle>((_, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {});

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useImperativeHandle(ref, () => ({
    async start() {
      if (!streamRef.current) return;
      chunksRef.current = [];
      const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(1000);
      recorderRef.current = recorder;
      setActive(true);
      setPaused(false);
    },
    pause() {
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.pause();
        setPaused(true);
      }
    },
    resume() {
      if (recorderRef.current?.state === 'paused') {
        recorderRef.current.resume();
        setPaused(false);
      }
    },
    async stop() {
      return new Promise<Blob | null>((resolve) => {
        if (!recorderRef.current || recorderRef.current.state === 'inactive') return resolve(null);
        recorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          resolve(blob);
        };
        recorderRef.current.stop();
        setActive(false);
      });
    },
  }));

  return (
    <div className="relative w-28 h-20 sm:w-36 sm:h-28 rounded-lg overflow-hidden border border-line bg-ink">
      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
      {active && !paused && (
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-black/50 rounded-full px-1.5 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[9px] text-white font-medium">REC</span>
        </div>
      )}
      {paused && (
        <div className="absolute inset-0 bg-ink/70 flex items-center justify-center">
          <span className="text-[10px] text-white/80 font-medium tracking-wide">PAUSED</span>
        </div>
      )}
    </div>
  );
});

VideoRecorder.displayName = 'VideoRecorder';

export default VideoRecorder;
