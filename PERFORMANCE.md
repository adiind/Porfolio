# Performance Optimization Guide

## Current Performance Issues

### 1. **Re-render Optimization**
- **Problem**: Components re-render unnecessarily
- **Solution**: Add `React.memo`, `useCallback`, `useMemo`

### 2. **Large Component Rendering**
- **Problem**: All timeline items render even when not visible
- **Solution**: Implement virtualization with `react-window`

### 3. **Animation Performance**
- **Problem**: Complex animations can cause jank
- **Solution**: Use CSS transforms, `will-change`, reduce complexity

### 4. **Scroll Performance**
- **Problem**: Scroll events fire too frequently
- **Solution**: Debounce/throttle scroll handlers

## Implementation Steps

### Step 1: Memoize Components

```typescript
// components/TimelineEvent.tsx
export default React.memo(TimelineEvent, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.hoveredId === nextProps.hoveredId &&
    prevProps.pixelsPerMonth === nextProps.pixelsPerMonth &&
    prevProps.mode === nextProps.mode &&
    prevProps.isDimmed === nextProps.isDimmed
  );
});
```

### Step 2: Memoize Callbacks

```typescript
// In App.tsx or custom hooks
const handleHover = useCallback((id: string | null) => {
  setHoveredId(id);
}, []);

const handleLaneHover = useCallback((lane: number | null) => {
  setHoveredLane(lane);
}, []);
```

### Step 3: Virtualize Timeline Items

Install `react-window`:
```bash
npm install react-window @types/react-window
```

Create virtualized timeline:
```typescript
import { FixedSizeList } from 'react-window';

// Only render visible items
<FixedSizeList
  height={viewportHeight}
  itemCount={filteredData.length}
  itemSize={estimatedItemHeight}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <TimelineEvent item={filteredData[index]} {...props} />
    </div>
  )}
</FixedSizeList>
```

### Step 4: Optimize Animations

```css
/* Use transform instead of top/left */
.timeline-item {
  will-change: transform;
  transform: translateY(var(--top));
}

/* Reduce animation complexity when zoomed out */
.timeline-item.zoomed-out {
  transition: none;
}
```

### Step 5: Debounce Scroll Events

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedScroll = useDebouncedCallback(
  (scrollTop: number) => {
    setScrollTop(scrollTop);
  },
  16 // ~60fps
);
```

### Step 6: Lazy Load Modals

```typescript
const CaseStudyModal = React.lazy(() => import('./components/CaseStudyModal'));

// In render
<Suspense fallback={<div>Loading...</div>}>
  {activeCaseStudy && <CaseStudyModal {...props} />}
</Suspense>
```

### Step 7: Image Optimization

```typescript
// Lazy load images
<img
  src={imageUrl}
  loading="lazy"
  decoding="async"
  alt={title}
/>
```

## Performance Metrics

### Target Metrics
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### Measurement Tools
1. **Chrome DevTools Performance Tab**
2. **Lighthouse**
3. **React DevTools Profiler**
4. **Web Vitals Extension**

## Code Splitting

### Route-based Splitting (if adding routes)
```typescript
const Timeline = React.lazy(() => import('./pages/Timeline'));
const About = React.lazy(() => import('./pages/About'));
```

### Component-based Splitting
```typescript
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
```

## Bundle Size Optimization

### Analyze Bundle
```bash
npm install --save-dev webpack-bundle-analyzer
npm run build
npx webpack-bundle-analyzer dist/stats.json
```

### Optimize Dependencies
- Remove unused dependencies
- Use tree-shaking
- Consider lighter alternatives

## Memory Optimization

### Cleanup Effects
```typescript
useEffect(() => {
  const handler = () => { /* ... */ };
  window.addEventListener('scroll', handler);
  return () => window.removeEventListener('scroll', handler);
}, []);
```

### Avoid Memory Leaks
- Clear timeouts/intervals
- Remove event listeners
- Cancel pending requests

## Animation Best Practices

### Use CSS Transforms
```typescript
// ❌ Bad - triggers layout
style={{ top: `${top}px`, left: `${left}px` }}

// ✅ Good - uses GPU
style={{ transform: `translate(${left}px, ${top}px)` }}
```

### Reduce Repaints
- Use `opacity` and `transform` for animations
- Avoid changing `width`, `height`, `top`, `left`
- Use `will-change` sparingly

### Debounce Expensive Operations
```typescript
const debouncedCalculate = useDebouncedCallback(
  (items) => calculatePositions(items),
  100
);
```

## Monitoring

### Add Performance Monitoring
```typescript
// utils/performance.ts
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name}: ${end - start}ms`);
};
```

### Track Re-renders
```typescript
// Development only
if (process.env.NODE_ENV === 'development') {
  useEffect(() => {
    console.log('Component re-rendered');
  });
}
```

## Checklist

- [ ] Add React.memo to components
- [ ] Use useCallback for event handlers
- [ ] Use useMemo for expensive calculations
- [ ] Implement virtualization
- [ ] Optimize animations
- [ ] Debounce scroll events
- [ ] Lazy load modals
- [ ] Optimize images
- [ ] Code split routes/components
- [ ] Monitor bundle size
- [ ] Test performance metrics
- [ ] Add error boundaries
- [ ] Clean up effects properly



