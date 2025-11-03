// app/page.tsx

import { PriceChart } from './components/PriceChart';
import { TradeInterface } from './components/TradeInterface';

// Alpha VantageのAPIから返ってくるデータの型
interface AlphaVantageData {
  'Time Series FX (Daily)': {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
    };
  };
}

// データを取得する非同期関数
async function getForexData() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=USD&to_symbol=JPY&apikey=${apiKey}`;
  
  const res = await fetch(url, { cache: 'no-store' }); // SSRのためにキャッシュを無効化
  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }
  const data: AlphaVantageData = await res.json();

  // データ加工
  const timeSeries = data['Time Series FX (Daily)'];
  if (!timeSeries) {
    return []; // データがない場合は空配列を返す
  }

  // APIのキー(日付)をソートして、チャートライブラリの形式に変換
  const formattedData = Object.keys(timeSeries)
    .sort() // 日付順にソート
    .map((date) => {
      const dayData = timeSeries[date];
      return {
        time: date, // 'YYYY-MM-DD'
        open: parseFloat(dayData['1. open']),
        high: parseFloat(dayData['2. high']),
        low: parseFloat(dayData['3. low']),
        close: parseFloat(dayData['4. close']),
      };
    });
  
  return formattedData;
}


// ページ本体 (Server Component)
export default async function Home() {
  
  // サーバーサイドでデータを取得
  const chartData = await getForexData();

  return (
    <main>
      <h1>USD/JPY 為替チャート</h1>
      
      {/* 取得したデータをクライアントコンポーネントに渡す */}
      <PriceChart data={chartData} />
      <TradeInterface />
      
    </main>
  );
}