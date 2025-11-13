// app/components/TradeInterface.tsx
// useStateやonClickなどを担当するコンポーネント

"use client";

import { useState, useEffect } from 'react';
import { PriceChart } from './PriceChart';

// APIから返ってくる取引履歴の「型」
interface Transaction {
  id: number;
  pair: string;
  trade_type: string;
  amount: number;
  price: number;
  timestamp: string; 
}

// チャートデータの「型」
interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function TradeInterface() {
  // 取引履歴のリストを保持する状態
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // チャートデータを保持する状態
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true); // ローディング状態

  // バックエンドAPIのURL
  const API_URL = "/api/proxy";

  // データをまとめて取得する関数
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 両方のAPIを並行して呼び出す
      const [chartRes, txRes] = await Promise.all([
        fetch(`${API_URL}/daily-chart`), // ステップ2で新設したエンドポイント
        fetch(`${API_URL}/transactions`)
      ]);

      if (!chartRes.ok) throw new Error("Failed to fetch chart data");
      if (!txRes.ok) throw new Error("Failed to fetch transactions");

      const chartData: ChartData[] = await chartRes.json();
      const txData: Transaction[] = await txRes.json();

      setChartData(chartData);
      setTransactions(txData);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
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
      fetchData(); 
    } catch (error) {
      console.error(error);
    }
  };

  // ページ読み込み時に取引履歴を1回だけ取得
  useEffect(() => {
    fetchData();
  }, []); // 空の配列は「マウント時に1回だけ実行」を意味

  return (
    <div>

      {/* データがある場合のみチャートを表示 */}
      {isLoading ? (
        <p>チャート読込中</p>
      ) : (
        <PriceChart data={chartData} />
      )}

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