## 本番配布時の構成イメージ
```s
[ Electron アプリ ]
├─ React (UI)
├─ Node.js (Electron ロジック)
└─ Python (FastAPI API + yt-dlp + ffmpeg)
     └─ Electron の Node.jsから Python を child_process で実行
```
- Electronアプリから child_process.spawn() などで Python の API サーバーを起動
- Electronは http://localhost:8000 などでそのPythonサーバーにアクセス
- 必要な依存（yt-dlp, ffmpeg, fastapi, uvicornなど）を Electron パッケージ内に同梱

## Dockerでの開発構成
```s
[Docker コンテナ]
├─ frontend/   ← React
├─ backend/    ← Python (FastAPI + yt-dlp + ffmpeg)
├─ Electron用 mock 構成（nodeからPython起動）
├─ Dockerfile
└─ docker-compose.yml
```
- それぞれのサーバ起動
  - frontend: `npm run dev` -> http://localhost:5173/ が起動
  - backend: -> `docker compose up -d` -> http://localhost:8000/ が起動
## Video Downloader API設計
| メソッド | パス | 内容 |
| --- | --- | --- |
| POST | /download | 指定のURLをローカルに保存 |
| GET | /status | 処理中・完了などの状態取得 |
| GET | /options | yt-dlpの利用可能なオプション一覧（任意）|

### 使い方
- `/download`
```s
curl -X POST http://localhost:8000/download \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=CT2_P2DZBR0",
    "options": [
      "--ffmpeg-location",
      "/usr/bin/ffmpeg",
      "-f",
      "bestvideo[height<=720]+bestaudio/best[height<=720]",
      "--merge-output-format",
      "mp4",
      "--postprocessor-args",
      "-c:v libx264 -crf 28 -c:a aac -movflags +faststart"
    ],
    "output_dir": "./downloads"
  }'
```

## 開発環境と本番環境の違いについて
- 開発中は`frontend`がローカル、`backend`がDockerの上で動作する
  - `frontend`は`Vite+React+Typescript`
  - `backend`は`Docker+FastAPI+Python`
- 本番では`Electron`を扱う
  - `frontend`は`Electron(ビルドされたReactを内包)`
  - `backend`は`Nodeks+FastAPI+Python(ほぼそのまま)`
  - 開発中はWebブラウザで動くためローカルファイルへのアクセス制限がかかる
    - 例えば、動画を保存する先のディレクトリ指定が開発環境では直接指定し、書き込みにいくことができない
    - そのため開発中はユーザーに保存先のパスを記入してもらう動きにするなど差異がうまれる
- ChatAIからのヒント
  - コードを分けずに、環境ごとの条件分岐で対応
  - コードベースは1つでOK
  - 条件分岐によって、Electronの機能を使うかどうかなどを切り替える
  - Electronが必要な本番環境では、Reactをビルドしてから使う

## 開発環境->本番環境デプロイの流れ
- 今の開発環境（Vite + React + TypeScript + DockerでAPI）から、Electronアプリとしてデプロイするまでのロードマップ

| ステップ | 内容 |
|---------|------|
| UI作成 | Vite + Reactで通常通り |
| Electron導入 | Electron初期化、`main.ts` + `preload.ts`作成 |
| 本番向け設定 | ReactをビルドしてElectronから読み込み |
| 動作統一 | Electron上で保存パス選択などを実装 |
| 配布準備 | electron-builderでパッケージング |
| 配布 | .exeや.appを生成して配布 |

### 🧩 フェーズ 1：UIの機能固め（現在進行中）
- [x] 動画URLとオプション入力フォーム
- [x] APIとの接続と動作確認（CORS対応も完了）
- [ ] 保存パスのUI設計（現状は手動入力）
- [ ] UI完成度をある程度まで高める

### 🧩 フェーズ 2：Electronプロジェクトとして構築
1. **Electron環境の初期化**
   - `frontend/`配下で `npm install electron electron-builder`
   - `main.ts`（Electronメインプロセス）、`preload.ts`（セキュアな通信）を追加
   - `package.json` に Electron の起動スクリプトを追加
