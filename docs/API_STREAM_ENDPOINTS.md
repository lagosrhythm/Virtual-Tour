# Stream Provider & Live Tour Admin API Endpoints

## Stream Provider Endpoints (Requires Admin Role)

### POST /admin/streams

Create a new stream provider.

**Request:**

```json
{
  "type": "youtube" | "mux" | "cloudflare" | "manual_hls" | "browser_webrtc",
  "name": "string",
  "config": {
    "youtubeChannelId"?: "string",
    "muxAccessToken"?: "string",
    "muxLiveStreamId"?: "string",
    "cloudflareAccountId"?: "string",
    "cloudflareZoneId"?: "string",
    "hlsPlaylistUrl"?: "string",
    "ingestUrl"?: "string",
    "streamKey"?: "string"
  }
}
```

**Response (201 Created):**

```json
{
  "data": {
    "id": "string",
    "type": "youtube",
    "name": "YouTube - Main Channel",
    "config": { ... },
    "createdAt": "2026-06-01T00:00:00.000Z"
  }
}
```

**Errors:**

- 400: Invalid provider type or missing name
- 401: Not authenticated
- 403: Not admin
- 500: Server error

---

### GET /admin/streams

List all stream providers.

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "sp_001",
      "type": "youtube",
      "name": "YouTube - Main Channel",
      "config": { ... },
      "createdAt": "2026-06-01T00:00:00.000Z"
    },
    {
      "id": "sp_002",
      "type": "manual_hls",
      "name": "HLS Backup Stream",
      "config": { ... },
      "createdAt": "2026-06-01T00:00:00.000Z"
    }
  ]
}
```

**Errors:**

- 401: Not authenticated
- 403: Not admin
- 500: Server error

---

### PUT /admin/streams/:id

Update a stream provider.

**Request:**

```json
{
  "type"?: "youtube" | "mux" | "cloudflare" | "manual_hls" | "browser_webrtc",
  "name"?: "string",
  "config"?: {
    // Provider-specific config updates
  }
}
```

**Response (200 OK):**

```json
{
  "data": {
    "ok": true
  }
}
```

**Errors:**

- 400: Invalid provider type
- 401: Not authenticated
- 403: Not admin
- 404: Stream provider not found
- 500: Server error

---

### DELETE /admin/streams/:id

Delete a stream provider.

**Response (200 OK):**

```json
{
  "data": {
    "ok": true
  }
}
```

**Errors:**

- 401: Not authenticated
- 403: Not admin
- 404: Stream provider not found
- 500: Server error

---

## Live Tour Endpoints (Requires Auth)

### POST /admin/tours

Create a new live tour (requires auth; all users can create).

**Request:**

```json
{
  "streamProviderId": "string (required)",
  "title": "string (required)",
  "shortDescription": "string",
  "hostName": "string",
  "location": "string",
  "metadata"?: {
    "youtubeVideoId"?: "string",
    "playbackUrl"?: "string",
    "streamKey"?: "string",
    "ingestUrl"?: "string",
    "imageUrl"?: "string",
    "hostImageUrl"?: "string"
  }
}
```

**Response (201 Created):**

```json
{
  "data": {
    "id": "tour_001",
    "streamProviderId": "sp_001",
    "title": "Lekki Conservation Centre Virtual Tour",
    "shortDescription": "Explore the beautiful Lekki Conservation Centre",
    "hostName": "Lagos Rhythm",
    "hostId": "user_uid",
    "location": "Lekki, Lagos",
    "startedAt": null,
    "endedAt": null,
    "status": "draft",
    "viewerCount": 0,
    "metadata": { ... },
    "createdAt": "2026-06-01T00:00:00.000Z",
    "updatedAt": "2026-06-01T00:00:00.000Z"
  }
}
```

**Errors:**

- 400: Missing required fields
- 401: Not authenticated
- 404: Stream provider not found
- 500: Server error

---

### GET /admin/tours

List live tour history.

**Query Parameters:**

- None (returns last 100 tours)

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "tour_001",
      "streamProviderId": "sp_001",
      "title": "Lekki Conservation Centre Virtual Tour",
      "shortDescription": "Explore the beautiful Lekki Conservation Centre",
      "hostName": "Lagos Rhythm",
      "hostId": "user_uid",
      "location": "Lekki, Lagos",
      "status": "draft",
      "viewerCount": 0,
      "metadata": { ... },
      "createdAt": "2026-06-01T00:00:00.000Z",
      "updatedAt": "2026-06-01T00:00:00.000Z"
    }
  ]
}
```

**Errors:**

- 401: Not authenticated
- 500: Server error

---

### PUT /admin/tours/:id

Update a live tour.

**Request:**

```json
{
  "title"?: "string",
  "shortDescription"?: "string",
  "hostName"?: "string",
  "location"?: "string",
  "status"?: "draft" | "scheduled" | "live" | "ended",
  "metadata"?: {
    // Updated metadata fields
  }
}
```

**Response (200 OK):**

```json
{
  "data": {
    "ok": true
  }
}
```

**Errors:**

- 400: Invalid status or other validation errors
- 401: Not authenticated
- 500: Server error

---

## Usage Examples

### Create a YouTube Stream Provider

```bash
curl -X POST http://localhost:3000/admin/streams \
  -H "Authorization: Bearer {firebase_id_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "youtube",
    "name": "YouTube - Main Live",
    "config": {
      "youtubeChannelId": "UCxxxxxx",
      "streamKey": "rtmps://a.rtmp.youtube.com/live2/xxxxxx"
    }
  }'
```

### Create a Live Tour with YouTube Provider

```bash
curl -X POST http://localhost:3000/admin/tours \
  -H "Authorization: Bearer {firebase_id_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "streamProviderId": "sp_001",
    "title": "Lekki Conservation Centre Tour",
    "shortDescription": "A virtual tour of the Lekki Conservation Centre",
    "hostName": "Lagos Rhythm",
    "location": "Lekki, Lagos",
    "metadata": {
      "youtubeVideoId": "dQw4w9WgXcQ",
      "imageUrl": "https://example.com/image.jpg"
    }
  }'
```

### Go Live with a Tour

```bash
curl -X PUT http://localhost:3000/admin/tours/tour_001 \
  -H "Authorization: Bearer {firebase_id_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "live",
    "metadata": {
      "youtubeVideoId": "dQw4w9WgXcQ"
    }
  }'
```

---

## Stream Provider Types Configuration

### YouTube

```json
{
  "type": "youtube",
  "config": {
    "youtubeChannelId": "string",
    "streamKey": "string",
    "playbackUrl": "https://www.youtube.com/watch?v={videoId}"
  }
}
```

### Manual HLS

```json
{
  "type": "manual_hls",
  "config": {
    "hlsPlaylistUrl": "https://example.com/playlist.m3u8",
    "ingestUrl": "rtmp://example.com/live",
    "streamKey": "string"
  }
}
```

### Mux

```json
{
  "type": "mux",
  "config": {
    "muxAccessToken": "string",
    "muxLiveStreamId": "string",
    "muxPlaybackId": "string"
  }
}
```

### Cloudflare Stream

```json
{
  "type": "cloudflare",
  "config": {
    "cloudflareAccountId": "string",
    "cloudflareZoneId": "string",
    "streamDomain": "string"
  }
}
```

### Browser WebRTC (P2P)

```json
{
  "type": "browser_webrtc",
  "config": {
    "signalingServerUrl": "wss://example.com/signal",
    "iceServers": ["stun:stun.l.google.com:19302"]
  }
}
```
