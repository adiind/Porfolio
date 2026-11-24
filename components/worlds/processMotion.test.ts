import { describe,it,expect } from 'vitest';
import { processFrame,processShots } from './processMotion';

describe('source-photo scroll choreography',()=>{
  for(const [project,shots] of Object.entries(processShots)){
    it(`${project}: every scroll position has an image and reverses exactly`,()=>{
      const down:ReturnType<typeof processFrame>[][]=[];
      for(let n=0;n<=400;n++){
        const frames=shots.map((shot,i)=>processFrame(n/400,i,shot));
        expect(frames.reduce((sum,f)=>sum+f.opacity,0)).toBeCloseTo(1,7);
        frames.forEach((f)=>{
          expect(Object.values(f).every(Number.isFinite)).toBe(true);
          expect(f.scale).toBeGreaterThanOrEqual(1);
        });
        down.push(frames);
      }
      // scrolling back up shows exactly what scrolling down showed
      for(let n=400;n>=0;n--) expect(shots.map((shot,i)=>processFrame(n/400,i,shot))).toEqual(down[n]);
    });
    it(`${project}: phone zooms stay within the desktop camera travel`,()=>{
      shots.forEach((shot,i)=>{
        for(const p of [0,.125,.25,.375,.5,.625,.75,.875,1]){
          expect(processFrame(p,i,shot,true).scale).toBeLessThanOrEqual(processFrame(p,i,shot).scale);
        }
      });
    });
    it(`${project}: uses original photos and bounded endpoints`,()=>{
      expect(shots).toHaveLength(4);
      shots.forEach((shot,i)=>{
        expect(shot.src).not.toMatch(/cutout|process\//);
        expect(shot.caption).toMatch(/original/i);
        expect(processFrame(-1,i,shot)).toEqual(processFrame(0,i,shot));
        expect(processFrame(2,i,shot)).toEqual(processFrame(1,i,shot));
      });
    });
  }
});