2. **ViteでReactをビルド**
   - `npm run build`（＝ `/dist` ディレクトリが出力される）
   - Electron からこの `/dist/index.html` を読み込む形に
3. **ElectronでAPIバックエンドと通信**
   - APIは引き続き `http://localhost:8000` にデプロイされていればOK（別プロセス）
   - 必要に応じて `axios` や `fetch` を使いまわす

### 🧩 フェーズ 3：保存パスやファイル操作の実装（Electron専用機能）
1. **Node.jsのfsやpathモジュールを使った保存処理**
   - Electronの `ipcRenderer` / `ipcMain` でReactと通信
   - OSのダイアログ（`dialog.showOpenDialog`）を使って保存先指定
2. **保存パスをAPIに渡す仕組みをElectron内で制御**
   - ユーザーが選んだ保存ディレクトリを `fetch` でAPIへ送信

### 🧩 フェーズ 4：パッケージングと本番配布（Windows / macOS対応）
1. **electron-builder の設定**
   - `electron-builder.yml` や `package.json` に出力形式（`win`, `mac`, `AppImage` など）を定義
   - バイナリ形式（.exe や .app）で出力可能
2. **パッケージ作成**
   ```bash
   npm run build      # Reactアプリのビルド
   npm run electron:build  # Electronアプリのパッケージング（scriptは別途定義）
   ```
3. **成果物を配布**
   - GitHub Release にアップロード
   - サイトやドキュメントと共に提供


