// app/components/TradeInterface.tsx
// useStateやonClickなどを担当するコンポーネント

"use client";

import { useState, useEffect } from 'react';

// APIから返ってくる取引履歴の「型」
interface Transaction {
  id: number;
  pair: string;
  trade_type: string;
  amount: number;
  price: number;
  timestamp: string; 
}

export function TradeInterface() {
  // 取引履歴のリストを保持する状態
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // バックエンドAPIのURL
  const API_URL = "/api/proxy";

  // 取引履歴を取得する (GET) 関数
  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API_URL}/transactions`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data: Transaction[] = await res.json();
      setTransactions(data);
    } catch (error) {
      console.error(error);
    }
  };

  // ダミー取引を作成する (POST) 関数
  const handleCreateTransaction = async () => {
    try {
      const newTransactionData = {
        pair: "USD/JPY",
        trade_type: "buy",
        amount: 1000,
        price: 150.00 + Math.random() 
      };

      const res = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTransactionData),
      });

      if (!res.ok) throw new Error("Failed to create transaction");

      // POSTが成功したら、リストを再取得して画面を更新
      fetchTransactions(); 
    } catch (error) {
      console.error(error);
    }
  };

  // ページ読み込み時に取引履歴を1回だけ取得
  useEffect(() => {
    fetchTransactions();
  }, []); // 空の配列は「マウント時に1回だけ実行」を意味

  return (
    <div>
      <hr />
      <h2>API 接続テスト</h2>
      <button onClick={handleCreateTransaction}>
        ダミー取引作成 (POST)
      </button>

      <h3>取引履歴 (GET)</h3>
      <ul>
        {transactions.length > 0 ? (
          transactions.map((tx) => (
            <li key={tx.id}>
              {tx.timestamp}: {tx.trade_type} {tx.pair} @ {tx.price} (ID: {tx.id})
            </li>
          ))
        ) : (
          <li>取引履歴はありません</li>
        )}
      </ul>
    </div>
  );
}