'use client';

import React, { useEffect } from 'react';
import styles from '@/src/styles/index.module.css';

const HERO_BG_VIDEO_ID = '-Jq2-mlULK8';
const HERO_BG_START = 1;
const HERO_BG_END = 12;

let heroYouTubeApiPromise: Promise<any>;

const loadYouTubeApi = () => {
  if (heroYouTubeApiPromise) return heroYouTubeApiPromise;
  heroYouTubeApiPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }
    if ((window as any).YT && (window as any).YT.Player) {
      resolve((window as any).YT);
      return;
    }
    if (!document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
    const poll = setInterval(() => {
      if ((window as any).YT && (window as any).YT.Player) {
        clearInterval(poll);
        resolve((window as any).YT);
      }
    }, 50);
  });
  return heroYouTubeApiPromise;
};

export default function BackgroundVideo() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let player: any;
    let cancelled = false;

    loadYouTubeApi().then((YT) => {
      if (!YT || cancelled) return;

      const onPlayerStateChange = (event: any) => {
        if (event.data === YT.PlayerState.ENDED) {
          event.target.seekTo(HERO_BG_START, true);
          event.target.playVideo();
        }
      };

      player = new YT.Player('heroVideoPlayer', {
        videoId: HERO_BG_VIDEO_ID,
        playerVars: {
          autoplay: 1,
          controls: 0,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          disablekb: 1,
          start: HERO_BG_START,
          end: HERO_BG_END,
          loop: 1,
          playlist: HERO_BG_VIDEO_ID,
          mute: 1,
        },
        events: {
          onReady: (event: any) => {
            event.target.mute();
            event.target.playVideo();
          },
          onStateChange: onPlayerStateChange,
        },
      });
    });

    return () => {
      cancelled = true;
      if (player && player.destroy) player.destroy();
    };
  }, []);

  return (
    <div className={styles.heroVideoWrap} aria-hidden="true">
      <div id="heroVideoPlayer" className={styles.heroVideoIframe} />
      <div className={styles.heroVideoScrim} />
    </div>
  );
}
