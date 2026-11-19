import React from 'react';
import { TIMELINE_DATA } from '../../data/timeline';
import './jarvisRecognition.css';

const circuitDigestWriteUp = (() => {
  const entry = TIMELINE_DATA.find((item) => item.id === 'jarvis-competition');
  const link = entry?.projectLinks?.find((item) => item.label === 'Circuit Digest');
  if (!link?.url) {
    throw new Error('Jarvis Circuit Digest proof link is missing from timeline data.');
  }
  return link.url;
})();

export type JarvisRecognitionVariant = 'card' | 'stage';

const VARIANT_CLASS: Record<JarvisRecognitionVariant, string> = {
  card: 'jarvis-plate--card',
  stage: 'jarvis-plate--stage',
};

interface Props {
  variant: JarvisRecognitionVariant;
}

/** Printed contest plate for Jarvis. Facts and the proof URL come from the timeline entry. */
const JarvisRecognition: React.FC<Props> = ({ variant }) => (
  <a
    className={`jarvis-plate ${VARIANT_CLASS[variant]}`}
    href={circuitDigestWriteUp}
    target="_blank"
    rel="noopener noreferrer"
    data-jarvis-recognition={variant}
    aria-label="Top 10, Southeast Asia-wide Edge AI & IoT Challenge (Circuit Digest / DigiKey, 2024). Circuit Digest write-up."
  >
    <span className="jarvis-plate-crops" aria-hidden="true" />
    <span className="jarvis-plate-rank">Top 10</span>
    <span className="jarvis-plate-detail">
      Southeast Asia-wide Edge AI & IoT Challenge{' '}
      <span className="jarvis-plate-credit">
        (Circuit Digest / DigiKey, 2024)
        <span className="jarvis-plate-out" aria-hidden="true">↗</span>
      </span>
    </span>
  </a>
);

export default JarvisRecognition;
