# backend/schemas.py

from pydantic import BaseModel
from datetime import datetime

# ベースとなるスキーマ (共通部分)
class TransactionBase(BaseModel):
    pair: str
    trade_type: str  # "buy" or "sell"
    amount: float
    price: float

# データ作成時に使用するスキーマ (リクエスト用)
class TransactionCreate(TransactionBase):
    pass  # ベースと同じ

# データを読み取る時に使用するスキーマ (レスポンス用)
class Transaction(TransactionBase):
    id: int
    timestamp: datetime

    # ORMモードを有効にする (DBモデルをPydanticモデルに変換するため)
    class Config:
        orm_mode = True