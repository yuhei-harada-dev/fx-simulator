# backend/database.py

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# .envファイルから環境変数を読み込む
# (docker-compose.ymlのenvironmentで設定したので厳密には不要だが、
# ローカルでのテスト時にも役立つため入れておくと堅牢)
load_dotenv()

# docker-compose.yml の environment で設定した DATABASE_URL を読み込む
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL is None:
    raise ValueError("DATABASE_URL environment variable is not set.")

# create_engine: データベースへの「接続情報（エンジン）」を作成
engine = create_engine(DATABASE_URL)

# SessionLocal: データベースとの「会話（セッション）」を開始するためのクラス
# (autocommit=False: 自動コミットOFF, autoflush=False: 自動反映OFF)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base: データベースのテーブル定義（モデル）が継承する親クラス
Base = declarative_base()

# DBセッションを取得するためのヘルパー関数
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()