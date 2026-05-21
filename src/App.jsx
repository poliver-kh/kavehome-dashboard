21:54:09.022 Running build in Washington, D.C., USA (East) – iad1
21:54:09.023 Build machine configuration: 2 cores, 8 GB
21:54:09.140 Cloning github.com/poliver-kh/kavehome-dashboard (Branch: main, Commit: f72a289)
21:54:09.362 Cloning completed: 222.000ms
21:54:09.967 Restored build cache from previous deployment (ALqdnZZfXH3vV9DtL3wBWBgihjyN)
21:54:10.154 Running "vercel build"
21:54:10.173 Vercel CLI 54.2.0
21:54:10.869 Installing dependencies...
21:54:13.888 
21:54:13.889 up to date in 3s
21:54:13.889 
21:54:13.890 7 packages are looking for funding
21:54:13.890   run `npm fund` for details
21:54:14.013 
21:54:14.015 > kavehome-dashboard@1.0.0 build
21:54:14.016 > vite build
21:54:14.016 
21:54:14.241 vite v5.4.21 building for production...
21:54:14.290 transforming...
21:54:14.325 ✓ 3 modules transformed.
21:54:14.327 x Build failed in 61ms
21:54:14.327 error during build:
21:54:14.327 [vite:esbuild] Transform failed with 1 error:
21:54:14.327 /vercel/path0/src/App.jsx:27:15: ERROR: Syntax error "`"
21:54:14.327 file: /vercel/path0/src/App.jsx:27:15
21:54:14.328 
21:54:14.328 Syntax error "`"
21:54:14.328 25 |    return (
21:54:14.328 26 |      <div style={{ minHeight: "100vh", background: "#0a0c10", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
21:54:14.328 27 |        <style>{\`
21:54:14.328    |                 ^
21:54:14.329 28 |          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono:wght@400;700&display=swap');
21:54:14.329 29 |          @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
21:54:14.329 
21:54:14.329     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1472:15)
21:54:14.329     at /vercel/path0/node_modules/esbuild/lib/main.js:755:50
21:54:14.329     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:622:9)
21:54:14.330     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:677:12)
21:54:14.330     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:600:7)
21:54:14.330     at Socket.emit (node:events:509:28)
21:54:14.330     at addChunk (node:internal/streams/readable:563:12)
21:54:14.330     at readableAddChunkPushByteMode (node:internal/streams/readable:514:3)
21:54:14.330     at Readable.push (node:internal/streams/readable:394:5)
21:54:14.330     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)
21:54:14.345 Error: Command "npm run build" exited with 1
