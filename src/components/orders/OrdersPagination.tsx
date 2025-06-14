
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrdersPaginationProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}

export const OrdersPagination = ({
  currentPage,
  totalPages,
  setCurrentPage,
}: OrdersPaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-2 mt-6">
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span>
        Страница {currentPage} из {totalPages}
      </span>
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(currentPage + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