## 開発中につまったところ
### ffmpegのライセンス問題
  - [参考](https://qiita.com/JuvenileTalk9/items/e857b9a62b447cc725e3)
  - GPL 2.0+
    - アプリ全体がGPL準拠(ソースコード公開)
  - LGPL 2.1+
    - 商用利用可能。アプリ本体がクローズドでOK。ffmpegを改変して再配布するならソースコード公開必要
  - 開発や検証段階ではGPLでいいかもしれないが、本番環境ではLGPLライセンスを使いたい
    - 最悪どうしても、となったらGPL版使って全公開する構え
  - パッケージに含まれるGPLライセンスのライブラリやエンコーダ
    - `libx264`(H.264エンコーダ)
    - `libx265`(H.265)
    - `libfdk_aac`(高品質AAC)
    - LGPLで利用するためにはこれらは除外する必要がある
      - `libx264`は代替版の`OpenH264`というバイナリがciscoから公開されているのでそれを使う
  - 使って良いLGPLまたは自由ライセンスのライブラリ
    - `libvpx`(VP8/VP9: Googleの自由ライセンス)
    - `libopus`(Opus音声: BSD)
    - `openh264`(Cisco: BSD, ⭐️要同梱通知)
      - [OpenH264](http://github.com/cisco/openh264)
- LGPL版か確認する方法
  - **`ffmpeg -version`の標準出力の中に`--enable-gpl`が無いこと**  
- LGPL版は自前ビルドが安牌とのことなので、そうする([Dockerfile.backend](docker/Dockerfile.backend) を参照)

####  M1チップのMacでビルドする場合の注意
- Dockerイメージ（たとえば debian:bullseye）が amd64 向けなのに、ホスト（Mac）は arm64（Apple Silicon）
- そのままだとgccで失敗するが、Apple Silicon MacではRosetta 2 の仮想化により amd64 コンテナをビルド・実行できる
- 対応しているか確認
  - Rosetta 2がインストールされていること（M1/M2では通常デフォルトでOK）
    ```s
        # Rosetta2 install する場合
        $ softwareupdate --install-rosetta
        ```
  - docker buildx の defaultビルダーが linux/amd64 をサポートしていること（していなければビルダー作成が必要）
  ```s
  # 確認 
  # linux/amd64 がサポートされていればOK
  $ docker buildx ls
  NAME/NODE           DRIVER/ENDPOINT     STATUS    BUILDKIT   PLATFORMS
  default             docker                                   
  \_ default          \_ default         running   v0.20.2    linux/amd64 (+2), linux/arm64, linux/ppc64le, linux/s390x, (2 more)
  desktop-linux*      docker                                   
  \_ desktop-linux    \_ desktop-linux   running   v0.20.2    linux/amd64 (+2), linux/arm64, linux/ppc64le, linux/s390x, (2 more)

  # 必要なら作る
  $ docker buildx create --use --name amd64builder --platform linux/amd64
  ```
- ビルドの指定
  - `docker compose build --platform=linux/amd64`
  - `unknown flag: --platform`とおこられるとき
    - `docker compose` が古いか何かでサポートされていない構文扱いになる
    - 代わりに`docker-compose.yml`でplatform指定する
    ```yml
    services:
      backend:
        build:
          context: .
          dockerfile: Dockerfile
          platform: linux/amd64
    ```
  - それでもおこられる -> docker compose (V2) のせいじゃない
    - Docker BuildKit の設定を変更する
      - docker.desktop > Settings > Docker Engine のjsonを修正し`Apply&Restart`
        ```json
        {
          "builder": {
            "gc": {
              "defaultKeepStorage": "20GB",
              "enabled": true
            }
          },
          "experimental": true, // false -> true に変更
          // 以下を追加
          "features" : {
            "buildkit": true
          }
        }
        ```
  - それでもおこられる -> 結局原因わからず
    - 直接ビルドコマンドを叩く -> Success!!!!!
    ```s
    $ docker buildx build --platform linux/amd64 -t yt-dlp-gui:latest -f ./docker/Dockerfile.backend .
    ```
  - ビルド時間: 10分くらい(s)
- ffmpegのライブラリがリンクされているか確認する方法
  - コンテナ内で`ldd $(which ffmpeg)`
  ```s
  [same-chan yt-dlp-gui]$ docker compose exec backend bash           
  WARN[0000] /Users/akari/Projects/yt-dlp-gui/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
  root@a9a27bcdeb90:/# ldd $(which ffmpeg)
        libavdevice.so.62 => /usr/local/lib/libavdevice.so.62 (0x00007fffff763000)
        libavfilter.so.11 => /usr/local/lib/libavfilter.so.11 (0x00007fffff35a000)
        libavformat.so.62 => /usr/local/lib/libavformat.so.62 (0x00007fffff0bb000)
        libavcodec.so.62 => /usr/local/lib/libavcodec.so.62 (0x00007ffffdce3000)
        libswresample.so.6 => /usr/local/lib/libswresample.so.6 (0x00007ffffdcc4000)
        libswscale.so.9 => /usr/local/lib/libswscale.so.9 (0x00007ffffdbce000)
        libavutil.so.60 => /usr/local/lib/libavutil.so.60 (0x00007ffffcac5000)
        libm.so.6 => /lib/x86_64-linux-gnu/libm.so.6 (0x00007ffffc9e3000)
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007ffffc802000)
        libvpx.so.11 => /lib/libvpx.so.11 (0x00007ffffc5e3000)
        libopus.so.0 => /lib/x86_64-linux-gnu/libopus.so.0 (0x00007ffffc585000)
        libopenh264.so.8 => /usr/local/lib/libopenh264.so.8 (0x00007ffffc406000)
        /lib64/ld-linux-x86-64.so.2 (0x00007ffffffcb000)
        libstdc++.so.6 => /lib/x86_64-linux-gnu/libstdc++.so.6 (0x00007ffffc1ec000)
        libgcc_s.so.1 => /lib/x86_64-linux-gnu/libgcc_s.so.1 (0x00007ffffc1cc000)
  # -> すべてリンクが貼られているのでOK
  ```
### CORS対応
  - フロントとバックエンドのサーバ同士の通信でCORS制限がかかってしまった。
    フロントからのリクエストを許可するようバックエンドのFastAPIで設定をいれた
    ```s
    from fastapi.middleware.cors import CORSMiddleware
    app.add_middleware(
      CORSMiddleware,
      allow_origins=["http://localhost:5173"], # frontendのURL
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
      )
    ```