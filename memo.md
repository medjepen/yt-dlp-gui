## 本番配布時の構成イメージ

```s
[ Electron アプリ ]
├─ React (UI)
├─ Node.js (Electron ロジック)
└─ Python (FastAPI API + yt-dlp + ffmpeg)
     └─ Electron の Node.jsから Python を child_process で実行
```

- Electron アプリから child_process.spawn() などで Python の API サーバーを起動
- Electron は http://localhost:8000 などでその Python サーバーにアクセス
- 必要な依存（yt-dlp, ffmpeg, fastapi, uvicorn など）を Electron パッケージ内に同梱

## Docker での開発構成

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

## Video Downloader API 設計

| メソッド | パス      | 内容                                      |
| -------- | --------- | ----------------------------------------- |
| POST     | /download | 指定の URL をローカルに保存               |
| GET      | /status   | 処理中・完了などの状態取得                |
| GET      | /options  | yt-dlp の利用可能なオプション一覧（任意） |

### 使い方

- `GET /`

```s
curl -X GET http://localhost:8000/
{"message":"Welcome to the Video Downloader API!"}
```

- `POST /download`

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

- `GET /all`

```s
curl -X GET http://localhost:8000/all
{"727f5152-4c18-40f7-adcd-9de03e962573":{"status":"completed","progress":100,"error":null},"0f436e32-5d4b-4e09-8320-49511311af0b":{"status":"completed","progress":100,"error":null},"e9029194-4c53-44ea-bba0-21a22234b3a7":{"status":"in_progress","progress":10,"error":null},"f8e87b78-38c8-4a77-bc17-93d0fc7c42ff":{"status":"in_progress","progress":10,"error":null}}
```

- `GET /status/{job_id}`

```s
curl -X GET http://localhost:8000/status/f8e87b78-38c8-4a77-bc17-93d0fc7c42ff
{"status":"in_progress","progress":10,"error":null}
```

- ユニットテスト

  - fastAPI を起動せず、リクエストは通ったものとする
  - コードの整合性チェックのためのテスト

  ```s
  $ cd cd ~/Projects/yt-dlp-gui
  $ PYTHONPATH=$(pwd) pytest -sv ./backend/test/test_main.py

  # 実行例
  [same-chan yt-dlp-gui]$ PYTHONPATH=$(pwd) pytest -sv ./backend/test/test_main.py
  ============================= test session starts ==============================
  platform darwin -- Python 3.10.9, pytest-8.3.5, pluggy-1.6.0 -- /usr/local/bin/python3
  cachedir: .pytest_cache
  rootdir: /Users/akari/Projects/yt-dlp-gui
  plugins: anyio-4.9.0
  collected 1 item

  backend/test/test_main.py::test_create_job_and_check_status Command:  ['yt-dlp', '-o', './downloads/aebaa9de-4b31-47ca-9665-391a86578143.%(ext)s', '-f', 'best', 'https://www.youtube.com/watch?v=CT2_P2DZBR0']
  WARNING: "-f best" selects the best pre-merged format which is often not the best option.
          To let yt-dlp download and merge the best available formats, simply do not pass any format selection.
          If you know what you are doing and want only the best pre-merged format, use "-f b" instead to suppress this warning
  [youtube] Extracting URL: https://www.youtube.com/watch?v=CT2_P2DZBR0
  [youtube] CT2_P2DZBR0: Downloading webpage
  [youtube] CT2_P2DZBR0: Downloading tv client config
  [youtube] CT2_P2DZBR0: Downloading player 1b376dba-main
  [youtube] CT2_P2DZBR0: Downloading tv player API JSON
  [youtube] CT2_P2DZBR0: Downloading ios player API JSON
  [youtube] CT2_P2DZBR0: Downloading m3u8 information
  [info] CT2_P2DZBR0: Downloading 1 format(s): 18
  [download] Destination: ./downloads/aebaa9de-4b31-47ca-9665-391a86578143.mp4
  [download] 100% of   10.26MiB in 00:00:00 at 22.74MiB/s
  {'job_id': '52a299fa-2d0b-471f-aa5e-cacaed9d082c', 'message': 'Job created'}
  {'status': 'in_progress', 'progress': 10, 'error': None}
  PASSED

  ============================== 1 passed in 4.47s ===============================
  ```

