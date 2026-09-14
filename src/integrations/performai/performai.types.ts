import type {
  ChunithmCharacterSchema,
  ChunithmDifficultySchema,
  ChunithmPlayCountSchema,
  ChunithmProfileExtendedSchema,
  ChunithmProfileRatingSchema,
  ChunithmProfileSchema,
  ChunithmRatingSchema,
  ChunithmRatingSongSchema,
  ChunithmTitleSchema,
  CircleSchema,
  MaimaiProfileExtendedSchema,
  MaimaiProfileSchema,
  MaimaiRatingSchema,
  MaimaiRatingSongSchema,
} from './performai.schemas'
import type { z } from 'zod'

export type MaimaiProfile = z.infer<typeof MaimaiProfileSchema>
export type Circle = z.infer<typeof CircleSchema>
export type MaimaiProfileExtended = z.infer<typeof MaimaiProfileExtendedSchema>
export type MaimaiRatingSong = z.infer<typeof MaimaiRatingSongSchema>
export type MaimaiRating = z.infer<typeof MaimaiRatingSchema>

export type MaimaiData = {
  profile: MaimaiProfileExtended
  rating: MaimaiRating
}

export type ChunithmTitle = z.infer<typeof ChunithmTitleSchema>
export type ChunithmCharacter = z.infer<typeof ChunithmCharacterSchema>
export type ChunithmProfileRating = z.infer<typeof ChunithmProfileRatingSchema>
export type ChunithmPlayCount = z.infer<typeof ChunithmPlayCountSchema>
export type ChunithmProfile = z.infer<typeof ChunithmProfileSchema>
export type ChunithmProfileExtended = z.infer<
  typeof ChunithmProfileExtendedSchema
>
export type ChunithmDifficulty = z.infer<typeof ChunithmDifficultySchema>
export type ChunithmRatingSong = z.infer<typeof ChunithmRatingSongSchema>
export type ChunithmRating = z.infer<typeof ChunithmRatingSchema>

export type ChunithmData = {
  profile: ChunithmProfileExtended
  rating: ChunithmRating
}

export type PerformaiResult<TData> =
  | {
      maintenance: true
      data: null
      reason: string
    }
  | {
      maintenance: false
      data: TData
      reason?: never
    }
