Bagus! Karena kamu sudah punya TikTok downloader dengan `yt-dlp` + proxy backend, Instagram downloader ini **hampir identik** — tinggal sesuaikan beberapa bagian saja.

---

## Perbedaan TikTok vs Instagram

| | TikTok | Instagram |
|---|---|---|
| Library | yt-dlp | yt-dlp (sama) |
| Perlu login? | Tidak | Kadang perlu (untuk konten private/story) |
| Tipe konten | Video saja | Video, foto, carousel, reels, story |
| Hotlink protection | Ya | Ya (sama, butuh proxy) |

---

## Backend — tambah endpoint baru

Karena strukturnya mirip, kamu tinggal tambah route baru di backend yang sudah ada:

**FastAPI (Python):**

```python
import yt_dlp
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

class DownloadRequest(BaseModel):
    url: str

@app.post("/instagram/info")
async def get_instagram_info(req: DownloadRequest):
    ydl_opts = {
        'quiet': True,
        'noplaylist': False,  # True = ambil satu, False = ambil semua carousel
        'extract_flat': False,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(req.url, download=False)

            # Cek apakah carousel (banyak foto/video)
            if 'entries' in info:
                # Carousel post
                items = []
                for entry in info['entries']:
                    items.append({
                        'type': 'video' if entry.get('vcodec') != 'none' else 'photo',
                        'url': entry.get('url'),
                        'thumbnail': entry.get('thumbnail'),
                        'headers': entry.get('http_headers', {}),
                    })
                return {'type': 'carousel', 'items': items, 'title': info.get('title')}
            else:
                # Single video/reels
                return {
                    'type': 'video' if info.get('vcodec') != 'none' else 'photo',
                    'url': info.get('url'),
                    'thumbnail': info.get('thumbnail'),
                    'title': info.get('title'),
                    'headers': info.get('http_headers', {}),
                }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal memproses URL: {str(e)}")


@app.get("/instagram/stream")
async def stream_instagram(url: str, referer: str = "https://www.instagram.com/"):
    """Proxy file agar tidak kena hotlink protection"""
    
    async def streamer():
        async with httpx.AsyncClient() as client:
            async with client.stream("GET", url, headers={
                "Referer": referer,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            }, follow_redirects=True) as r:
                async for chunk in r.aiter_bytes(8192):
                    yield chunk

    return StreamingResponse(streamer(), media_type="video/mp4")


@app.get("/instagram/download")
async def download_instagram(url: str):
    """Download langsung dengan header Content-Disposition"""
    
    async def streamer():
        async with httpx.AsyncClient() as client:
            async with client.stream("GET", url, headers={
                "Referer": "https://www.instagram.com/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            }, follow_redirects=True) as r:
                async for chunk in r.aiter_bytes(8192):
                    yield chunk

    return StreamingResponse(
        streamer(),
        media_type="application/octet-stream",
        headers={"Content-Disposition": "attachment; filename=instagram_media.mp4"}
    )
```

**Express.js (Node.js):**

```javascript
const { execSync } = require('child_process');

app.post('/instagram/info', async (req, res) => {
    const { url } = req.body;
    
    try {
        // Ambil info JSON dari yt-dlp
        const output = execSync(
            `yt-dlp --dump-json --no-playlist "${url}"`,
            { encoding: 'utf8', timeout: 30000 }
        );
        
        const info = JSON.parse(output);
        
        res.json({
            type: info.vcodec !== 'none' ? 'video' : 'photo',
            url: info.url,
            thumbnail: info.thumbnail,
            title: info.title,
            headers: info.http_headers
        });
    } catch (err) {
        res.status(400).json({ error: 'Gagal memproses URL Instagram' });
    }
});

app.get('/instagram/stream', async (req, res) => {
    const { url } = req.query;
    
    const response = await axios({
        method: 'GET',
        url: decodeURIComponent(url),
        responseType: 'stream',
        headers: {
            'Referer': 'https://www.instagram.com/',
            'User-Agent': 'Mozilla/5.0'
        }
    });
    
    res.setHeader('Content-Type', 'video/mp4');
    response.data.pipe(res);
});
```

