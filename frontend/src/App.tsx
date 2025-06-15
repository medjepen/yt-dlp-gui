import './App.css'
import { useState } from "react";
import { DownloadForm } from './components/DownloadForm';
import { GetVideoInfo } from './components/GetVideoInfo';

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
}

function App() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [filename, setFilename] = useState('');
  const [optionQuality, setOptionQuality] = useState('1080');
  const [optionFormat, setOptionFormat] = useState('mp4');
  const [optionExtra, setOptionExtra] = useState<string[]>([]);
  const [audioOnly, setAudioOnly] = useState(false);
  const [downloadPath, setDownloadPath] = useState('');

  return (
      <div className="
          min-h-screen
          bg-bg
          text-fg
          flex items-center
          justify-center p-2
          ">
          <div className="
              w-full max-w-xl
              p-4
              space-y-4">
              <h2 className="font-sans font-light text-fg text-2xl">動画ダウンロード</h2>
              <GetVideoInfo 
                url={url}
                setUrl={setUrl}
                videoInfo={videoInfo}
                setVideoInfo={setVideoInfo}
              />
              <DownloadForm
                url={url}
                filename={filename}
                setFilename={setFilename}
                videoInfo={videoInfo}
                optionQuality={optionQuality}
                setOptionQuality={setOptionQuality}
                optionFormat={optionFormat}
                setOptionFormat={setOptionFormat}
                optionExtra={optionExtra}
                setOptionExtra={setOptionExtra}
                audioOnly={audioOnly}
                setAudioOnly={setAudioOnly}
                downloadPath={downloadPath}
                setDownloadPath={setDownloadPath}
              />
          </div>
      </div>
  );
};

export default App
