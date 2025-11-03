# backend/main.py

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

import models
import crud
import schemas
from database import engine, get_db

# FastAPIのインスタンスを作成
app = FastAPI()

# 許可するオリジン（フロントエンドURL）
origins = [
    "http://localhost:3000",
    # (将来的に本番のフロントエンドURLなどをここに追加予定)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # すべてのHTTPメソッドを許可
    allow_headers=["*"], # すべてのHTTPヘッダーを許可
)

# API エンドポイント
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
    
# Create
@app.post("/transactions/", response_model=schemas.Transaction)
def create_new_transaction(
    transaction: schemas.TransactionCreate, 
    db: Session = Depends(get_db)
):
    """
    新しい取引（POSTリクエスト）を受け取り、DBに保存するAPI
    """
    return crud.create_transaction(db=db, transaction=transaction)


# Read
@app.get("/transactions/", response_model=List[schemas.Transaction])
def read_transactions(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """
    DBから取引履歴のリストを取得するAPI
    """
    transactions = crud.get_transactions(db, skip=skip, limit=limit)
    return transactions
