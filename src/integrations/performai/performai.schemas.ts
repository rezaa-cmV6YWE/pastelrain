import { z } from 'zod'

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().optional(),
    message: z.string(),
  }),
})

export const LoginResponseSchema = z.object({
  data: z.object({
    cookie: z.string().min(1),
  }),
})

// Maimai schemas
export const MaimaiProfileSchema = z.object({
  name: z.string().nullable().optional(),
  rating: z.object({
    value: z.number().int().nonnegative(),
    color: z.url().nullable().optional(),
  }),
  icon: z.url().nullable().optional(),
  title: z.object({
    value: z.string().nullable().optional(),
    typeUrl: z.url().nullable().optional(),
    type: z
      .enum(['rainbow', 'gold', 'silver', 'bronze', 'normal'])
      .nullable()
      .optional(),
  }),
  stars: z.number().int().nonnegative().nullable().optional(),
  playCount: z.object({
    versionPlayCount: z.number().int().nonnegative().nullable().optional(),
    totalPlayCount: z.number().int().nonnegative().nullable().optional(),
  }),
  courseRank: z.url().nullable().optional(),
  classRank: z.url().nullable().optional(),
})

export const CircleSchema = z
  .object({
    name: z.string().nullable().optional(),
    class: z.url().nullable().optional(),
  })
  .nullable()
  .optional()

export const MaimaiProfileExtendedSchema = MaimaiProfileSchema.extend({
  nameplate: z.url().nullable().optional(),
  frame: z.url().nullable().optional(),
  circle: CircleSchema,
})

export const MaimaiRatingSongSchema = z.object({
  name: z.string(),
  type: z.enum(['std', 'dx']),
  difficulty: z.enum(['basic', 'advanced', 'expert', 'master', 'remaster']),
  level: z.string(),
  internalLevel: z.number(),
  achievement: z.number(),
  dxScore: z.number(),
  rating: z.number().int(),
  jacket: z.url().nullable().optional(),
  combo: z.object({
    type: z.string().nullable(),
    image: z.url().nullable().optional(),
  }),
  sync: z.object({
    type: z.string().nullable(),
    image: z.url().nullable().optional(),
  }),
})

export const MaimaiRatingSchema = z.object({
  rating: z.number().int(),
  newRatingSongs: z.array(MaimaiRatingSongSchema),
  oldRatingSongs: z.array(MaimaiRatingSongSchema),
})

export const MaimaiProfileResponseSchema = z.object({
  data: MaimaiProfileExtendedSchema,
})

export const MaimaiRatingResponseSchema = z.object({
  data: MaimaiRatingSchema,
})

// Chunithm schemas
export const ChunithmTitleSchema = z.object({
  value: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  typeUrl: z.url().nullable().optional(),
})

export const ChunithmCharacterSchema = z.object({
  image: z.url().nullable().optional(),
  frame: z.url().nullable().optional(),
})

export const ChunithmProfileRatingSchema = z.object({
  value: z.number().nonnegative(),
  color: z.string().nullable().optional(),
  images: z.array(z.url()).nullable().optional(),
})

export const ChunithmPlayCountSchema = z.object({
  versionPlayCount: z.number().int().nonnegative().nullable().optional(),
  totalPlayCount: z.number().int().nonnegative().nullable().optional(),
})

export const ChunithmProfileSchema = z.object({
  name: z.string().nullable().optional(),
  friendCode: z.string().nullable().optional(),
  level: z.number().int().nonnegative().nullable().optional(),
  reborn: z.number().int().nonnegative().nullable().optional(),
  rating: ChunithmProfileRatingSchema,
  highestRating: z.number().nonnegative().nullable().optional(),
  overpower: z
    .object({
      value: z.number().nonnegative(),
      percentage: z.number().nonnegative(),
    })
    .nullable()
    .optional(),
  titles: z.array(ChunithmTitleSchema).nullable().optional(),
  character: ChunithmCharacterSchema.nullable().optional(),
  team: z
    .object({
      name: z.string().nullable().optional(),
      emblem: z.string().nullable().optional(),
      emblemUrl: z.url().nullable().optional(),
    })
    .nullable()
    .optional(),
  playCount: ChunithmPlayCountSchema.nullable().optional(),
  currency: z
    .object({
      owned: z.number().int().nonnegative().nullable().optional(),
      total: z.number().int().nonnegative().nullable().optional(),
    })
    .nullable()
    .optional(),
})

export const ChunithmProfileExtendedSchema = ChunithmProfileSchema.extend({
  nameplate: z.url().nullable().optional(),
})

export const ChunithmDifficultySchema = z.enum([
  'basic',
  'advanced',
  'expert',
  'master',
  'ultima',
])

export const ChunithmRatingSongSchema = z.object({
  id: z.string(),
  title: z.string(),
  difficulty: ChunithmDifficultySchema,
  level: z.string().nullable().optional(),
  internalLevel: z.number().nullable().optional(),
  score: z.number().int().nonnegative(),
  rating: z.number().nonnegative(),
  jacket: z.url().nullable().optional(),
  combo: z.object({
    type: z.string().nullable(),
    image: z.url().nullable().optional(),
  }),
  chain: z.object({
    type: z.string().nullable(),
    image: z.url().nullable().optional(),
  }),
})

export const ChunithmRatingSchema = z.object({
  rating: z.number().nonnegative(),
  newRatingSongs: z.array(ChunithmRatingSongSchema),
  oldRatingSongs: z.array(ChunithmRatingSongSchema),
})

export const ChunithmProfileResponseSchema = z.object({
  data: ChunithmProfileExtendedSchema,
})

export const ChunithmRatingResponseSchema = z.object({
  data: ChunithmRatingSchema,
})
