/**
 * The old home (App), as the lazily loaded root of every route that shows it: /classic, the deep links /work/<id> and
 * /experience/<id>, "/" for browsers that do not get the 3D home, and any unknown address (as on the live site).
 * MotionConfig lives here rather than in the entry, so the 3D home does not download framer-motion.
 *
 * (Ship layer: kept in scripts/ship/files/lib/ship/ and copied into place by scripts/ship/port-home.mjs.)
 */
import React from 'react';
import { MotionConfig } from 'framer-motion';
import App from '../../App';
import { INITIAL_EXPERIENCE_ID, INITIAL_WORK_PROJECT_ID } from '../workRoutes';
import { BOOT } from './boot';
import { isExperiencePath, isWorkPath } from './frontDoor';
import { armReturnHome, landHome } from './returnHome';

const deepLink = isWorkPath(BOOT.pathname) || isExperiencePath(BOOT.pathname);
// an address that names no project or stop opens nothing: it lands on the home the visitor would get at "/"
const leaving = deepLink && !INITIAL_WORK_PROJECT_ID && !INITIAL_EXPERIENCE_ID ? landHome() : false;
if (deepLink && (INITIAL_WORK_PROJECT_ID || INITIAL_EXPERIENCE_ID)) armReturnHome();

const OldHome: React.FC = () => (leaving ? null : (
  <MotionConfig reducedMotion="user">
    <App />
  </MotionConfig>
));

export default OldHome;
