import { useState } from "react";


export const DownloadForm = () => {
    const [url, setUrl] = useState('');
    const [options, setOptions] = useState({
        // format: 'mp4',
        // quality: '1080p',
        // subtitles: false,
    });
    const [downloadPath, setDownloadPath] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch('http://localhost:8000/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url,
                    options: options || [
                        '-f',
                        'bv[height<=720]+ba/b[height<=720]',
                        '--merge-output-format',
                        'mp4',
                    ],
                    output_dir: downloadPath || '',
                }),
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            // debug
            console.log('Download Result: ', { data });
        } catch (error) { 
            // debug
            console.error('Download Failed: ', { error });
        }
    };

    return (       
        <form onSubmit={handleSubmit} className="">
            <div>
                <label>動画URL:</label>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
            </div>
            <div>
                <label>Option:</label>
                <input
                    type="text"
                    value={options}
                    onChange={(e) => setOptions(e.target.value)}
                />
            </div>
            <button type="submit">Download</button>
        </form>

    );
};