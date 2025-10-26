"use client"; // ブラウザ側で動作させるために必要

import { useEffect, useState } from 'react';

export default function Home() {
  // 取得したデータを保存するための状態（今はまだ使わない）
  const [data, setData] = useState(null);
  // ローディング状態を管理するための状態（今はまだ使わない）
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // APIキーを環境変数から読み込む
    const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
    
    // Alpha VantageのAPIエンドポイント (例: USD/JPYの日足データ)
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=USDJPY&apikey=${apiKey}`;

    const fetchData = async () => {
      try {
        const response = await fetch(url);
        const jsonData = await response.json();
        
        // ★重要★ 取得したデータをブラウザのコンソールに出力
        console.log('APIから取得したデータ:', jsonData);
        
        setData(jsonData); // データを状態に保存
      } catch (error) {
        console.error('データの取得に失敗しました:', error);
      } finally {
        setLoading(false); // ローディング完了
      }
    };

    fetchData();
  }, []); // [] 空の配列を指定すると、この処理はページが最初に読み込まれた時に1回だけ実行されます

  return (
    <main>
      <h1>為替シミュレーションアプリ</h1>
      <p>
        {loading ? 'データを読み込み中です...' : 'データ取得完了（コンソールを確認してください）'}
      </p>
    </main>
  );
}