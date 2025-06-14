
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Generic pagination utility for fetching all records
export const getAllRecordsPaginated = async <T>(
  tableName: string,
  selectQuery: string = '*',
  orderBy?: { column: string; ascending?: boolean }
): Promise<T[]> => {
  try {
    console.log(`Starting to fetch ALL ${tableName} with pagination...`);
    
    let allRecords: any[] = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      let query = supabase
        .from(tableName)
        .select(selectQuery)
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error(`${tableName} query error details:`, error);
        throw error;
      }
      
      if (!data || data.length === 0) break;
      
      allRecords = [...allRecords, ...data];
      
      if (data.length < pageSize) break;
      
      page++;
    }
    
    console.log(`Found ${allRecords.length} ${tableName} through pagination`);
    return allRecords;
  } catch (error) {
    console.error(`Error fetching ${tableName}:`, error);
    throw error;
  }
};

// Utility for batch processing records
export const processBatches = async <T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> => {
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  const results = [];
  for (const batch of batches) {
    const batchResults = await processor(batch);
    if (batchResults) results.push(...batchResults);
  }
  
  return results;
};