---

## Frontend — komponen React

```jsx
import { useState } from 'react';
import axios from 'axios';

export default function InstagramDownloader() {
    const [url, setUrl] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFetch = async () => {
        if (!url.includes('instagram.com')) {
            setError('Masukkan URL Instagram yang valid');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const { data } = await axios.post('/api/instagram/info', { url });
            setResult(data);
        } catch (err) {
            setError('Gagal memproses URL. Pastikan URL benar dan konten publik.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (mediaUrl) => {
        // Lewatkan URL asli ke endpoint proxy backend
        const proxyUrl = `/api/instagram/download?url=${encodeURIComponent(mediaUrl)}`;
        window.open(proxyUrl, '_blank');
    };

    return (
        <div className="max-w-xl mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-6">Instagram Downloader</h1>

            {/* Input URL */}
            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste URL Instagram (post, reels, story)..."
                    className="flex-1 border rounded-lg px-4 py-2 text-sm"
                />
                <button
                    onClick={handleFetch}
                    disabled={loading || !url}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                    {loading ? 'Memproses...' : 'Ambil'}
                </button>
            </div>

            {error && (
                <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            {/* Hasil - Single video/foto */}
            {result && result.type !== 'carousel' && (
                <div className="border rounded-xl p-4">
                    {result.thumbnail && (
                        <img src={result.thumbnail} alt="preview"
                            className="w-full rounded-lg mb-4 object-cover max-h-64" />
                    )}
                    {result.type === 'video' && (
                        <video
                            src={`/api/instagram/stream?url=${encodeURIComponent(result.url)}`}
                            controls
                            className="w-full rounded-lg mb-4"
                        />
                    )}
                    <button
                        onClick={() => handleDownload(result.url)}
                        className="w-full bg-green-600 text-white py-2 rounded-lg text-sm"
                    >
                        Download {result.type === 'video' ? 'Video' : 'Foto'}
                    </button>
                </div>
            )}

            {/* Hasil - Carousel */}
            {result && result.type === 'carousel' && (
                <div>
                    <p className="text-sm text-gray-500 mb-3">
                        {result.items.length} item ditemukan
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {result.items.map((item, i) => (
                            <div key={i} className="border rounded-xl p-3">
                                {item.thumbnail && (
                                    <img src={item.thumbnail} alt={`item ${i+1}`}
                                        className="w-full rounded-lg mb-2 object-cover h-32" />
                                )}
                                <button
                                    onClick={() => handleDownload(item.url)}
                                    className="w-full bg-green-600 text-white py-1.5 rounded-lg text-xs"
                                >
                                    Download {item.type === 'video' ? 'Video' : 'Foto'} {i+1}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
```

---

## Hal Penting yang Perlu Diperhatikan

**Story & konten private** — `yt-dlp` perlu cookies Instagram kamu untuk mengakses story atau akun private. Bisa dilakukan dengan export cookies dari browser:

```bash
yt-dlp --cookies-from-browser chrome "https://www.instagram.com/stories/username/..."
```

Atau simpan cookies ke file:
```python
ydl_opts = {
    'cookiefile': 'instagram_cookies.txt',
}
```

**Rate limiting** — Instagram agresif dalam mendeteksi scraping. Tambahkan delay antar request dan jangan test terlalu sering dengan akun yang sama.

**Update yt-dlp rutin** — Instagram sering update struktur API-nya, jadi `yt-dlp` perlu diupdate secara berkala:
```bash
pip install -U yt-dlp
```

---

Mau saya bantu bagian tertentu lebih detail? Misalnya cara handle cookies untuk story, atau integrasi ke halaman ReeTools yang sudah ada?