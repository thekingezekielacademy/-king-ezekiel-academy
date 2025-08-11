import React, { useEffect, useRef, useState } from "react";

interface AdvancedVideoPlayerProps {
  src: string; // YouTube video ID or direct video URL
  type?: "youtube" | "video";
  title?: string;
  autoplay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

const AdvancedVideoPlayer: React.FC<AdvancedVideoPlayerProps> = ({
  src,
  type = "youtube",
  title,
  autoplay = false,
  onPlay,
  onPause,
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    if (type === "youtube" && videoRef.current) {
      // Create a sophisticated YouTube bypass system
      const video = videoRef.current;
      
      // Set up video source using YouTube's direct stream URL
      const videoId = src.includes('youtube.com') || src.includes('youtu.be') 
        ? src.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1] || src
        : src;
      

      
      // Create a hidden iframe for the actual YouTube stream
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&cc_load_policy=0&fs=0&disablekb=1&playsinline=1&enablejsapi=1&origin=${window.location.origin}`;
      iframe.style.position = 'absolute';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.zIndex = '0'; // Lower z-index so it stays behind everything
      iframe.style.opacity = '1'; // Fully visible now
      iframe.style.pointerEvents = 'none';
      iframe.style.borderRadius = '8px'; // Match the container's rounded corners
      iframe.style.overflow = 'hidden'; // Ensure it doesn't overflow
      iframe.style.maxWidth = '100%'; // Ensure it doesn't exceed container width
      iframe.style.maxHeight = '100%'; // Ensure it doesn't exceed container height
      iframe.style.objectFit = 'contain'; // Maintain aspect ratio
      iframe.frameBorder = '0';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      
      // Store reference to iframe
      iframeRef.current = iframe;
      
      // Create a wrapper div to contain the iframe
      const iframeWrapper = document.createElement('div');
      iframeWrapper.style.position = 'absolute';
      iframeWrapper.style.top = '0';
      iframeWrapper.style.left = '0';
      iframeWrapper.style.width = '100%';
      iframeWrapper.style.height = '100%';
      iframeWrapper.style.overflow = 'hidden';
      iframeWrapper.style.borderRadius = '8px';
      iframeWrapper.style.zIndex = '0';
      
      // Add iframe to wrapper
      iframeWrapper.appendChild(iframe);
      
      // Add the wrapper to the container
      if (containerRef.current) {
        containerRef.current.appendChild(iframeWrapper);
      }
      
             // Set up our custom video element without a source (we don't need it)
       video.muted = true;
       video.volume = 0;
      
             // Event listeners for our custom player
       video.addEventListener('play', () => {
         setIsPlaying(true);
         onPlay?.();
         // Trigger the hidden YouTube iframe to play
         iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
       });
       
       video.addEventListener('pause', () => {
         setIsPlaying(false);
         onPause?.();
         // Trigger the hidden YouTube iframe to pause
         iframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
       });
       
       video.addEventListener('ended', () => {
         setIsPlaying(false);
         onEnded?.();
       });
       
       // Listen for YouTube player state changes
       const handleMessage = (event: MessageEvent) => {
         try {
           const data = JSON.parse(event.data);
           if (data.event === 'onStateChange') {
             // YouTube player state: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
             if (data.info === 1) {
               setIsPlaying(true);
               onPlay?.();
             } else if (data.info === 2 || data.info === 0) {
               setIsPlaying(false);
               onPause?.();
               if (data.info === 0) {
                 onEnded?.();
               }
             }
           } else if (data.event === 'onReady') {
             // Player is ready, get video duration
             iframe.contentWindow?.postMessage(
               '{"event":"command","func":"getDuration","args":""}',
               '*'
             );
           } else if (data.event === 'onReady' && data.info) {
             // Video duration received
             setDuration(data.info);
           } else if (data.event === 'onReady' && typeof data.info === 'number') {
             // Current time received
             setCurrentTime(data.info);
           }
         } catch (e) {
           // Ignore parsing errors
         }
       };
       
       // Add message listener for YouTube player communication
       window.addEventListener('message', handleMessage);
       
       // Set up timer to sync with YouTube player time
       intervalRef.current = setInterval(() => {
         if (isPlaying && iframe.contentWindow) {
           // Get current time from YouTube player
           iframe.contentWindow.postMessage(
             '{"event":"command","func":"getCurrentTime","args":""}',
             '*'
           );
         }
       }, 1000);
       
       // Set a default duration (will be updated when video loads)
       setDuration(600); // 10 minutes default
      
             // Cleanup
       return () => {
         if (intervalRef.current) {
           clearInterval(intervalRef.current);
         }
         if (hoverTimeoutRef.current) {
           clearTimeout(hoverTimeoutRef.current);
         }
         window.removeEventListener('message', handleMessage);
         if (containerRef.current && iframe.parentNode?.parentNode) {
           iframe.parentNode.parentNode.removeChild(iframe.parentNode);
         }
       };
    }
    }, [src, type, autoplay, onPlay, onPause, onEnded]);
  
  // Reset timer when video changes
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [src]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);
  
  const togglePlay = () => {
    if (isPlaying) {
      // Pause the YouTube video
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}',
          '*'
        );
      }
      setIsPlaying(false);
      onPause?.();
    } else {
      // Play the YouTube video
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          '{"event":"command","func":"playVideo","args":""}',
          '*'
        );
      }
      setIsPlaying(true);
      onPlay?.();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    setCurrentTime(newTime);
    
    // Seek the YouTube player to the new time
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        `{"event":"command","func":"seekTo","args":[${newTime}, true]}`,
        '*'
      );
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (type === "youtube") {
    return (
      <div 
        className="w-full bg-black rounded-lg overflow-hidden relative" 
        ref={containerRef}
        style={{ 
          position: 'relative',
          overflow: 'hidden',
          isolation: 'isolate', // Creates a new stacking context
          contain: 'layout style paint' // CSS containment for better isolation
        }}
        onMouseEnter={() => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          hoverTimeoutRef.current = setTimeout(() => {
            setIsHovered(false);
          }, 300); // 300ms delay before hiding
        }}
      >
        <div className="relative w-full" style={{ paddingTop: '56.25%', position: 'relative', overflow: 'hidden' }}>
          {/* Custom title overlay */}
          {title && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm font-medium z-25">
              {title}
            </div>
          )}
          
          {/* Hidden video element for controls */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
            playsInline
          />
          
          {/* Clickable overlay for play/pause */}
          <div 
            className="absolute inset-0 z-15 cursor-pointer"
            onClick={togglePlay}
          />
          
          {/* Custom video placeholder */}
          <div 
            className={`absolute inset-0 w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center transition-all duration-300 cursor-pointer z-20 ${
              isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            onClick={togglePlay}
            style={{ 
              backgroundColor: isPlaying ? 'transparent' : undefined,
              background: isPlaying ? 'none' : undefined
            }}
          >
            <div className="text-center text-white">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-blue-700 transition-colors">
                {isPlaying ? (
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V9a1 1 0 00-1-1H7z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-12 h-12 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-lg font-medium">{title || 'Video Player'}</p>
              <p className="text-sm text-gray-300">Click to play</p>
            </div>
          </div>
          
          {/* Custom controls overlay */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent p-4 z-30 transition-opacity ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            {/* Progress bar */}
            <div className="mb-3">
              <input
                type="range"
                min="0"
                max="100"
                value={duration ? (currentTime / duration) * 100 : 0}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            
            {/* Control buttons */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={togglePlay} 
                  className={`hover:text-blue-400 transition-colors transition-opacity ${
                    isPlaying && !isHovered ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V9a1 1 0 00-1-1H7z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.923L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4.017-2.923a1 1 0 011.617.923z" clipRule="evenodd" />
                  </svg>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                
                <span className="text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              
              <button onClick={toggleFullscreen} className="hover:text-blue-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For direct video files
  return (
    <div className="w-full bg-black rounded-lg overflow-hidden">
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full"
          playsInline
          controls
        >
          <source src={src} type="video/mp4" />
        </video>
        
        {title && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm font-medium z-10">
            {title}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedVideoPlayer;
