# backend/entrypoint.sh
# コンテナが起動したときにAlembicを実行後、FastAPIを実行する起動スクリプト

# データベースのマイグレーション (テーブル作成)
alembic upgrade head

# FastAPIサーバーを起動
exec uvicorn main:app --host 0.0.0.0 --port 8000