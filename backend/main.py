# backend/main.py

from fastapi import FastAPI, Depends, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

import httpx
import os

import models
import crud
import schemas
from database import engine, get_db

# FastAPIのインスタンスを作成
app = FastAPI()

# 許可するオリジン（フロントエンドURL）
origins = [
    "http://localhost:3000",
    "https://fx-simulator.vercel.app",
    "*" # Vercel Proxyからのアクセスのために追加
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # すべてのHTTPメソッドを許可
    allow_headers=["*"], # すべてのHTTPヘッダーを許可
)

# APIRouterのインスタンスを作成
router = APIRouter()

# ルートURL ( / ) へのGETリクエストに応答する
# DB接続をテストするために、セッション（db）を引数で受け取る
@router.get("/")
async def root(db: Session = Depends(get_db)):
    
    # DB接続テスト (簡単なクエリを発行)
    try:
        db.execute(text("SELECT 1"))
        return {"message": "Hello World. Database connection is successful."}
    except Exception as e:
        return {"message": "Hello World. Database connection failed.", "error": str(e)}

# テスト用: DB接続は行わず常に{"status": "ok"}を返す
@router.get("/health")
async def health_check():
    return {"status": "ok"}

# Alpha Vantageから日足データを取得してフロントエンドに中継する
@router.get("/daily-chart")
async def get_daily_chart_data():
    API_KEY = os.environ.get("ALPHA_VANTAGE_API_KEY")
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API key is not configured")

    url = f"https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=USD&to_symbol=JPY&outputsize=full&apikey={API_KEY}"
    
    # httpxを使って非同期でAPIリクエスト
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(url)
            res.raise_for_status() # 200番台以外のステータスコードなら例外を発生
            
            data = res.json()
            
            # データ加工 (app/page.tsxのgetForexDataと同じロジック)
            time_series = data.get('Time Series FX (Daily)')
            if not time_series:
                return [] # データがない場合は空配列を返す

            formatted_data = sorted(
                (
                    {
                        "time": date,
                        "open": float(day_data["1. open"]),
                        "high": float(day_data["2. high"]),
                        "low": float(day_data["3. low"]),
                        "close": float(day_data["4. close"]),
                    }
                    for date, day_data in time_series.items()
                ),
                key=lambda x: x["time"], # 日付順にソート
            )
            return formatted_data

        except httpx.HTTPStatusError as exc:
            # 外部APIがエラーを返した場合
            return {"message": "Failed to fetch data from Alpha Vantage", "error": str(exc)}
        except Exception as e:
            # その他のエラー
            return {"message": "An error occurred", "error": str(e)}

# Create
@router.post("/transactions", response_model=schemas.Transaction)
def create_new_transaction(
    transaction: schemas.TransactionCreate, 
    db: Session = Depends(get_db)
):
    """
    新しい取引（POSTリクエスト）を受け取り、DBに保存するAPI
    """
    return crud.create_transaction(db=db, transaction=transaction)

# Read
@router.get("/transactions", response_model=List[schemas.Transaction])
def read_transactions(
    skip: int = 0, 
    limit: int = 1000, # 取得件数を増やす (またはソートを後で実装)
    db: Session = Depends(get_db)
):
    """
    DBから取引履歴のリストを取得するAPI
    """
    transactions = crud.get_transactions(db, skip=skip, limit=limit)
    # 最新のものが先頭に来るようにサーバーサイドでソート
    return sorted(transactions, key=lambda tx: tx.timestamp, reverse=True)

# Delete All
@router.delete("/transactions")
def delete_all_transactions(db: Session = Depends(get_db)):
    """
    すべての取引履歴をDBから削除するAPI
    """
    return crud.delete_all_transactions(db=db)

# appにルーターを登録
app.include_router(router)