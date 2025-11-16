// app/components/TradeInterface.tsx
// useStateやonClickなどを担当するコンポーネント

"use client";

import { useState, useEffect, useRef } from 'react';
import { PriceChart } from './PriceChart';

// APIから返ってくる取引履歴の型
interface Transaction {
  id: number;
  pair: string;
  trade_type: string;
  amount: number;
  price: number;
  timestamp: string; 
}

// チャートデータの型
interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

// ポジションの型
interface Position {
  trade_type: 'buy' | 'sell';
  amount: number;
  price: number;
  id: number; //決済時に使う元の取引ID
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

  const [isLoading, setIsLoading] = useState(true); // ローディング状態

  // 現在のレート・ポジション・損益　を管理する
  const [currentRate, setCurrentRate] = useState<number>(0);
  const [position, setPosition] = useState<Position | null>(null);
  //const [position, setPosition] = useState<Position | null>({ trade_type: 'buy', amount: 10000, price: 150.00, id: 1 }) //テスト用ダミーデータ
  const [profitOrLoss, setProfitOrLoss] = useState<number>(0);


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

      // 最新のレート（チャートの最後の終値）をセット
      if (initialData.length > 0) {
        setCurrentRate(initialData[initialData.length - 1].close);
      }

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

  // BUYボタンが押された時の処理
  const handleBuy = async () => {
    // シミュレーション中でない、または既にポジションがある場合は何もしない
    if (!isSimulating || position) return; 

    const tradeAmount = 10000; // 1万通貨

    const newTransactionData = {
      pair: "USD/JPY",
      trade_type: "buy",
      amount: tradeAmount,
      price: currentRate, // 現在のレートで約定
      profit: null,
      opening_trade_id: null
    };

    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTransactionData),
      });

      if (!res.ok) throw new Error("Failed to create transaction");

      // DBに保存成功したら、レスポンスからDB上のデータを取得
      const savedTx: Transaction = await res.json();

      // フロントエンドのPosition Stateを更新
      setPosition({
        trade_type: 'buy',
        amount: savedTx.amount,
        price: savedTx.price,
        id: savedTx.id // DBのIDを控えておく（決済時に使うため）
      });

      // 取引履歴リストを更新
      fetchTransactions();

    } catch (error) {
      console.error(error);
    }
  };

  // SELLボタンが押された時の処理
  const handleSell = async () => {
    // シミュレーション中でない、または既にポジションがある場合は何もしない
    if (!isSimulating || position) return; 

    const tradeAmount = 10000;

    const newTransactionData = {
      pair: "USD/JPY",
      trade_type: "sell",
      amount: tradeAmount,
      price: currentRate,
      profit: null,
      opening_trade_id: null
    };

    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTransactionData),
      });

      if (!res.ok) throw new Error("Failed to create transaction");

      const savedTx: Transaction = await res.json();

      // フロントエンドのPosition Stateを更新
      setPosition({
        trade_type: 'sell',
        amount: savedTx.amount,
        price: savedTx.price,
        id: savedTx.id 
      });

      // 取引履歴リストを更新
      fetchTransactions();

    } catch (error) {
      console.error(error);
    }
  };

  ////

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

        // currentRateを1秒ごとに更新する処理
        const nextDataPoint = fullChartData[prevIndex]; // これから追加するデータ
        if (nextDataPoint) {
          setDisplayChartData(fullChartData.slice(0, nextIndex));
          setCurrentRate(nextDataPoint.close); // レートを更新
        }

        return nextIndex;
      });
    }, 1000); // 1秒ごとに更新
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

  // currentRate か position が変更されるたびに、損益を自動計算する
  useEffect(() => {
    if (!position) {
      setProfitOrLoss(0);
      return;
    }

    let pips = 0;
    if (position.trade_type === 'buy') {
      // (現在のレート - エントリーレート)
      pips = currentRate - position.price;
    } else {
      // (エントリーレート - 現在のレート)
      pips = position.price - currentRate;
    }

    // 1万通貨の場合 (USD/JPYは 1pips = 100円)
    const calculatedProfit = pips * position.amount; 

    setProfitOrLoss(calculatedProfit);

  }, [currentRate, position]); // currentRate か position が変わるたびに実行

  return (
    <div>

      {/* チャートと操作ボタン */}
      {isLoading ? (
        <p>チャート読込中</p>
      ) : (
        <>
          <PriceChart data={displayChartData} />

          <div>
            <h3>シミュレーション情報</h3>
            <p>現在のレート: {currentRate.toFixed(3)}</p>
            {position ? (
              <div>
                <p>ポジション: {position.trade_type} @ {position.price}</p>
                <p>損益: {profitOrLoss.toFixed(0)} 円</p>
              </div>
            ) : (
              <p>ポジション: なし</p>
            )}
          </div>

          <div>
            <button onClick={startSimulation} disabled={isSimulating}>
              シミュレーション開始
            </button>
            <button onClick={stopSimulation} disabled={!isSimulating}>
              停止
            </button>
            
            <button 
              onClick={handleBuy} 
              disabled={!isSimulating || !!position} // シミュ中 かつ ポジションが無い 時だけ押せる
              style={{ backgroundColor: '#26a69a', color: 'white', marginLeft: '10px' }}
            >
              BUY
            </button>
            <button 
              onClick={handleSell} 
              disabled={!isSimulating || !!position} // シミュ中 かつ ポジションが無い 時だけ押せる
              style={{ backgroundColor: '#ef5350', color: 'white', marginLeft: '5px' }}
            >
              SELL
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