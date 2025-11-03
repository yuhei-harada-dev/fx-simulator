// app/PriceChart.tsx
// チャートを描画を担当するコンポーネント

"use client";

import {
  createChart,     // 実際にチャートを作る関数
  ColorType,       // 色の設定に関する型(たとえば背景色を指定できる)
  IChartApi,       // チャート全体を操作するための型
  ISeriesApi,      // ローソク足を操作するための型
  CandlestickData, // ローソク足1本分のデータの型
} from 'lightweight-charts';

import {
  useEffect, //コンポーネントがブラウザに表示された後に実行
  useRef //HTMLの特定の部品（例: <div>）に目印をつけて、直接操作するのに使用する
} from 'react';

// このコンポーネントが外部から受け取るデータ(props)の型を定義
interface ChartProps {
  data: {
    time: string; // 時間 (例:"2025-10-28")
    open: number; // 始値
    high: number; // 高値
    low: number;  // 安値
    close: number // 終値
  }[];
}

export const PriceChart = ({ data }: ChartProps) => {
  // チャートを描画するDOM要素の参照を作成
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // チャートの初期化
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400, // 高さ固定
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' }, // 背景色
        textColor: '#333', // テキスト色
      },
      grid: {
        vertLines: { color: '#e1e1e1' }, // 垂直グリッド線
        horzLines: { color: '#e1e1e1' }, // 水平グリッド線
      },
    });

    // ローソク足シリーズを追加
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',   // 陽線
      downColor: '#ef5350', // 陰線
      borderDownColor: '#ef5350',
      borderUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      wickUpColor: '#26a69a',
    });

    // データをチャートにセット この瞬間にデータがチャート上にローソク足として描画される
    candlestickSeries.setData(data);

    // 画面サイズが変わったときに、チャートの幅も更新する処理
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    // クリーンアップ関数 (重要)
    // コンポーネントが不要になったら、チャートとイベントリスナーを破棄
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]); // data が変更されたらチャートを再描画

  // 実際にチャートが描画されるコンテナ(div)
  return (
    <div
      ref={chartContainerRef}
      style={{ width: '100%', position: 'relative' }}
    />
  );
};