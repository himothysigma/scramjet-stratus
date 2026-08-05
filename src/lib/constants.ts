// App-wide constants. Owner password as requested by the user.
export const OWNER_PASSWORD = "Samseunlore+2711"

// Session lasts 1 year so users stay logged in across visits.
export const SESSION_COOKIE = "stratus_session"
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365 // 1 year

// Chat mini-service port (socket.io)
export const CHAT_SERVICE_PORT = 3001

// Upload directory (persisted outside public, served via API)
export const UPLOAD_DIR = "/home/z/my-project/uploads"
