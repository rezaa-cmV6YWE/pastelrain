export default function Footer() {
  return (
    <footer className="flex flex-col">
      <span className="font-pixel text-2xl">pastelrain.com</span>
      <span className="text-sm">Built with TanStack Start</span>
      <span className="text-sm">
        Profile picture by &nbsp;
        <a
          href="https://www.pixiv.net/en/artworks/138023835"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-drop-coral underline transition"
        >
          えってる
        </a>
      </span>
    </footer>
  )
}
