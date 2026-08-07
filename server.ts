// Synnical custom server — runs Next.js + socket.io chat on ONE port.
// Works on Replit (PORT=3000), HF Spaces (PORT=7860), Koyeb, Railway, etc.
import { createServer } from "http"
import next from "next"
import { attachChat } from "./src/lib/chat-server"

const dev = process.env.NODE_ENV !== "production"
const hostname = process.env.HOSTNAME || "0.0.0.0"
// HF Spaces uses port 7860, others use PORT or default 3000
const port = Number(process.env.PORT) || 3000

async function main() {
  const app = next({ dev, hostname, port })
  const handle = app.getRequestHandler()
  await app.prepare()

  const httpServer = createServer((req, res) => handle(req, res))
  attachChat(httpServer)

  httpServer.listen(port, hostname, () => {
    console.log(`> Synnical ready on http://${hostname}:${port} (dev=${dev})`)
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
