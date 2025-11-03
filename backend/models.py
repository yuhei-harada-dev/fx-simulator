# backend/models.py

from sqlalchemy import Column, Integer, String, Float, DateTime, func
from database import Base # アクション1で作成した Base をインポート

class Transaction(Base):
    # このモデル（クラス）が、'transactions' というテーブル名に対応することを指定
    __tablename__ = "transactions"

    # カラムの定義
    id = Column(Integer, primary_key=True, index=True) # 固有のID
    pair = Column(String, index=True) # 通貨ペア (例: "USD_JPY")
    trade_type = Column(String) # "buy" または "sell"
    amount = Column(Float) # 取引量
    price = Column(Float) # 取引価格
    # default=func.now() で、作成時に自動で現在時刻を挿入
    timestamp = Column(DateTime(timezone=True), server_default=func.now())