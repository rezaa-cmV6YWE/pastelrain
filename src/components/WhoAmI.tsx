import { Image } from '@unpic/react'
import { LuCircuitBoard } from 'react-icons/lu'
import {
  SiBetterauth,
  SiBlender,
  SiBun,
  SiDiscord,
  SiDrizzle,
  SiExpo,
  SiGit,
  SiGithub,
  SiHono,
  SiJavascript,
  SiNextdotjs,
  SiNodedotjs,
  SiOpencode,
  SiPostman,
  SiReact,
  SiSteam,
  SiTanstack,
  SiTypescript,
  SiUnity,
  SiWarp,
} from 'react-icons/si'
import { TbBrandCSharp } from 'react-icons/tb'
import { VscVscode } from 'react-icons/vsc'

import type { ReactNode } from 'react'

function IconLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group relative inline-flex"
    >
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded bg-(--rain-ink) px-2 py-1 text-xs font-medium whitespace-nowrap text-black opacity-0 transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </a>
  )
}

export default function WhoAmI() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Image
          src="/avatar.jpg"
          width={128}
          height={128}
          className="-mt-20 rounded-full border border-gray-100"
        />
        <div>
          <h2 className="font-pixel text-4xl">hi, i'm re: </h2>
          <p>i'm a software developer.</p>
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-pixel text-xl">Main Skills:</h3>
        <ul className="flex flex-wrap gap-2">
          <li>
            <IconLink
              href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"
              label="JavaScript"
            >
              <SiJavascript size={32} />
            </IconLink>
          </li>
          <li>
            <IconLink href="https://www.typescriptlang.org/" label="TypeScript">
              <SiTypescript size={32} />
            </IconLink>
          </li>
          <li>
            <IconLink href="https://nodejs.org/" label="Node.js">
              <SiNodedotjs size={32} />
            </IconLink>
          </li>
          <li>
            <IconLink href="https://bun.sh/" label="Bun">
              <SiBun size={32} />
            </IconLink>
          </li>
          <li>
            <IconLink href="https://react.dev/" label="React">
              <SiReact size={32} />
            </IconLink>
          </li>
          <li>
            <IconLink href="https://nextjs.org/" label="Next.js">
              <SiNextdotjs size={32} />
            </IconLink>
          </li>
          <li>
            <IconLink href="https://tanstack.com/" label="TanStack">
              <SiTanstack size={32} />
            </IconLink>
          </li>
          <li>
            <IconLink href="https://expo.dev/" label="Expo">
              <SiExpo size={32} />
            </IconLink>
          </li>
          <li>
            <IconLink href="https://hono.dev/" label="Hono">
              <SiHono size={32} />
            </IconLink>
          </li>
          <li>
            <IconLink href="https://orm.drizzle.team/" label="Drizzle ORM">
              <SiDrizzle size={32} />
            </IconLink>
          </li>
          <li>
            <IconLink href="https://www.better-auth.com/" label="Better Auth">
              <SiBetterauth size={32} />
            </IconLink>
          </li>
        </ul>
        <h3 className="font-pixel text-xl">Want to Learn:</h3>
        <ul className="flex flex-wrap gap-2">
          <li>
            <IconLink
              href="https://learn.microsoft.com/en-us/dotnet/csharp/"
              label="C#"
            >
              <TbBrandCSharp size={32} />
            </IconLink>
          </li>
          <li>
            <IconLink href="https://unity.com/" label="Unity">
              <SiUnity size={32} />
            </IconLink>
          </li>
          <li>
            <IconLink href="https://www.blender.org/" label="Blender">
              <SiBlender size={32} />
            </IconLink>
          </li>
          <li>
            <IconLink href="https://docs.arduino.cc/" label="Arduino">
              <LuCircuitBoard size={32} />
            </IconLink>
          </li>
        </ul>
        <h3 className="font-pixel text-xl">Tools:</h3>
        <ul className="flex flex-wrap gap-2">
          <li>
            <IconLink href="https://code.visualstudio.com/" label="VS Code">
              <VscVscode size={32} />
            </IconLink>
          </li>
          <li>
            <IconLink href="https://opencode.ai/" label="OpenCode">
              <SiOpencode size={32} />
            </IconLink>
          </li>
          <li>
            <IconLink href="https://www.warp.dev/" label="Warp">
              <SiWarp size={32} />
            </IconLink>
          </li>
          <li>
            <IconLink href="https://git-scm.com/" label="Git">
              <SiGit size={32} />
            </IconLink>
          </li>
          <li>
            <IconLink href="https://www.postman.com/" label="Postman">
              <SiPostman size={32} />
            </IconLink>
          </li>
        </ul>
        <h3 className="font-pixel text-xl">Links:</h3>
        <ul className="flex flex-wrap gap-2">
          <li>
            <IconLink href="https://github.com/rezaa-cmV6YWE" label="GitHub">
              <SiGithub size={32} />
            </IconLink>
          </li>
          <li>
            <IconLink
              href="https://discord.com/users/465403883469012992"
              label="Discord"
            >
              <SiDiscord size={32} />
            </IconLink>
          </li>
          <li>
            <IconLink
              href="https://steamcommunity.com/id/rrainc/"
              label="Steam"
            >
              <SiSteam size={32} />
            </IconLink>
          </li>
        </ul>
      </div>
    </div>
  )
}
