import { Image } from '@unpic/react'
import { cn } from 'cn'

import { useChunithmProfileQuery } from '@/integrations/performai'

export default function ChunithmProfile() {
  const { data, isLoading, error } = useChunithmProfileQuery()

  // Convenient access for when implementing UI
  const profile = data && !data.maintenance ? data.data : null

  return (
    <section className="space-y-2">
      <h2 className="font-pixel flex items-center gap-2 text-2xl">Chunithm</h2>

      {isLoading && (
        <p className="text-sm text-gray-400">Loading Chunithm stats...</p>
      )}

      {error && (
        <p className="text-sm text-red-400">
          Error loading Chunithm: {error.message}
        </p>
      )}

      {data?.maintenance && (
        <p className="text-sm text-yellow-500">
          ⚠️ Maintenance active: {data.reason}
        </p>
      )}

      {profile && (
        <div className="relative">
          <Image
            src={profile.nameplate ?? ''}
            width={396}
            height={63}
            className="w-full"
          />
          <div className="absolute top-0 right-3 w-[72%] sm:right-6">
            <div className="relative">
              {profile.team && profile.team.emblemUrl ? (
                <Image
                  src={profile.team.emblemUrl ?? ''}
                  width={396}
                  height={63}
                  className="w-full"
                />
              ) : null}
              <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 translate-y-3/4 text-center text-xs font-bold sm:text-base">
                {profile.team?.name}
              </div>
            </div>
            <div className="relative -mt-2">
              {profile.titles ? (
                <Image
                  src={profile.titles[0].typeUrl ?? ''}
                  width={396}
                  height={63}
                  className="w-full"
                />
              ) : null}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-center text-xs font-bold text-black sm:text-base">
                {profile.titles?.[0]?.value}
              </div>
            </div>
            <div className="flex">
              <div className="flex-1 border border-black/50 bg-white/50 font-bold text-black">
                <div className="border-b border-black/50 px-1">
                  <span className="sm:text-2xl">Lv.</span>
                  <span className="sm:text-4xl">{profile.level}</span>
                  <span className="ml-4 text-xl sm:text-4xl">
                    {profile.name}
                  </span>
                </div>
                <div className="mt-1 flex px-1 sm:mt-2">
                  <span className="text-xs sm:text-lg">Rating</span>
                  <div className="ml-2 flex items-end gap-1">
                    {profile.rating.images?.map((img: string, i: number) => (
                      <Image
                        key={i}
                        src={img}
                        layout="fullWidth"
                        className={cn('h-4 sm:h-6', {
                          'h-1 sm:h-2': i === 2,
                        })}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mr-1 w-[20%] bg-white">
                <Image
                  src={profile.character?.image ?? ''}
                  width={78}
                  height={78}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
