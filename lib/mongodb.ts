import dns from "dns";
import mongoose from "mongoose";

// Dev-only DNS fallback. On some Windows machines Node's own resolver can't reach
// the system DNS server at all (every Node lookup fails, including plain domains —
// not just Atlas), while the OS's own resolver works fine (e.g. PowerShell's
// Resolve-DnsName succeeds). Because MONGODB_URI uses mongodb+srv://, connecting
// requires a DNS SRV lookup, so this breaks Atlas specifically with
// "querySrv ECONNREFUSED ..." even though the cluster and credentials are fine.
// Pointing Node at a public resolver works around it. Skipped in production —
// Vercel's network doesn't have this problem, and there's no reason to override
// DNS there.
if (process.env.NODE_ENV !== "production") {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
  dns.promises.setServers(["8.8.8.8", "1.1.1.1"]);
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
