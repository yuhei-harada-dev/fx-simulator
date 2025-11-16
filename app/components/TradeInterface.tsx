// app/components/TradeInterface.tsx
// useStateやonClickなどを担当するコンポーネント

"use client";

// useCallback を React からインポート
import { useState, useEffect, useRef, useCallback } from 'react';
import { PriceChart } from '@/app/components/PriceChart';

// APIから返ってくる取引履歴の型
interface Transaction {
  id: number;
  pair: string;
  trade_type: string;
  amount: number;
  price: number;
  timestamp: string; 
  profit: number | null;
  opening_trade_id: number | null;
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
  trade_type: 'BID' | 'ASK'; // 'sell' | 'buy'
  amount: number;
  price: number;
  id: number; //決済時に使う元の取引ID
}

// 口座残高の初期値
const INITIAL_ACCOUNT_BALANCE = 1000000;

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

  // 現在のレート・ポジション・損益・口座残高 を管理する
  const [currentRate, setCurrentRate] = useState<number>(0);
  const [position, setPosition] = useState<Position | null>(null);
  const [profitOrLoss, setProfitOrLoss] = useState<number>(0);
  const [accountBalance, setAccountBalance] = useState<number>(INITIAL_ACCOUNT_BALANCE); // 口座残高


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
      
      // 注意: 4000件より少ないとシミュレーションが開始しない
      const initialDayCount = 4000; 
      const initialData = data.slice(0, initialDayCount);
      setDisplayChartData(initialData);
      setCurrentDateIndex(initialDayCount); 

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
      setTransactions(txData); // バックエンドでソート済み
    } catch (error) {
      console.error(error);
    }
  };


  // ASK(買)ボタンが押された時の処理
  const handleBuy = async () => {
    if (!isSimulating || position) return; 

    const tradeAmount = 10000; 

    const newTransactionData = {
      pair: "USD/JPY",
      trade_type: "ASK",
      amount: tradeAmount,
      price: currentRate,
      profit: null,
      opening_trade_id: null
    };

    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransactionData),
      });
      if (!res.ok) throw new Error("Failed to create transaction");
      const savedTx: Transaction = await res.json();
      
      setPosition({
        trade_type: 'ASK',
        amount: savedTx.amount,
        price: savedTx.price,
        id: savedTx.id 
      });
      
      fetchTransactions();
    } catch (error) {
      console.error(error);
    }
  };

  // BID(売)ボタンが押された時の処理
  const handleSell = async () => {
    if (!isSimulating || position) return; 

    const tradeAmount = 10000;
    const newTransactionData = {
      pair: "USD/JPY",
      trade_type: "BID",
      amount: tradeAmount,
      price: currentRate,
      profit: null,
      opening_trade_id: null
    };

    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransactionData),
      });
      if (!res.ok) throw new Error("Failed to create transaction");
      const savedTx: Transaction = await res.json();

      setPosition({
        trade_type: 'BID',
        amount: savedTx.amount,
        price: savedTx.price,
        id: savedTx.id 
      });
      
      fetchTransactions();
    } catch (error) {
      console.error(error);
    }
  };

  // 全決済ロジック
  const handleClosePosition = async () => {
    if (!isSimulating || !position) return;

    const closingTradeType = position.trade_type === 'ASK' ? 'BID' : 'ASK';

    const newTransactionData = {
      pair: "USD/JPY",
      trade_type: closingTradeType,
      amount: position.amount,
      price: currentRate, 
      profit: profitOrLoss, // 確定損益
      opening_trade_id: position.id 
    };

    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransactionData),
      });
      if (!res.ok) throw new Error("Failed to close transaction");

      // 口座残高に損益を反映
      setAccountBalance(prevBalance => prevBalance + profitOrLoss);
      // フロントエンドの状態をリセット
      setPosition(null);
      
      fetchTransactions();
    } catch (error) {
      console.error(error);
    }
  };
  
  // 取引履歴リセットロジック
  const handleResetHistory = async () => {
    // 念のためシミュレーションを停止
    stopSimulation();
    
    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error("Failed to reset transactions");

      // フロントエンドの状態もすべてリセット
      setTransactions([]);
      setPosition(null);
      setProfitOrLoss(0);
      setAccountBalance(INITIAL_ACCOUNT_BALANCE);
      
      // チャートデータを初期状態に戻す (4000件)
      const initialData = fullChartData.slice(0, 4000);
      setDisplayChartData(initialData);
      setCurrentDateIndex(4000);
      if (initialData.length > 0) {
        setCurrentRate(initialData[initialData.length - 1].close);
      }

    } catch (error) {
      console.error(error);
    }
  };

  // シミュレーション停止ロジック (useCallbackで囲む)
  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
    }
  }, []); // 依存配列は空
  
  // シミュレーション開始ロジック (useCallbackで囲む)
  const startSimulation = useCallback(() => {
    if (isSimulating || currentDateIndex >= fullChartData.length) return;

    setIsSimulating(true);

    simulationInterval.current = setInterval(() => {
      setCurrentDateIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= fullChartData.length) {
          stopSimulation(); // データが終わったら停止
          return prevIndex;
        }

        const nextDataPoint = fullChartData[prevIndex]; 
        if (nextDataPoint) {
          setDisplayChartData(fullChartData.slice(0, nextIndex));
          setCurrentRate(nextDataPoint.close); // レートを更新
        }
        return nextIndex;
      });
    }, 1000); // 1秒ごとに更新 (デモ用に早めることも可能)
  }, [isSimulating, currentDateIndex, fullChartData, stopSimulation]); // 依存配列

  // コンポーネントが消えるときのための処理
  useEffect(() => {
    return () => stopSimulation(); // クリーンアップ
  }, [stopSimulation]); // 依存配列に stopSimulation を追加

  // ページ読み込み時にチャートデータと取引履歴を取得
  useEffect(() => {
    fetchChartData();
    fetchTransactions();
  }, []); // 空の配列は1回だけ実行を意味する
  
  // データロード完了後にシミュレーションを自動開始
  useEffect(() => {
    // データロード完了(isLoading: false)
    // fullChartDataにデータ有り
    // まだシミュレーションが開始していない
    if (!isLoading && fullChartData.length > 0 && !isSimulating) {
      startSimulation();
    }
  }, [isLoading, fullChartData, isSimulating, startSimulation]);
  
  // currentRate か position が変更されるたびに、損益を自動計算する
  useEffect(() => {
    if (!position) {
      setProfitOrLoss(0);
      return;
    }

    let pips = 0;
    if (position.trade_type === 'ASK') {
      // (現在のレート - エントリーレート)
      pips = currentRate - position.price;
    } else { // 'BID'
      // (エントリーレート - 現在のレート)
      pips = position.price - currentRate;
    }

    // 1万通貨の場合 (USD/JPYは 1pips(0.01円) = 100円)
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
            <p>口座残高: {accountBalance.toLocaleString()} 円</p>
            <p>現在のレート: {currentRate.toFixed(3)}</p>
            {position ? (
              <div>
                <p>取引数量: 1Lot (10,000通貨)</p>
                <p>ポジション: {position.trade_type} @ {position.price.toFixed(3)}</p>
                <p style={{ color: profitOrLoss >= 0 ? 'green' : 'red' }}>
                  損益: {profitOrLoss.toFixed(0)} 円
                </p>
              </div>
            ) : (
              <div>
                <p>取引数量: 1Lot (10,000通貨)</p>
                <p>ポジション: なし</p>
                <p>損益: なし</p>
              </div>
            )}
          </div>

          <div>
            <button onClick={startSimulation} disabled={isSimulating}
            style={{ backgroundColor:  '#ffb300', color: 'black'}}>
              スタート
            </button>

            <button onClick={stopSimulation} disabled={!isSimulating}
              style={{ backgroundColor:  '#ffb300', color: 'black', marginLeft: '10px'}}
            >
              ストップ
            </button>
            
            <button 
              onClick={handleSell} 
              disabled={!isSimulating || !!position} 
              style={{ backgroundColor: '#ef5350', color: 'white', marginLeft: '10px' }}
            >
              BID(売)
            </button>

            <button 
              onClick={handleClosePosition} 
              disabled={!isSimulating || !position} 
              style={{ backgroundColor: '#ffb300', color: 'black', marginLeft: '10px' }}
            >
              全決済
            </button>
            
            <button 
              onClick={handleBuy} 
              disabled={!isSimulating || !!position} 
              style={{ backgroundColor: '#26a69a', color: 'white', marginLeft: '10px' }}
            >
              ASK(買)
            </button>
          </div>
        </>
      )}

      <hr />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <h3>取引履歴</h3>
        <button 
          onClick={handleResetHistory}
          style={{ backgroundColor: '#888', color: 'white', padding: '2px 8px', fontSize: '12px'}}
        >
          履歴リセット
        </button>
      </div>

      <ul>
        {transactions.length > 0 ? (
          transactions.map((tx) => (
            <li key={tx.id}>
              {/* 日時を日本時間っぽくフォーマット (簡易版) */}
              {new Date(tx.timestamp).toLocaleString('ja-JP')}
              : {tx.trade_type} {tx.pair} @ {tx.price.toFixed(3)} (ID: {tx.id})

              {/* 損益表示 */}
              {tx.profit !== null && (
                <span style={{ color: tx.profit >= 0 ? 'green' : 'red', marginLeft: '10px', fontWeight: 'bold' }}>
                  (損益: {tx.profit.toFixed(0)} 円)
                </span>
              )}
              
            </li>
          ))
        ) : (
          <li>取引履歴はありません</li>
        )}
      </ul>
    </div>
  );
}