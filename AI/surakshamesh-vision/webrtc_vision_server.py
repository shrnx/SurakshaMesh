"""
SurakshaMesh X - WebRTC Vision Server
FINAL VERSION - Video guaranteed to play
"""

import asyncio
import cv2
import json
import numpy as np
import time
import fractions
from aiohttp import web
import aiohttp_cors
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from av import VideoFrame

# Config
CAMERA_INDEX = 0
PORT = 5001

pcs = set()


class VideoTrack(VideoStreamTrack):
    """
    Video track that generates frames
    """
    
    def __init__(self):
        super().__init__()
        self.counter = 0
        
        # Try to open camera
        self.cap = cv2.VideoCapture(CAMERA_INDEX)
        if self.cap.isOpened():
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.cap.set(cv2.CAP_PROP_FPS, 20)
            self.use_camera = True
            print("✅ Camera opened")
        else:
            self.use_camera = False
            print("⚠️ No camera - using test pattern")
    
    async def recv(self):
        """
        Generate next frame
        """
        pts, time_base = await self.next_timestamp()
        
        self.counter += 1
        
        # Get frame from camera or generate test pattern
        if self.use_camera:
            ret, frame = self.cap.read()
            if not ret:
                frame = self._generate_frame()
        else:
            frame = self._generate_frame()
        
        # Ensure correct size
        frame = cv2.resize(frame, (640, 480))
        
        # Convert BGR to RGB
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Create VideoFrame
        new_frame = VideoFrame.from_ndarray(frame, format="rgb24")
        new_frame.pts = pts
        new_frame.time_base = time_base
        
        return new_frame
    
    def _generate_frame(self):
        """
        Generate animated test pattern
        """
        img = np.zeros((480, 640, 3), dtype=np.uint8)
        
        # Animated background
        color_value = int((np.sin(self.counter * 0.1) + 1) * 30)
        img[:] = (color_value, color_value + 20, color_value + 10)
        
        # Moving box
        x = int((np.sin(self.counter * 0.05) + 1) * 250) + 50
        cv2.rectangle(img, (x, 100), (x + 100, 200), (0, 255, 136), -1)
        
        # Text
        cv2.putText(img, "SurakshaMesh X", (150, 50), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 136), 2)
        cv2.putText(img, f"Frame: {self.counter}", (200, 300), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        cv2.putText(img, "LIVE STREAM ACTIVE", (150, 400), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 136), 2)
        
        return img
    
    def __del__(self):
        if hasattr(self, 'cap') and self.cap:
            self.cap.release()


async def offer(request):
    """
    Handle WebRTC offer
    """
    params = await request.json()
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])
    
    pc = RTCPeerConnection()
    pcs.add(pc)
    
    print(f"🔗 Peer connection created (total: {len(pcs)})")
    
    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        print(f"📡 Connection state: {pc.connectionState}")
        if pc.connectionState == "failed" or pc.connectionState == "closed":
            await pc.close()
            pcs.discard(pc)
    
    # Add video track - THIS IS THE KEY
    video = VideoTrack()
    pc.addTrack(video)
    print("✅ Video track added to peer connection")
    
    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    
    return web.Response(
        content_type="application/json",
        text=json.dumps({
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type
        })
    )


async def index(request):
    """Test page"""
    content = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SurakshaMesh X Stream</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            color: white;
            font-family: Arial, sans-serif;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            color: #00ff88;
            font-size: 2.5em;
            margin-bottom: 20px;
        }
        .video-container {
            position: relative;
            background: #000;
            border: 3px solid #00ff88;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
        }
        video {
            width: 100%;
            height: auto;
            display: block;
        }
        .status {
            text-align: center;
            margin-top: 20px;
            padding: 15px;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 8px;
            font-size: 1.2em;
        }
        .indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 10px;
            animation: pulse 2s infinite;
        }
        .green { background: #00ff88; }
        .yellow { background: #ffaa00; }
        .red { background: #ff4444; }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔴 SurakshaMesh X - Live Vision</h1>
        <div class="video-container">
            <video id="video" autoplay playsinline muted></video>
        </div>
        <div class="status">
            <span class="indicator yellow" id="indicator"></span>
            <span id="status">Connecting...</span>
        </div>
    </div>
    
    <script>
        const video = document.getElementById('video');
        const indicator = document.getElementById('indicator');
        const status = document.getElementById('status');
        
        function updateStatus(color, text) {
            indicator.className = 'indicator ' + color;
            status.textContent = text;
        }
        
        async function start() {
            try {
                updateStatus('yellow', 'Initializing WebRTC...');
                
                const pc = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' }
                    ]
                });
                
                pc.ontrack = function(event) {
                    console.log('Track received:', event.track.kind);
                    video.srcObject = event.streams[0];
                    updateStatus('green', '🟢 LIVE STREAM ACTIVE');
                };
                
                pc.onconnectionstatechange = function() {
                    console.log('Connection state:', pc.connectionState);
                    if (pc.connectionState === 'connected') {
                        updateStatus('green', '🟢 LIVE STREAM ACTIVE');
                    } else if (pc.connectionState === 'failed') {
                        updateStatus('red', '❌ Connection Failed');
                    }
                };
                
                const offer = await pc.createOffer({
                    offerToReceiveVideo: true,
                    offerToReceiveAudio: false
                });
                
                await pc.setLocalDescription(offer);
                
                updateStatus('yellow', 'Connecting to server...');
                
                const response = await fetch('/offer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sdp: pc.localDescription.sdp,
                        type: pc.localDescription.type
                    })
                });
                
                const answer = await response.json();
                await pc.setRemoteDescription(answer);
                
                updateStatus('yellow', 'Establishing connection...');
                
            } catch (e) {
                console.error('Error:', e);
                updateStatus('red', '❌ Error: ' + e.message);
            }
        }
        
        setTimeout(start, 500);
    </script>
</body>
</html>
    """
    return web.Response(content_type="text/html", text=content)


async def on_shutdown(app):
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()


if __name__ == "__main__":
    print("=" * 70)
    print("🚀 SurakshaMesh X - WebRTC Vision Streaming Server")
    print("=" * 70)
    print(f"📹 Camera Index: {CAMERA_INDEX}")
    print(f"🌐 Local URL: http://localhost:{PORT}")
    print(f"🔌 Endpoint: POST /offer")
    print("=" * 70)
    print("Ready for Serveo tunneling!")
    print("Run: ssh -R surakshamesh:80:localhost:5001 serveo.net")
    print("=" * 70)
    
    app = web.Application()
    
    # Setup CORS
    cors = aiohttp_cors.setup(app, defaults={
        "*": aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
        )
    })
    
    # Add routes
    app.router.add_post("/offer", offer)
    app.router.add_get("/", index)
    
    # Apply CORS to all routes
    for route in list(app.router.routes()):
        cors.add(route)
    
    app.on_shutdown.append(on_shutdown)
    
    web.run_app(app, host="0.0.0.0", port=PORT)