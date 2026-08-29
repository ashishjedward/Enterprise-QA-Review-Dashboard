import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, ArrowRight, CornerDownRight, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';

interface QAResponse {
  question: string;
  summary: string;
  keyMetrics: { label: string; value: string; rag?: 'RED' | 'AMBER' | 'GREEN' }[];
  accountsMentioned: { id: string; name: string; score: string; note: string }[];
  recommendation: string;
}

export const AskGeminiDrawer: React.FC = () => {
  const { activeDrawer, closeDrawer, selectAccountAndNavigate, filteredAccounts, overallSla, overallBestQm } = useFilters();
  const [query, setQuery] = useState('');
  const [currentResponse, setCurrentResponse] = useState<QAResponse | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  if (activeDrawer !== 'ask-gemini') return null;

  const sampleQuestions = [
    'Which vertical has the lowest SLA?',
    'Show Red Client Sentiment accounts.',
    'Which QA Leader has the weakest BEST QM?',
    'Why did Travel SLA decline?',
    'Which accounts have penalty risk?',
  ];

  const handleAsk = (userQuestion: string) => {
    if (!userQuestion.trim()) return;
    setIsTyping(true);
    setCurrentResponse(null);

    const q = userQuestion.toLowerCase();

    setTimeout(() => {
      let resp: QAResponse;

      if (q.includes('lowest sla') || q.includes('weakest sla') || q.includes('vertical sla')) {
        resp = {
          question: userQuestion,
          summary: 'Travel vertical records the lowest SLA achievement at 93.9% (Target: 95.0%, -1.1% variance), driven by baggage dispute surges on AeroGlobal Airlines and VoyageAirways.',
          keyMetrics: [
            { label: 'Travel Avg SLA', value: '93.9%', rag: 'RED' },
            { label: 'Target SLA', value: '95.0%', rag: 'GREEN' },
            { label: 'Breach Accounts', value: '2 Accounts', rag: 'RED' },
          ],
          accountsMentioned: [
            { id: 'acc-trav-01', name: 'AeroGlobal Airlines', score: '91.8% SLA', note: 'GDS migration baggage misroutes' },
            { id: 'acc-trav-02', name: 'VoyageAirways Holidays', score: '92.6% SLA', note: 'Hotel cancellation refund disputes' },
          ],
          recommendation: 'Deploy senior float auditors to Manila Voice and conduct daily 15-minute exception calibrations.',
        };
      } else if (q.includes('red') || q.includes('sentiment') || q.includes('at risk')) {
        resp = {
          question: userQuestion,
          summary: 'There are currently 4 Red Client Sentiment accounts in the enterprise portfolio, accounting for 68% of all high-priority corrective actions.',
          keyMetrics: [
            { label: 'Red Account Count', value: '4 Accounts', rag: 'RED' },
            { label: 'Total Portfolio Pct', value: '33%', rag: 'RED' },
            { label: 'Associated Penalties', value: '$128K / mo at risk', rag: 'RED' },
          ],
          accountsMentioned: [
            { id: 'acc-trav-01', name: 'AeroGlobal Airlines', score: 'Sentiment: 48/100', note: 'Baggage dispute repeat escalations' },
            { id: 'acc-trav-02', name: 'VoyageAirways Holidays', score: 'Sentiment: 52/100', note: 'Slow hotel voucher turnaround' },
            { id: 'acc-hlth-01', name: 'MediCare Direct Solutions', score: 'Sentiment: 56/100', note: 'HIPAA verification dip in evening shifts' },
            { id: 'acc-log-01', name: 'TransContinental Freight', score: 'Sentiment: 49/100', note: 'EU customs tariff declaration errors' },
          ],
          recommendation: 'Initiate weekly Sr Director partner governance reviews and enforce 100% pre-call QA verification gates.',
        };
      } else if (q.includes('leader') || q.includes('weakest best qm') || q.includes('best qm')) {
        resp = {
          question: userQuestion,
          summary: 'Aarav Mehta (Travel QA Lead) and Neha Kapoor (Healthcare QA Lead) oversee portfolios with the lowest average BEST QM scores at 87.9% and 89.0% against the 90.0% benchmark.',
          keyMetrics: [
            { label: 'Aarav Mehta Avg BEST QM', value: '87.9%', rag: 'RED' },
            { label: 'Neha Kapoor Avg BEST QM', value: '89.0%', rag: 'AMBER' },
            { label: 'Enterprise Avg BEST QM', value: `${overallBestQm}%`, rag: 'AMBER' },
          ],
          accountsMentioned: [
            { id: 'acc-trav-01', name: 'AeroGlobal Airlines (Aarav Mehta)', score: '84.6% BEST QM', note: 'Policy accuracy parameter at 81.2%' },
            { id: 'acc-hlth-01', name: 'MediCare Direct (Neha Kapoor)', score: '85.3% BEST QM', note: 'Compliance/HIPAA parameter at 82.1%' },
          ],
          recommendation: 'Re-align pod calibration frequencies and provide dedicated coaching on dispute resolution and HIPAA standards.',
        };
      } else if (q.includes('penalty') || q.includes('risk')) {
        resp = {
          question: userQuestion,
          summary: '4 accounts carry active penalty exposure totaling an estimated $128,000/month if SLA and compliance gates are not restored by month-end.',
          keyMetrics: [
            { label: 'Penalty Accounts', value: '4 Accounts', rag: 'RED' },
            { label: 'Estimated Exposure', value: '$128,000 / mo', rag: 'RED' },
            { label: 'Audit Deadlines', value: 'Aug 31 Close', rag: 'AMBER' },
          ],
          accountsMentioned: [
            { id: 'acc-trav-01', name: 'AeroGlobal Airlines', score: '$45,000 / mo', note: '2 consecutive SLA breach penalty' },
            { id: 'acc-hlth-01', name: 'MediCare Direct Solutions', score: '$35,000 / audit', note: 'HIPAA verification sampling threshold' },
            { id: 'acc-log-01', name: 'TransContinental Freight', score: '$28,000 / incident', note: 'EU customs declaration SLA fine' },
            { id: 'acc-trav-02', name: 'VoyageAirways Holidays', score: '$20,000 / mo', note: 'Turnaround dispute resolution penalty' },
          ],
          recommendation: 'Conduct daily executive standups with site leads and invoke contingency auditor redeployment.',
        };
      } else {
        resp = {
          question: userQuestion,
          summary: `Analyzing portfolio across ${filteredAccounts.length} accounts: Enterprise SLA currently tracks at ${overallSla}% (Target: 95.0%), with BEST QM at ${overallBestQm}%. Overall quality posture is stable, with isolated risks concentrated in Travel and Healthcare.`,
          keyMetrics: [
            { label: 'Current SLA', value: `${overallSla}%`, rag: overallSla >= 95 ? 'GREEN' : 'AMBER' },
            { label: 'Current BEST QM', value: `${overallBestQm}%`, rag: overallBestQm >= 90 ? 'GREEN' : 'AMBER' },
            { label: 'Monitored Accounts', value: `${filteredAccounts.length} Total`, rag: 'GREEN' },
          ],
          accountsMentioned: filteredAccounts.slice(0, 2).map((a) => ({
            id: a.id,
            name: a.name,
            score: `${a.slaScore}% SLA`,
            note: a.sentimentReason,
          })),
          recommendation: 'Prioritize resolution of overdue CAPA actions and review Manila staffing capacity.',
        };
      }

      setCurrentResponse(resp);
      setIsTyping(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 bg-[#1A2B4B] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-[#0D9488] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Ask Gemini &bull; QA Executive Assistant
                </h3>
                <span className="text-[9px] px-1.5 py-0.2 bg-teal-500/20 text-teal-300 rounded-xs font-mono font-bold">
                  Simulated
                </span>
              </div>
              <p className="text-[11px] text-white/70">
                Ground answers in enterprise SLA, sentiment, and audit data.
              </p>
            </div>
          </div>

          <button
            onClick={closeDrawer}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xs transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Query Pills */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Suggested Executive Inquiries
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(q);
                    handleAsk(q);
                  }}
                  className="text-xs bg-slate-50 border border-slate-200 hover:border-[#0D9488] hover:bg-teal-50/50 hover:text-[#0D9488] text-slate-700 px-2.5 py-1.5 rounded-xs transition-colors text-left cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Response Box */}
          {isTyping && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xs flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="text-xs text-slate-600 font-medium">
                Synthesizing QA audit records, SLAs, and sentiment signals...
              </span>
            </div>
          )}

          {currentResponse && !isTyping && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* Question card */}
              <div className="p-2.5 bg-slate-100 rounded-xs text-xs font-semibold text-[#1A2B4B] flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentResponse.question}</span>
              </div>

              {/* Main summary */}
              <div className="p-3.5 bg-white border border-teal-200/80 rounded-xs shadow-xs space-y-3">
                <div className="flex items-start gap-2">
                  <Bot className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {currentResponse.summary}
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                  {currentResponse.keyMetrics.map((m, i) => (
                    <div key={i} className="p-2 bg-slate-50 rounded-xs border border-slate-200/60">
                      <div className="text-[9.5px] text-slate-500 font-medium">{m.label}</div>
                      <div className={`text-xs font-bold font-mono mt-0.5 ${
                        m.rag === 'RED' ? 'text-rose-700' :
                        m.rag === 'GREEN' ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mentioned Accounts */}
                {currentResponse.accountsMentioned.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                      Key Accounts Involved
                    </span>
                    <div className="space-y-1.5">
                      {currentResponse.accountsMentioned.map((acc) => (
                        <div
                          key={acc.id}
                          onClick={() => {
                            closeDrawer();
                            selectAccountAndNavigate(acc.id);
                          }}
                          className="p-2 bg-slate-50 hover:bg-teal-50/50 border border-slate-200 rounded-xs flex items-center justify-between text-xs cursor-pointer group transition-colors"
                        >
                          <div>
                            <span className="font-bold text-[#1A2B4B] group-hover:text-[#0D9488] transition-colors">
                              {acc.name}
                            </span>
                            <div className="text-[10px] text-slate-500">{acc.note}</div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {acc.score}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-[#0D9488]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendation */}
                <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-xs flex items-start gap-2 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900">Recommended Executive Action:</span>
                    <p className="text-amber-800 text-[11px] mt-0.5">{currentResponse.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(query);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about SLA breaches, sentiment, or staffing..."
              className="flex-1 text-xs bg-white border border-slate-200 rounded-xs px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488]"
            />
            <button
              type="submit"
              disabled={!query.trim() || isTyping}
              className="px-3.5 py-2 bg-[#0D9488] text-white text-xs font-bold rounded-xs hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Ask</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
          <span className="text-[9px] text-slate-400 mt-1 block text-center">
            Simulated local assistant &bull; Grounded in Enterprise QA Review datasets
          </span>
        </div>
      </div>
    </div>
  );
};
