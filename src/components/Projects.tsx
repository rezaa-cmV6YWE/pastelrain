export default function Projects() {
  return (
    <section className="space-y-2">
      <h2 className="font-pixel text-2xl">Projects</h2>
      <ul className="space-y-2">
        <li className="border-b border-gray-100 pb-2">
          <a
            href="https://github.com/rezaageng/elix-mobile"
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <h3 className="group-hover:text-drop-orange text-lg font-semibold transition">
              Elix Mobile
            </h3>
            <p>
              A gamified social platform built with React Native / Expo. Users
              pick a role, complete quests, earn rewards, and participate in
              guild chat and leaderboards.
            </p>
          </a>
        </li>
        <li className="border-b border-gray-100 pb-2">
          <a
            href="https://github.com/rezaageng/elix-server"
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <h3 className="group-hover:text-drop-coral text-lg font-semibold transition">
              Elix Server
            </h3>
            <p>
              A Hono backend server built on Bun, providing a typed REST API
              with WebSocket support, OAuth-based authentication, and a
              domain-driven database schema covering classes, guilds, quests,
              economy, shop, inventory, notifications, and users.
            </p>
          </a>
        </li>
        <li className="border-b border-gray-100 pb-2">
          <a
            href="https://github.com/rezaageng/me"
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <h3 className="group-hover:text-drop-teal text-lg font-semibold transition">
              me
            </h3>
            <p>
              My proffessional portfolio website built with React, TypeScript,
              Next.js, and TailwindCSS. It no longer maintened, the server is
              dead lol. I will recreate it in the future with a new design and
              features.
            </p>
          </a>
        </li>
      </ul>
    </section>
  )
}
