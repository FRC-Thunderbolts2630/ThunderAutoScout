export const YEAR = 2026;

// FRC 2026 field: robots race to the middle/center zone during auto
export const ZONE_LABEL = 'Middle';
export const ZONE_DESCRIPTION = 'the middle zone of the field';
export const AUTO_DURATION_SECONDS = 15;

// Pipeline: Phase 1 (audio buzzer detection)
export const AUDIO_SEARCH_SECONDS = 30; // search first 30s of audio for the match-start horn
export const VIDEO_DOWNLOAD_SECONDS = 35; // download first 35s (7s pre-match + 15s auto + 13s buffer)

// Pipeline: Phase 2 (vision robot detection)
export const FRAME_SAMPLE_SECONDS = 15; // 15s vision window = exactly the auto period
export const FRAME_FPS = 1;             // 1fps = 15 frames total (safe for Claude Vision API)
export const CONFIDENCE_MIN = 0.6;      // detections below this left blank for manual input

// Zebra MotionWorks: FRC field is ~54ft long; center zone = middle third
// Adjust per season once field dimensions are published
export const ZEBRA_CENTER_X_MIN = 18; // feet from red wall
export const ZEBRA_CENTER_X_MAX = 36; // feet from red wall

export const TBA_BASE_URL = 'https://www.thebluealliance.com/api/v3';
export const YOUTUBE_WATCH_URL = 'https://www.youtube.com/watch?v=';
