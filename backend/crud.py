# backend/crud.py

from sqlalchemy.orm import Session

import models
import schemas


def create_transaction(db: Session, transaction: schemas.TransactionCreate) -> models.Transaction:
    """
    新しい取引データをDBに保存する
    """
    # Pydanticモデル(transaction) から SQLAlchemyモデル(db_transaction) に変換
    # Pydantic v2 の .model_dump() を使用
    db_transaction = models.Transaction(**transaction.model_dump())

    # DBセッションに追加（まだ保存されない）
    db.add(db_transaction)

    # DBにコミット（ここで初めて保存が実行される）
    db.commit()

    # DBから最新の状態（idやtimestampなど）を取得して返す
    db.refresh(db_transaction)

    return db_transaction


def get_transactions(db: Session, skip: int = 0, limit: int = 100) -> list[models.Transaction]:
    """
    DBから取引履歴を（指定された件数だけ）取得する
    """
    return db.query(models.Transaction).offset(skip).limit(limit).all()
