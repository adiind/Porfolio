import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe,it,expect,vi } from 'vitest';
import ProcessScroll from './ProcessScroll';
vi.mock('framer-motion',()=>({useReducedMotion:()=>true}));

describe('reduced-motion process story',()=>{
  for(const id of ['surya','jarvis','plotter'] as const){
    it(`${id}: makes every step and original photo available without a pinned track`,()=>{
      const html=renderToStaticMarkup(React.createElement(ProcessScroll,{id,scroller:{current:null},enlarge:()=>{}}));
      expect(html.match(/<article/g)).toHaveLength(4);
      expect(html.match(/<figure/g)).toHaveLength(4);
      expect(html).toContain('process-static');
      expect(html).not.toContain('process-scroll-track');
      expect(html).not.toContain('aria-hidden="true"');
      expect(html).not.toContain('AI detail study');
    });
  }
});
