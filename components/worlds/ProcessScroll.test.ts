import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe,it,expect,vi } from 'vitest';
import ProcessScroll from './ProcessScroll';
import { processShots } from './processMotion';
import { worldStories } from './worldStories';
vi.mock('framer-motion',()=>({useReducedMotion:()=>true}));

// (React escapes the expected text exactly as it escapes the page's)
const markup=(tag:string,props:Record<string,string>|null,text?:string)=>renderToStaticMarkup(React.createElement(tag,props,text));

describe('reduced-motion process story',()=>{
  for(const id of ['surya','jarvis','plotter'] as const){
    it(`${id}: makes every step and original photo available without a pinned track`,()=>{
      const html=renderToStaticMarkup(React.createElement(ProcessScroll,{id,scroller:{current:null},enlarge:()=>{}}));
      for(const [title,copy] of worldStories[id].steps){
        expect(html).toContain(markup('h3',null,title));
        expect(html).toContain(markup('p',null,copy));
      }
      for(const shot of processShots[id]){
        expect(html).toContain(markup('img',{src:shot.src,alt:shot.label}).match(/<img[^>]*>/)![0]);
        expect(html).toContain(markup('figcaption',null,shot.caption));
      }
      expect(html).not.toContain('aria-hidden');
      expect(html).not.toContain('inert');
      expect(html).not.toContain('AI detail study');
    });
  }
});
