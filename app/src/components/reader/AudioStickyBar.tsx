import React from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw, FastForward } from 'lucide-react';

interface AudioStickyBarProps {
  audioPath: string;
  title: string;
  autoPlay?: boolean;
}

export const AudioStickyBar: React.FC<AudioStickyBarProps> = ({ audioPath, title }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [playbackRate, setPlaybackRate] = React.useState(1.0);
  const [isMuted, setIsMuted] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Convert /assets/audio/bookX/testY.mp3 to /api/stream/bookX/testY
  // This removes the .mp3 file extension from the URL, preventing IDM from auto-intercepting the audio stream
  const streamUrl = React.useMemo(() => {
    const match = audioPath.match(/(?:assets\/audio\/|\/)?(book\d+)\/(test\d+)(?:\.mp3)?$/i);
    if (match) {
      return `/api/stream/${match[1].toLowerCase()}/${match[2].toLowerCase()}`;
    }
    return audioPath;
  }, [audioPath]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => console.log('Audio playback prevented or paused:', e));
      }
    } else {
      audioRef.current.pause();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const toggleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 0.8];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextRate = speeds[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
      <audio
        ref={audioRef}
        src={streamUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center gap-3 min-w-[220px]">
        <button
          onClick={togglePlay}
          className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 transition-transform active:scale-95 shrink-0 cursor-pointer"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5 fill-white" />}
        </button>

        <div className="truncate">
          <div className="text-xs font-semibold text-slate-900 truncate">{title}</div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>

      {/* Progress slider */}
      <div className="flex-1 flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
      </div>

      {/* Speed & Volume controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggleSpeed}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-mono text-slate-700 font-semibold flex items-center gap-1 border border-slate-200 cursor-pointer"
        >
          <FastForward className="w-3 h-3 text-slate-600" />
          {playbackRate}x
        </button>

        <button
          onClick={() => {
            if (!audioRef.current) return;
            audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
          }}
          title="Rewind 10s"
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            if (!audioRef.current) return;
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
          }}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
