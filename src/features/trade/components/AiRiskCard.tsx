import type { RiskAxis } from '@/features/trade/hooks/usePurchaseItem';

type Props = {
  aiRisks: string[];
  aiRiskLoading: boolean;
  riskAxes: RiskAxis[];
  riskOverall: number;
  onCheckAiRisk: () => void;
};

export const AiRiskCard = ({ aiRisks, aiRiskLoading, riskAxes, riskOverall, onCheckAiRisk }: Props) => (
  <div className="bg-rose-50 border-2 border-rose-200 p-4 rounded-xl shadow-sm">
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-rose-700">AIリスク診断（Gemini）</h3>
      <button
        onClick={onCheckAiRisk}
        disabled={aiRiskLoading}
        className="px-3 py-1 bg-rose-600 text-white text-sm rounded-full font-bold hover:bg-rose-700 disabled:bg-gray-400"
      >
        {aiRiskLoading ? '診断中…' : '内容をAI評価'}
      </button>
    </div>
    <p className="text-xs text-rose-700 mt-1">タイトル・説明・価格・タグを総合的に読み取り、最大5件の懸念点を返します。</p>
    <div className="mt-3 text-sm">
      {aiRiskLoading && <div className="text-rose-700">Geminiが診断中…</div>}
      {!aiRiskLoading && aiRisks.length === 0 && <div className="text-rose-700">診断結果はまだありません。</div>}
      {!aiRiskLoading && aiRisks.length > 0 && (
        <ul className="list-disc pl-5 space-y-1 text-rose-800">
          {aiRisks.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
    </div>

    {!aiRiskLoading && riskAxes.length > 0 && (
      <div className="mt-4 bg-white border border-rose-200 p-3 rounded">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-rose-700">リスク予報（多軸）</div>
          <div className="text-sm text-rose-700">
            総合: <span className={riskOverall > 60 ? 'text-red-600' : riskOverall > 35 ? 'text-amber-600' : 'text-emerald-600'}>{riskOverall}</span> / 100
          </div>
        </div>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {riskAxes.map((ax, i) => (
            <div key={i} className="p-2 rounded border border-rose-100 bg-rose-50/40">
              <div className="text-sm text-rose-800">{ax.label}</div>
              <div className="mt-1 h-2 bg-rose-100 rounded">
                <div
                  className={`h-2 rounded ${ax.score > 60 ? 'bg-red-500' : ax.score > 35 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, Math.max(0, ax.score))}%` }}
                />
              </div>
              {ax.hint && <div className="mt-1 text-xs text-rose-700/80">{ax.hint}</div>}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);
