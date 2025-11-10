# ベースイメージの指定 (Python 3.11-slim版を使用)
FROM python:3.11-slim

# 作業ディレクトリの指定
# コンテナ内の /app フォルダで作業することを宣言
WORKDIR /app

# 依存関係のインストール
# まず requirements.txt だけを先にコピーする
COPY requirements.txt .

# pip install を実行してライブラリをインストール
# --no-cache-dir オプションで不要なキャッシュを残さない
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードのコピー
# backendフォルダの中身（main.pyなど）をコンテナの /app にコピー
COPY . .

# entrypoint.sh に実行権限を与える
RUN chmod +x ./entrypoint.sh

# コンテナ起動時に実行するコマンドをCMDからENTRYPOINTに変更
ENTRYPOINT ["./entrypoint.sh"]

# コンテナ起動時に実行するコマンド
# uvicorn を本番モードで起動
# --host 0.0.0.0 でコンテナ外部からのアクセスを許可
# --port 8000 で8000番ポートで待機
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]