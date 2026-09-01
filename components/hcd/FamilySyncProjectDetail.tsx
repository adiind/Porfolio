import React from 'react';
import { Project } from '../../types/Project';
import storyData from '../../data/hcd/familysync-story.json';
import { HcdCaseStudyShell } from './HcdCaseStudy';
import { HcdProjectStory } from './types';

const FamilySyncProjectDetail: React.FC<{ project: Project; onClose: () => void }> = ({ onClose }) => (
  <HcdCaseStudyShell story={storyData as HcdProjectStory} onClose={onClose} />
);

export default FamilySyncProjectDetail;