- e2e テスト

  - fastAPI を起動し、リクエストが通るかどうかをチェックするテスト

  ```s
  [same-chan yt-dlp-gui]$ pwd
  /Users/akari/Projects/yt-dlp-gui
  [same-chan yt-dlp-gui]$ pytest backend/test/e2e_test_download_flow.py -s
  /Library/Frameworks/Python.framework/Versions/3.10/lib/python3.10/site-packages/pytest_asyncio/plugin.py:217: PytestDeprecationWarning: The configuration option "asyncio_default_fixture_loop_scope" is unset.
  The event loop scope for asynchronous fixtures will default to the fixture caching scope. Future versions of pytest-asyncio will default the loop scope for asynchronous fixtures to function scope. Set the default fixture loop scope explicitly in order to avoid unexpected behavior in the future. Valid fixture loop scopes are: "function", "class", "module", "package", "session"

    warnings.warn(PytestDeprecationWarning(_DEFAULT_FIXTURE_LOOP_SCOPE_UNSET))
  ============================= test session starts ==============================
  platform darwin -- Python 3.10.9, pytest-8.3.5, pluggy-1.6.0
  rootdir: /Users/akari/Projects/yt-dlp-gui
  plugins: anyio-4.9.0, asyncio-0.26.0
  asyncio: mode=strict, asyncio_default_fixture_loop_scope=None, asyncio_default_test_loop_scope=function
  collected 1 item

  backend/test/e2e_test_download_flow.py response data >>>  {'job_id': 'a0b23f52-9101-415c-98a6-98f63a0b0102', 'message': 'Job created'}
  Current status: {'status': 'in_progress', 'progress': 10, 'error': None}
  Current status: {'status': 'in_progress', 'progress': 10, 'error': None}
  Current status: {'status': 'in_progress', 'progress': 10, 'error': None}
  Current status: {'status': 'completed', 'progress': 100, 'error': None}
  .

  ============================== 1 passed in 12.20s ==============================

  ```

## 開発環境と本番環境の違いについて

- 開発中は`frontend`がローカル、`backend`が Docker の上で動作する
  - `frontend`は`Vite+React+Typescript`
  - `backend`は`Docker+FastAPI+Python`
- 本番では`Electron`を扱う
  - `frontend`は`Electron(ビルドされたReactを内包)`
  - `backend`は`Nodeks+FastAPI+Python(ほぼそのまま)`
  - 開発中は Web ブラウザで動くためローカルファイルへのアクセス制限がかかる
    - 例えば、動画を保存する先のディレクトリ指定が開発環境では直接指定し、書き込みにいくことができない
    - そのため開発中はユーザーに保存先のパスを記入してもらう動きにするなど差異がうまれる
- ChatAI からのヒント
  - コードを分けずに、環境ごとの条件分岐で対応
  - コードベースは 1 つで OK
  - 条件分岐によって、Electron の機能を使うかどうかなどを切り替える
  - Electron が必要な本番環境では、React をビルドしてから使う

## 開発環境->本番環境デプロイの流れ

- 今の開発環境（Vite + React + TypeScript + Docker で API）から、Electron アプリとしてデプロイするまでのロードマップ

| ステップ      | 内容                                          |
| ------------- | --------------------------------------------- |
| UI 作成       | Vite + React で通常通り                       |
| Electron 導入 | Electron 初期化、`main.ts` + `preload.ts`作成 |
| 本番向け設定  | React をビルドして Electron から読み込み      |
| 動作統一      | Electron 上で保存パス選択などを実装           |
| 配布準備      | electron-builder でパッケージング             |
| 配布          | .exe や.app を生成して配布                    |

### 🧩 フェーズ 1：UI の機能固め（現在進行中）

- [x] 動画 URL とオプション入力フォーム
- [x] API との接続と動作確認（CORS 対応も完了）
- [ ] 保存パスの UI 設計（現状は手動入力）
- [x] UI 完成度をある程度まで高める

### 🧩 フェーズ 1+：バックエンド の機能固め（現在進行中）

- ダウンロードをまって失敗が一番萎えるので、そこをまず補強する機能/非機能を実装
  - ユーザーが動画をダウンロードするとき、リクエストを受け取ったらすぐにレスポンスを返す。
  - 実際のダウンロード処理はバックグラウンドで非同期に実行される。
  - ジョブの状態（例：queued, in_progress, completed, failed）を確認できるようにする。
- リクエストの状態管理

```
job_store（メモリ上のジョブ保存辞書）
create_job_entry(job_id)（ジョブ作成・登録）
update_job_status(job_id, ...)（ステータス更新）
get_job_status(job_id)（ステータス取得）
get_jobs_by_status(status)（状態ごとのジョブ取得）
```

### 🧩 フェーズ 2：Electron プロジェクトとして構築

1. **Electron 環境の初期化**
   - `frontend/`配下で `npm install electron electron-builder`
   - `main.ts`（Electron メインプロセス）、`preload.ts`（セキュアな通信）を追加
   - `package.json` に Electron の起動スクリプトを追加
