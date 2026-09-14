import { Image } from '@unpic/react'

import { useMaimaiProfileQuery } from '@/integrations/performai'

export default function MaimaiProfile() {
  const { data, isLoading, error } = useMaimaiProfileQuery()

  // Convenient access for when implementing UI
  const profile = data && !data.maintenance ? data.data : null

  return (
    <section className="space-y-2">
      <h2 className="font-pixel flex items-center gap-2 text-2xl">Maimai</h2>

      {isLoading && (
        <p className="text-sm text-gray-400">Loading Maimai stats...</p>
      )}

      {error && (
        <p className="text-sm text-red-400">
          Error loading Maimai: {error.message}
        </p>
      )}

      {data?.maintenance && (
        <p className="text-sm text-yellow-500">
          Maintenance active: {data.reason}
        </p>
      )}

      {profile && (
        <div className="relative">
          <Image
            src={profile.frame ?? ''}
            width={396}
            height={165}
            className="w-full"
          />
          <div className="absolute top-2 left-2 w-2/3 sm:top-4 sm:left-4">
            <Image
              src={profile.nameplate ?? ''}
              width={396}
              height={63}
              className="w-full"
            />
            <Image
              src={profile.icon ?? ''}
              width={64}
              height={64}
              className="absolute top-0.5 left-0.5 aspect-square w-[14%] sm:top-1 sm:left-1 sm:w-14"
            />
            <div className="absolute top-0.5 left-[15%] w-[20%] sm:top-1">
              <Image src={profile.rating.color ?? ''} width={396} height={63} />
              <span className="absolute top-[10%] left-[45%] text-[8px] font-semibold tracking-widest sm:top-[13%] sm:text-xs">
                {profile.rating.value}
              </span>
              <Image
                src={profile.classRank ?? ''}
                width={64}
                height={64}
                className="absolute -top-1 left-full w-1/2 sm:-top-2 sm:w-[70%]"
              />
            </div>
            <div className="absolute top-[35%] left-[15%] flex max-w-[35%] items-center justify-between rounded border bg-white sm:top-[42%]">
              <span className="text-[8px] text-black sm:text-xs">
                {profile.name}
              </span>
              <div className="w-1/4">
                <Image src={profile.courseRank ?? ''} width={396} height={63} />
              </div>
            </div>
            <div className="absolute bottom-1 left-[15%] w-[35%]">
              <Image
                src={profile.title.typeUrl ?? ''}
                width={396}
                height={63}
                className="absolute bottom-0 left-0"
              />
              <div className="relative w-full translate-y-[-20%] text-center text-[4px] text-black sm:text-[8px]">
                {profile.title.value}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
