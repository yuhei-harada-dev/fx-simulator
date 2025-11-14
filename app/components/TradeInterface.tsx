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

  // チャートデータを取得する関数
  const fetchChartData = async () => {
    setIsLoading(true);
    try {
      const chartRes = await fetch(`${API_URL}/daily-chart`);
      if (!chartRes.ok) throw new Error("Failed to fetch chart data");
      const data: ChartData[] = await chartRes.json();
      setChartData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 取引履歴を取得する関数
  const fetchTransactions = async () => {
    try {
      const txRes = await fetch(`${API_URL}/transactions`);
      if (!txRes.ok) throw new Error("Failed to fetch transactions");
      const txData: Transaction[] = await txRes.json();
      setTransactions(txData);
    } catch (error) {
      console.error(error);
    }
  };

  // ダミー取引を作成する関数 (POST)
  const handleCreateTransaction = async () => {
    try {
      const newTransactionData = {
        pair: "USD/JPY",
        trade_type: "buy",
        amount: 10000,
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

      fetchTransactions();

    } catch (error) {
      console.error(error);
    }
  };

  // ページ読み込み時にチャートデータと取引履歴を取得
  useEffect(() => {
    fetchChartData();
    fetchTransactions();
  }, []); // 空の配列は1回だけ実行を意味する

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