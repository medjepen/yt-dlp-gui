import { useEffect, useState } from "react";
import { AddOptionList } from "./AddOptionList";
import { GetVideoInfo } from "./GetVideoInfo";

type VideoInfo = {
  title: string;
  thumbnail: string;
  uploader: string;
  duration: number;
  formats: {
    format_id: string;
    ext: string;
    resolution: string;
  }[];
};

type Props = {
  url: string;
  filename: string;
  setFilename: (filename: string) => void;
  videoInfo: VideoInfo | null;
  optionQuality: string;
  setOptionQuality: (optionQuality: string) => void;
  optionFormat: string;
  setOptionFormat: (optionFormat: string) => void;
  optionExtra: string[];
  setOptionExtra: (optionExtra: string[]) => void;
  audioOnly: boolean;
  setAudioOnly: (audioOnly: boolean) => void;
  downloadPath: string;
  setDownloadPath: (downloadPath: string) => void;
};

export const DownloadForm = ({
    url,
    filename,
    videoInfo,
    setFilename,
    optionQuality,
    setOptionQuality,
    optionFormat,
    setOptionFormat,
    optionExtra,
    setOptionExtra,
    audioOnly,
    setAudioOnly,
    downloadPath,
    setDownloadPath,
    }:Props) => {
    // 動画タイトルをファイル名のデフォルト値に設定
    useEffect(() => {
        if (videoInfo && !filename) {
            setFilename(videoInfo.title);
        }
    }, [videoInfo, filename, setFilename]);

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
        // 追加オプションがある場合は分割してリストに追加する
        if (optionExtra.length > 0) {
            for (const opt of optionExtra){
                const parts = opt.trim().split(/\s+/); // 空白文字で分割
                if (parts.length > 0) {
                    options.push(...parts);
                } else {
                    options.push(opt);
                }
            }
            console.log("追加されたオプション", optionExtra);
            console.log("オプション", options);
        }

        try {
            const res = await fetch('http://localhost:8000/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url,
                    filename,
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
                const err = await res.text();
                throw new Error(`HTTP error! status: ${res.status}\nDetails: ${err}`);
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
                bg-[#2f2f30]
                rounded-2xl
                shadow-lg
                p-6
                space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 text-left text-sm">ファイル名</label>
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
                            placeholder="動画タイトルなど"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
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
                                        bg-bg
                                        text-text
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
                                        bg-bg
                                        text-text
                                        rounded
                                        ">
                                    <option value="mp4">MP4</option>
                                    <option value="mkv">MKV</option>
                                    <option value="webm">WEBM</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <AddOptionList onChange={setOptionExtra} />
                        </div>
                        <label className="block mb-2 text-left text-sm">
                            <input
                                type="checkbox"
                                checked={audioOnly}
                                onChange={(e) => setAudioOnly(e.target.checked)}
                                className="mr-2"
                            />Download Audio Only
                        </label>
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
    );
};