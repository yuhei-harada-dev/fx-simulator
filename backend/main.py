# backend/main.py (修正後)

from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import models
from database import engine, get_db

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
        db.execute(text("SELECT 1"))
        return {"message": "Hello World. Database connection is successful."}
    except Exception as e:
        # 接続失敗時
        return {"message": "Hello World. Database connection failed.", "error": str(e)}