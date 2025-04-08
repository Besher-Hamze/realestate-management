import { useState, useEffect, useCallback } from 'react';
import { ApiResponse } from '@/lib/types';
import { getErrorMessage } from '@/lib/utils';

interface UseFetchOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  fetchOnMount?: boolean;
}

type FetcherFn<T> = () => Promise<ApiResponse<T>>;

export default function useFetch<T>(
  fetcher: FetcherFn<T>,
  options: UseFetchOptions<T> = {}
) {
  const {
    initialData,
    onSuccess,
    onError,
    fetchOnMount = true,
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(fetchOnMount);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const execute = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetcher();
      
      if (response.success) {
        setData(response.data);
        setIsSuccess(true);
        onSuccess?.(response.data);
      } else {
        const errorMessage = response.message;
        setError(errorMessage);
        onError?.(errorMessage);
      }
      
      return response;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      onError?.(errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        data: {} as T,
      };
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, onSuccess, onError]);

  // Fetch data on component mount if fetchOnMount is true
  useEffect(() => {
    if (fetchOnMount) {
      execute();
    }
  }, [execute, fetchOnMount]);

  return {
    data,
    isLoading,
    error,
    isSuccess,
    execute,
    setData,
  };
}