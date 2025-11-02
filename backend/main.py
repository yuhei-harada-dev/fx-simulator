# backend/main.py (修正後)

from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text # ◀◀◀ 1. text をインポートする
import models
from database import engine, get_db

# 2. アプリケーション起動時に、models.py で定義した
#    すべてのテーブルを (もし存在しなければ) データベース内に作成する
models.Base.metadata.create_all(bind=engine)

# FastAPIのインスタンスを作成
app = FastAPI()

@app.get("/")
async def root(db: Session = Depends(get_db)):
    """
    ルートURL ( / ) へのGETリクエストに応答する
    DB接続をテストするために、セッション（db）を引数で受け取る
    """
    
    # DB接続テスト (簡単なクエリを発行)
    try:
        # ◀◀◀ 3. text() で "SELECT 1" を囲む
        db.execute(text("SELECT 1"))
        return {"message": "Hello World. Database connection is successful."}
    except Exception as e:
        # 接続失敗時
        return {"message": "Hello World. Database connection failed.", "error": str(e)}