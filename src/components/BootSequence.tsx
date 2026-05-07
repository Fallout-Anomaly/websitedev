'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '@/src/styles/index.module.css';

const BOOT_MESSAGES = [
  'VAULT-TEC UNIFIED OPERATING SYSTEM',
  'COPYRIGHT 2077 VAULT-TEC INDUSTRIES',
  'ROBCO INDUSTRIES UNIFIED OPERATING SYSTEM (VER 1.3.8)',
  'PIP-OS v7.1.0.8 INITIALIZING...',
  'LOADING CORE MODULES...',
  'VAULT NETWORK CONNECTION: ESTABLISHED',
  'RADIATION LEVELS: NOMINAL',
  'WARNING: CHECK HOLOTAPE DRIVE',
  'SYSTEM READY. PLEASE STAND BY...',
];

interface BootSequenceProps {
  onBootComplete?: () => void;
}

export default function BootSequence({ onBootComplete }: BootSequenceProps) {
  const [bootDone, setBootDone] = useState(false);
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const skipRef = useRef(false);

  useEffect(() => {
    if (bootDone || skipRef.current) return;
    let cancelled = false;

    const typeBootSequence = async () => {
      for (let li = 0; li < BOOT_MESSAGES.length; li++) {
        if (cancelled || skipRef.current) break;
        const msg = BOOT_MESSAGES[li];

        setVisibleLines((prev) => {
          const next = [...prev];
          next[li] = msg;
          return next;
        });

        await new Promise((r) => setTimeout(r, 75 + Math.random() * 50));
      }
      if (!cancelled && !skipRef.current) setShowContinuePrompt(true);
    };

    typeBootSequence();
    return () => {
      cancelled = true;
    };
  }, [bootDone]);

  const handleBootInteraction = useCallback(() => {
    if (showContinuePrompt) {
      setBootDone(true);
      if (onBootComplete) onBootComplete();
    } else {
      skipRef.current = true;
      setVisibleLines(BOOT_MESSAGES);
      setShowContinuePrompt(true);
    }
  }, [showContinuePrompt, onBootComplete]);

  useEffect(() => {
    if (!showContinuePrompt || bootDone) return;
    const onKey = () => {
      handleBootInteraction();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showContinuePrompt, bootDone, handleBootInteraction]);

  if (bootDone) return null;

  return (
    <div
      className={styles.loadingScreen}
      role="presentation"
      onClick={handleBootInteraction}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleBootInteraction();
        }
      }}
    >
      <div className={styles.pipOsBoot}>
        {BOOT_MESSAGES.map((_, i) => (
          <div
            key={i}
            className={`${styles.pipOsLine} ${
              visibleLines[i]?.length === BOOT_MESSAGES[i]?.length ? styles.visible : ''
            }`}
          >
            {visibleLines[i] ?? ''}
          </div>
        ))}
      </div>
      {showContinuePrompt && <div className={styles.continuePrompt}>Press any key or click to continue...</div>}
    </div>
  );
}
