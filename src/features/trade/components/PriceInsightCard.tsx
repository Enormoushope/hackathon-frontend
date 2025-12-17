import type { PriceInsight, RiskAxis } from '@/features/trade/hooks/usePurchaseItem';

type Props = {
  priceInsight: PriceInsight | null;
  riskAxes: RiskAxis[];
  riskOverall: number;
  insightLoading: boolean;
  aiRiskLoading: boolean;
  onCheckPriceInsight: () => void;
  onCheckAiRisk: () => void;
};

export const PriceInsightCard = ({ priceInsight, riskAxes, riskOverall, insightLoading, aiRiskLoading, onCheckPriceInsight, onCheckAiRisk }: Props) => (
  <div className="bg-indigo-50 border-2 border-indigo-200 p-4 rounded-xl shadow-sm">
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-indigo-700">価格インサイト（Gemini）</h3>
      <button
        onClick={onCheckPriceInsight}
        disabled={insightLoading}
        className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-full font-bold hover:bg-indigo-700 disabled:bg-gray-400"
      >
        {insightLoading ? '分析中...' : '妥当性をチェック'}
      </button>
    </div>
    {priceInsight && (
      <div className="mt-3 text-sm">
        <div className="flex justify-between">
          <span>推奨価格:</span>
          <span className="font-bold text-lg text-indigo-700">¥{priceInsight.suggested.toLocaleString()}</span>
        </div>
        <div className="text-gray-700 mt-1">{priceInsight.reasoning}</div>
        <div className="text-xs text-gray-600 mt-2">参考価格帯: ¥{priceInsight.range.min.toLocaleString()} ～ ¥{priceInsight.range.max.toLocaleString()}</div>
        <div className="mt-3">
          {priceInsight.verdict === 'fair' && <span className="px-2 py-1 bg-green-100 text-green-800 rounded">妥当</span>}
          {priceInsight.verdict === 'high' && <span className="px-2 py-1 bg-red-100 text-red-800 rounded">高値</span>}
          {priceInsight.verdict === 'low' && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">安値</span>}
        </div>

        <div className="mt-4 bg-slate-50 border border-slate-200 p-3 rounded">
          <div className="flex items-center justify-between">
            <div className="font-semibold">リスク予報（多軸）</div>
            <div className="text-sm">
              総合: <span className={riskOverall > 60 ? 'text-red-600' : riskOverall > 35 ? 'text-amber-600' : 'text-emerald-600'}>{riskOverall}</span> / 100
            </div>
          </div>
          <div className="mt-2 mb-2 text-right">
            <button
              onClick={onCheckAiRisk}
              disabled={aiRiskLoading}
              className="px-3 py-1 bg-rose-600 text-white text-xs rounded-full font-bold hover:bg-rose-700 disabled:bg-gray-400"
            >
              {aiRiskLoading ? '診断中…' : 'リスクを診断する'}
            </button>
          </div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {riskAxes.map((ax, i) => (
              <div key={i} className="p-2 rounded border border-slate-200">
                <div className="text-sm text-slate-700">{ax.label}</div>
                <div className="mt-1 h-2 bg-slate-200 rounded">
                  <div
                    className={`h-2 rounded ${ax.score > 60 ? 'bg-red-500' : ax.score > 35 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, Math.max(0, ax.score))}%` }}
                  />
                </div>
                {ax.hint && <div className="mt-1 text-xs text-slate-500">{ax.hint}</div>}
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-600">※ 価格軸はGemini返却レンジに連動しています。</div>
        </div>
      </div>
    )}
  </div>
);
