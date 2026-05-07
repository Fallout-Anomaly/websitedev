'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './MediaGallery.module.css';
import galleryData from '@/src/data/gallery.json';

interface GalleryImage {
  src?: string;
  [key: string]: any;
}

interface GalleryVideo {
  src: string;
  title: string;
}

interface GalleryDataType {
  images?: (string | GalleryImage)[];
  videos?: GalleryVideo[];
}

export default function MediaGallery() {
  const typedGalleryData = galleryData as GalleryDataType;
  const galleryImages = (typedGalleryData.images || []).map((img) =>
    typeof img === 'string' ? img : img.src || ''
  );
  const videos = typedGalleryData.videos || [];

  const [mediaTab, setMediaTab] = useState<'images' | 'videos'>('images');
  const [imageIndex, setImageIndex] = useState(0);

  const nextImage = useCallback(() => {
    if (galleryImages.length === 0) return;
    setImageIndex((i) => (i + 1) % galleryImages.length);
  }, [galleryImages.length]);

  const prevImage = useCallback(() => {
    if (galleryImages.length === 0) return;
    setImageIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);

  useEffect(() => {
    if (mediaTab !== 'images' || galleryImages.length === 0) return;
    const t = setInterval(nextImage, 5000);
    return () => clearInterval(t);
  }, [mediaTab, nextImage, galleryImages.length]);

  return (
    <div className={styles.heroMedia}>
      <div className={styles.mediaTabs}>
        <button
          className={mediaTab === 'images' ? styles.mediaTabActive : styles.mediaTab}
          onClick={() => setMediaTab('images')}
          type="button"
        >
          📷 Gallery
        </button>
        <button
          className={mediaTab === 'videos' ? styles.mediaTabActive : styles.mediaTab}
          onClick={() => setMediaTab('videos')}
          type="button"
        >
          ▶ Videos
        </button>
      </div>
      <div className={styles.mediaContent}>
        {mediaTab === 'images' && galleryImages.length > 0 && (
          <div className={styles.imageCarousel}>
            <div className={styles.carouselImageWrap}>
              <img
                src={galleryImages[imageIndex]}
                alt="Fallen World"
                className={styles.carouselImage}
              />
            </div>
            <div className={styles.carouselControls}>
              <button type="button" className={styles.carouselBtn} onClick={prevImage} aria-label="Previous">
                ‹
              </button>
              <span className={styles.carouselDots}>
                {galleryImages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={i === imageIndex ? styles.dotActive : styles.dot}
                    onClick={() => setImageIndex(i)}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </span>
              <button type="button" className={styles.carouselBtn} onClick={nextImage} aria-label="Next">
                ›
              </button>
            </div>
          </div>
        )}
        {mediaTab === 'videos' && videos.length > 0 && (
          <div className={styles.videoCarousel}>
            {videos.map((v, i) => (
              <div key={i} className={styles.videoSlide}>
                <iframe
                  src={v.src}
                  title={v.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
