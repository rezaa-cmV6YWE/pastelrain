import { useQuery } from '@tanstack/react-query'

import {
  getChunithmData,
  getChunithmProfile,
  getMaimaiData,
  getMaimaiProfile,
} from './performai.functions'

import type {
  ChunithmData,
  ChunithmProfileExtended,
  MaimaiData,
  MaimaiProfileExtended,
  PerformaiResult,
} from './performai.types'

/**
 * Fetches only Maimai player profile (fast, light).
 */
export function useMaimaiProfileQuery() {
  return useQuery<PerformaiResult<MaimaiProfileExtended>>({
    queryKey: ['performai', 'maimai', 'profile'],
    queryFn: () => getMaimaiProfile(),
    staleTime: 1000 * 60 * 60, // 1 hour (matches ISG edge cache)
  })
}

/**
 * Fetches only Chunithm player profile (fast, light).
 */
export function useChunithmProfileQuery() {
  return useQuery<PerformaiResult<ChunithmProfileExtended>>({
    queryKey: ['performai', 'chunithm', 'profile'],
    queryFn: () => getChunithmProfile(),
    staleTime: 1000 * 60 * 60, // 1 hour (matches ISG edge cache)
  })
}

/**
 * Fetches both Maimai profile and top-50 song rating data.
 * (Preserved for future use)
 */
export function useMaimaiQuery() {
  return useQuery<PerformaiResult<MaimaiData>>({
    queryKey: ['performai', 'maimai'],
    queryFn: () => getMaimaiData(),
    staleTime: 1000 * 60 * 60,
  })
}

/**
 * Fetches both Chunithm profile and top-50 song rating data.
 * (Preserved for future use)
 */
export function useChunithmQuery() {
  return useQuery<PerformaiResult<ChunithmData>>({
    queryKey: ['performai', 'chunithm'],
    queryFn: () => getChunithmData(),
    staleTime: 1000 * 60 * 60,
  })
}
