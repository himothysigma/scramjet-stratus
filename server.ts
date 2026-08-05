// Stratus custom server — runs Next.js + the socket.io chat on ONE port.
// Used on Replit / standard Node hosts where only a single port is exposed.
// (In the sandbox dev environment we use `next dev` + the separate
// mini-services/chat-service instead.)
import { createServer } from "http"
import next from "next"
import { attachChat } from "./src/lib/chat-server"

const dev = process.env.NODE_ENV !== "production"
const hostname = process.env.HOSTNAME || "0.0.0.0"
const port = Number(process.env.PORT) || 3000

async function main() {
  const app = next({ dev, hostname, port })
  const handle = app.getRequestHandler()
  await app.prepare()

  const httpServer = createServer((req, res) => handle(req, res))
  attachChat(httpServer)

  httpServer.listen(port, hostname, () => {
    console.log(`> Stratus ready on http://${hostname}:${port} (dev=${dev})`)
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
