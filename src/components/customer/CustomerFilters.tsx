
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface CustomerFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export function CustomerFilters({ searchTerm, setSearchTerm }: CustomerFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Поиск по имени или телефону..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
  );
}
