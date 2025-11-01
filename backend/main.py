from fastapi import FastAPI

# FastAPIのインスタンスを作成
app = FastAPI()

@app.get("/")
async def root():
    """
    ルートURL ( / ) へのGETリクエストに応答する
    """
    return {"message": "Hello Docker"}