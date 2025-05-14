import { useState } from "react";


export const DownloadForm = () => {
    const [url, setUrl] = useState('');
    const [optionQuality, setOptionQuality] = useState('1080');
    const [optionFormat, setOptionFormat] = useState('mp4');
    const [audioOnly, setAudioOnly] = useState(false);
    const [downloadPath, setDownloadPath] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // optionsの設定
        let options: string[] = [];

        if (audioOnly) {
            options.push('-f', 'bestaudio');
        } else {
            if (optionQuality == 'best') {
                options.push('-f', 'bestvideo*+bestaudio/best');
            } else {
                options.push('-f', `bv[height<=${optionQuality}]+ba/b[height<=${optionQuality}]`);
            }
        }
        if (optionFormat) {
            options.push('--merge-output-format', `${optionFormat}`);
        }

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
        <div className="
            min-h-screen
            bg-bg
            text-fg
            flex items-center
            justify-center p-6
            ">
            <div className="
                w-full max-w-xl
                bg-[#2f2f30]
                rounded-2xl
                shadow-lg
                p-8
                space-y-6">
                <h2 className="font-sans font-light text-fg text-2xl">動画ダウンロード</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 text-left text-sm">動画URL</label>
                        <input
                            type="text"
                            className="
                                w-full 
                                p-2 
                                rounded-md 
                                bg-bg
                                border 
                                border-accent2 
                                focus:outline-none 
                                focus:ring-2 
                                focus:ring-accent2"
                            placeholder="https://www.youtube.com/..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-left text-accent1 text-sm">オプション</label>
                        <div className="flex items-center gap-x-4 mb-4">
                            <div className="flex-1">
                                <label className="block mb-2 text-sm">画質</label>
                            </div>
                            <div className="flex-1">
                                <select
                                    value={optionQuality}
                                    onChange={(e) => setOptionQuality(e.target.value)}
                                    className="
                                        p-2
                                        border
                                        border-accent2
                                        rounded
                                        ">
                                    <option value="best">最高画質</option>
                                    <option value="1080">1080</option>
                                    <option value="720">720</option>
                                    <option value="480">480</option>
                                    <option value="360">360</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block mb-2 text-sm">出力形式</label>
                            </div>
                            <div className="flex-1 w-1/3">
                                <select
                                    value={optionFormat}
                                    onChange={(e) => setOptionFormat(e.target.value)}
                                    className="
                                        p-2
                                        border
                                        border-accent2
                                        rounded
                                        ">
                                    <option value="mp4">MP4</option>
                                    <option value="mkv">MKV</option>
                                    <option value="webm">WEBM</option>
                                </select>
                            </div>
                        </div>
                        <label className="block mb-2 text-left text-sm">
                            <input
                                type="checkbox"
                                checked={audioOnly}
                                onChange={(e) => setAudioOnly(e.target.checked)}
                                className="mr-2"
                            />Download Audio Only
                        </label>
                        {/* <textarea
                            rows={2}
                            className="
                                w-full 
                                p-2 
                                rounded-md 
                                bg-bg
                                border 
                                border-accent2 
                                focus:outline-none 
                                focus:ring-2 
                                focus:ring-accent2"
                            placeholder="-f 'bv[height<=720]+ba/b[height<=720]' ..."
                            value={options}
                            onChange={(e) => setOptions(e.target.value)}
                        ></textarea> */}
                    </div>
                    <div>
                        <label className="block mb-1 text-left text-sm">保存先パス</label>
                        <input
                            type="text"
                            className="
                                w-full 
                                p-2 
                                rounded-md 
                                bg-bg
                                border 
                                border-accent2 
                                focus:outline-none 
                                focus:ring-2 
                                focus:ring-accent2"
                            placeholder="./downloads"
                            value={downloadPath}
                            onChange={(e) => setDownloadPath(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="
                            w-full 
                            py-2 
                            px-4
                            bg-accent2
                            text-accent1
                            rounded-md 
                            hover:bg-opacity-90 
                            transition">
                        Download
                    </button>
                </form>
            </div>
        </div>
    );
};