2. **Vite で React をビルド**
   - `npm run build`（＝ `/dist` ディレクトリが出力される）
   - Electron からこの `/dist/index.html` を読み込む形に
3. **Electron で API バックエンドと通信**
   - API は引き続き `http://localhost:8000` にデプロイされていれば OK（別プロセス）
   - 必要に応じて `axios` や `fetch` を使いまわす

### 🧩 フェーズ 3：保存パスやファイル操作の実装（Electron 専用機能）

1. **Node.js の fs や path モジュールを使った保存処理**
   - Electron の `ipcRenderer` / `ipcMain` で React と通信
   - OS のダイアログ（`dialog.showOpenDialog`）を使って保存先指定
2. **保存パスを API に渡す仕組みを Electron 内で制御**
   - ユーザーが選んだ保存ディレクトリを `fetch` で API へ送信

### 🧩 フェーズ 4：パッケージングと本番配布（Windows / macOS 対応）

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

### ffmpeg のライセンス問題

- [参考](https://qiita.com/JuvenileTalk9/items/e857b9a62b447cc725e3)
- GPL 2.0+
  - アプリ全体が GPL 準拠(ソースコード公開)
- LGPL 2.1+
  - 商用利用可能。アプリ本体がクローズドで OK。ffmpeg を改変して再配布するならソースコード公開必要
- 開発や検証段階では GPL でいいかもしれないが、本番環境では LGPL ライセンスを使いたい
  - 最悪どうしても、となったら GPL 版使って全公開する構え
- パッケージに含まれる GPL ライセンスのライブラリやエンコーダ
  - `libx264`(H.264 エンコーダ)
  - `libx265`(H.265)
  - `libfdk_aac`(高品質 AAC)
  - `OpenSSL`(暗号化ライブラリ)
  - LGPL で利用するためにはこれらは除外する必要がある
    - `libx264`は代替版の`OpenH264`というバイナリが cisco から公開されているのでそれを使う
- 使って良い LGPL または自由ライセンスのライブラリ
  - `libvpx`(VP8/VP9: Google の自由ライセンス)
  - `libopus`(Opus 音声: BSD)
  - `openh264`(Cisco: BSD, ⭐️ 要同梱通知)
    - [OpenH264](http://github.com/cisco/openh264)
  - `GnuTLS`(GNU C ライブラリ: LGPL, https通信用)
- LGPL 版か確認する方法
  - **`ffmpeg -version`の標準出力の中に`--enable-gpl`が無いこと**
- LGPL 版は自前ビルドが安牌とのことなので、そうする([Dockerfile.backend](docker/Dockerfile.backend) を参照)

#### M1 チップの Mac でビルドする場合の注意

- Docker イメージ（たとえば debian:bullseye）が amd64 向けなのに、ホスト（Mac）は arm64（Apple Silicon）
- そのままだと gcc で失敗するが、Apple Silicon Mac では Rosetta 2 の仮想化により amd64 コンテナをビルド・実行できる
- 対応しているか確認

  - Rosetta 2 がインストールされていること（M1/M2 では通常デフォルトで OK）
    ````s
        # Rosetta2 install する場合
        $ softwareupdate --install-rosetta
        ```
    ````
  - docker buildx の default ビルダーが linux/amd64 をサポートしていること（していなければビルダー作成が必要）

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
  - `docker compose build`
    - MacOSのM1 チップで amd64 向けの Docker イメージをビルドする場合は、`--platform=linux/amd64` オプションをつける必要がある
    - `docker compose build --platform=linux/amd64`
  - `unknown flag: --platform`とおこられるとき
    - `docker compose` が古いか何かでサポートされていない構文扱いになる
    - 代わりに`docker-compose.yml`で platform 指定する
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
      - docker.desktop > Settings > Docker Engine の json を修正し`Apply&Restart`
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
          "features": {
            "buildkit": true
          }
        }
        ```
  - それでもおこられる -> 結局原因わからず
    - 直接ビルドコマンドを叩く -> Success!!!!!
    ```s
    $ docker buildx build --platform linux/amd64 -t yt-dlp-gui:latest -f ./docker/Dockerfile.backend .
    ```
  - ビルド時間: 10 分くらい(s)
- ffmpeg のライブラリがリンクされているか確認する方法
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

### CORS 対応

- フロントとバックエンドのサーバ同士の通信で CORS 制限がかかってしまった。
  フロントからのリクエストを許可するようバックエンドの FastAPI で設定をいれた
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

## Other
### VScodeのcopilotによるコード補完
- Copilotが動くと重たい&補完が邪魔なときがあるため無効化する方法をメモ
- [Visual Studio Codeで、GitHub Copilotを無効化(Disable)する方法](https://www.crossroad-tech.com/entry/GitHubCopilot_disable#google_vignette)