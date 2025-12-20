import { useState, useMemo, useCallback } from 'react';
import { TimelineItem } from '../types';
import { TIMELINE_DATA } from '../constants';

export type FilterType = 'all' | 'corporate' | 'education' | 'personal';

export const useFilter = (initialFilter: FilterType = 'all') => {
  const [filter, setFilter] = useState<FilterType>(initialFilter);

  const filteredData = useMemo(() => {
    if (filter === 'all') return TIMELINE_DATA;
    return TIMELINE_DATA.filter(
      item => item.type === filter || 
      (item.type === 'foundational' && filter === 'corporate')
    );
  }, [filter]);

  const updateFilter = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
  }, []);

  return {
    filter,
    filteredData,
    updateFilter,
  };
};



