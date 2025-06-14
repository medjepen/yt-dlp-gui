import { useState } from "react";
import { formatDuration } from "./FormatDuration";

type Props = {
  url: string;
  setUrl: (url: string) => void;
};

export const GetVideoInfo = ({
    url,
    setUrl,
    }:Props) => {
    const [videoInfo, setVideoInfo] = useState<any | null>(null);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:8000/video_info?url=${encodeURIComponent(url)}`, {
                method: 'GET',
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            setVideoInfo(data);
            // debug
            console.log('Get VideoInfo Result: ', { data });
        } catch (error) {
            // debug
            console.error('Get VideoInfo Failed: ', { error });
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
                        GET INFO
                    </button>
                </form>
                {
                    videoInfo && (
                        <div className="flex items-start space-x-2 p-2">
                            {/* サムネ */}
                            <div className="relative flex-shrink-0">
                                <img 
                                    className="w-64 h-auto object-cover"
                                    src={videoInfo.thumbnail} 
                                    alt="Thumbnail"
                                />
                                <span 
                                    className="
                                    absolute 
                                    bottom-1 
                                    right-1 
                                    bg-bg/70
                                    text-sm
                                    text-fg
                                    px-1.5
                                    py-0.5
                                    rounded
                                    "
                                >{formatDuration(videoInfo.duration)}</span>
                            </div>
                            {/* 動画情報 */}
                            <div className="flex flex-col space-y-1 text-left">
                                <h3 className="text-lg">{videoInfo.title}</h3>
                                <p className="text-sm">{videoInfo.uploader}</p>
                            </div>
                            <div className="mt-2">
                                <p className="text-sm">{videoInfo.formats.format_id}</p>
                            <p className="text-sm text-gray-700">{videoInfo.formats.ext}</p>
                            <p className="text-sm text-gray-700">{videoInfo.formats.resolution}</p>
                            </div>
                        </div>
                    )
                }
            </div>
    );
};