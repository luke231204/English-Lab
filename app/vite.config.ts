import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Streaming middleware that serves audio without .mp3 extension in URL
// This prevents Download Managers (like IDM) from intercepting and breaking the audio playback stream
function audioStreamPlugin(): Plugin {
  return {
    name: 'audio-stream-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : ''
        const match = url.match(/^\/api\/stream\/(book\d+)\/(test\d+)$/)
        if (match) {
          const [, bookFolder, testFile] = match
          const filePath = path.resolve(__dirname, 'public/assets/audio', bookFolder, `${testFile}.mp3`)

          if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath)
            const total = stat.size
            res.setHeader('Content-Type', 'audio/mpeg')
            res.setHeader('Accept-Ranges', 'bytes')
            res.setHeader('Content-Disposition', 'inline')
            res.setHeader('X-Content-Type-Options', 'nosniff')
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

            const range = req.headers.range
            if (range) {
              const parts = range.replace(/bytes=/, '').split('-')
              const start = parseInt(parts[0], 10)
              const end = parts[1] ? parseInt(parts[1], 10) : total - 1
              const chunksize = end - start + 1

              res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${total}`,
                'Content-Length': chunksize,
              })
              fs.createReadStream(filePath, { start, end }).pipe(res)
            } else {
              res.writeHead(200, {
                'Content-Length': total,
              })
              fs.createReadStream(filePath).pipe(res)
            }
            return
          }
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    audioStreamPlugin(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api/tts': {
        target: 'http://127.0.0.1:5005',
        changeOrigin: true,
      },
    },
  },
})
