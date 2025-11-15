// app/components/TradeInterface.tsx
// useStateやonClickなどを担当するコンポーネント

"use client";

import { useState, useEffect, useRef } from 'react';
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

  // シミュレーション用
  const [fullChartData, setFullChartData] = useState<ChartData[]>([]); // 全データ
  const [displayChartData, setDisplayChartData] = useState<ChartData[]>([]); // 描画用データ
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentDateIndex, setCurrentDateIndex] = useState(0); // 現在のデータインデックス
  const simulationInterval = useRef<NodeJS.Timeout | null>(null); // Interval ID

  // チャートデータを保持する状態
  // const [chartData, setChartData] = useState<ChartData[]>([]);
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

      setFullChartData(data); // 全データをここに保持
      const initialData = data.slice(0, 4000); // 最初は例えば4000日分だけ表示する
      setDisplayChartData(initialData);
      setCurrentDateIndex(4000); // 次は4000番目から開始

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

// シミュレーション開始/停止ロジック
  const startSimulation = () => {
    if (isSimulating || currentDateIndex >= fullChartData.length) return;

    setIsSimulating(true);

    simulationInterval.current = setInterval(() => {
      setCurrentDateIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= fullChartData.length) {
          stopSimulation(); // データが終わったら停止
          return prevIndex;
        }

        // 描画用データに次の1日分を追加
        setDisplayChartData(fullChartData.slice(0, nextIndex));
        return nextIndex;
      });
    }, 200); // 0.2秒ごとに更新
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
    }
  };

  // 停止ボタンが押されたときや、コンポーネントが消えるときのための処理
  useEffect(() => {
    return () => stopSimulation(); // クリーンアップ
  }, []);

  // ページ読み込み時にチャートデータと取引履歴を取得
  useEffect(() => {
    fetchChartData();
    fetchTransactions();
  }, []); // 空の配列は1回だけ実行を意味する

  return (
    <div>

      {/* チャートと操作ボタン */}
      {isLoading ? (
        <p>チャート読込中</p>
      ) : (
        <>
          <PriceChart data={displayChartData} />
          <div>
            <button onClick={startSimulation} disabled={isSimulating}>
              シミュレーション開始
            </button>
            <button onClick={stopSimulation} disabled={!isSimulating}>
              停止
            </button>
          </div>
        </>
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