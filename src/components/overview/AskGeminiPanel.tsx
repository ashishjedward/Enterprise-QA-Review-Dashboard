import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, ArrowRight, CornerDownRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { ACCOUNTS_DATA } from '../../data/dummyData';

interface QAResponse {
  question: string;
  summary: string;
  keyMetrics: { label: string; value: string; rag?: 'RED' | 'AMBER' | 'GREEN' }[];
  accountsMentioned: { id: string; name: string; score: string; note: string }[];
  recommendation: string;
}

export const AskGeminiPanel: React.FC<{ isDrawer?: boolean }> = ({ isDrawer = false }) => {
  const { selectAccountAndNavigate, navigateToPage, filteredAccounts, overallSla, overallBestQm } = useFilters();
  const [query, setQuery] = useState('');
  const [currentResponse, setCurrentResponse] = useState<QAResponse | null>(null);
  const [isTyping, setIsTyping] = useState(false);

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
          summary: 'Travel vertical records the lowest SLA achievement at 93.9% (Target: 95.0%, -1.1% variance), driven by acute baggage dispute surges on AeroGlobal Airlines and VoyageAirways.',
          keyMetrics: [
            { label: 'Travel Avg SLA', value: '93.9%', rag: 'RED' },
            { label: 'Target SLA', value: '95.0%', rag: 'GREEN' },
            { label: 'Breach Accounts', value: '2 Accounts', rag: 'RED' },
          ],
          accountsMentioned: [
            { id: 'acc-trav-01', name: 'AeroGlobal Airlines', score: '91.8% SLA', note: 'GDS migration baggage misroutes' },
            { id: 'acc-trav-02', name: 'VoyageAirways Holidays', score: '92.6% SLA', note: 'Hotel cancellation refund disputes' },
          ],
          recommendation: 'Deploy 4 senior float auditors to Manila Voice and conduct daily 15-minute exception calibrations.',
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
            { id: 'acc-trav-02', name: 'VoyageAirways Holidays', score: 'Sentiment: 52/100', note: 'Slow hotel voucher cancellation turnaround' },
            { id: 'acc-hlth-01', name: 'MediCare Direct Solutions', score: 'Sentiment: 56/100', note: 'HIPAA verification dip in evening shifts' },
            { id: 'acc-log-01', name: 'TransContinental Freight', score: 'Sentiment: 49/100', note: 'EU customs tariff declaration errors' },
          ],
          recommendation: 'Initiate weekly Sr Director partner governance reviews and enforce 100% pre-call QA verification gates.',
        };
      } else if (q.includes('leader') || q.includes('weakest best qm') || q.includes('best qm')) {
        resp = {
          question: userQuestion,
          summary: 'Aarav Mehta (Travel QA Lead) and Neha Kapoor (Healthcare QA Lead) oversee portfolios with the lowest average BEST QM scores at 87.9% and 89.0% respectively against the 90.0% benchmark.',
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
      } else if (q.includes('travel') || q.includes('decline') || q.includes('why')) {
        resp = {
          question: userQuestion,
          summary: 'Travel SLA declined by -1.6% MoM primarily due to a 300% surge in summer baggage disruption calls combined with high QA attrition (16.4%) in the Manila Voice delivery center.',
          keyMetrics: [
            { label: 'Travel Current SLA', value: '93.9%', rag: 'RED' },
            { label: 'Previous 3M SLA', value: '95.2%', rag: 'GREEN' },
            { label: 'Manila QA Attrition', value: '16.4%', rag: 'RED' },
          ],
          accountsMentioned: [
            { id: 'acc-trav-01', name: 'AeroGlobal Airlines', score: '91.8% SLA', note: 'Manila Voice QA deficit -4 FTEs' },
            { id: 'acc-trav-02', name: 'VoyageAirways Holidays', score: '92.6% SLA', note: 'Partner hotel cancellation delays' },
          ],
          recommendation: 'Fast-track onboarding of 4 replacement auditors and implement automated speech tagging for baggage claims.',
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
            { label: 'Open Actions', value: `${filteredAccounts.reduce((a, c) => a + c.openActionsCount, 0)} Total`, rag: 'AMBER' },
          ],
          accountsMentioned: filteredAccounts.slice(0, 2).map((a) => ({
            id: a.id,
            name: a.name,
            score: `${a.slaScore}% SLA`,
            note: a.sentimentReason,
          })),
          recommendation: 'Prioritize resolution of the 6 overdue CAPA actions and review Manila staffing capacity.',
        };
      }

      setCurrentResponse(resp);
      setIsTyping(false);
    }, 450);
  };

  return (
    <div className={`bg-white rounded-xs flex flex-col justify-between ${
      isDrawer ? 'h-full p-3' : 'border border-teal-200/80 p-2.5 sm:p-3 shadow-xs'
    }`}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-xs bg-[#0D9488] flex items-center justify-center text-white shadow-xs shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-[#1A2B4B] tracking-tight uppercase">
                  Ask Gemini &bull; QA Executive Assistant
                </h3>
                <span className="text-[8.5px] px-1.5 py-0.2 bg-teal-50 text-[#0D9488] border border-teal-200 rounded-xs font-bold uppercase">
                  Local Mode
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500">
                Natural language query assistant for root causes, risks, and performance diagnostics.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Sample Question Chips */}
        <div className="mb-2">
          <div className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Suggested Leadership Questions:
          </div>
          <div className="flex flex-wrap gap-1">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(q);
                  handleAsk(q);
                }}
                className="text-[10.5px] text-slate-700 bg-slate-50 hover:bg-teal-50 hover:text-teal-900 hover:border-teal-300 border border-slate-200 rounded-xs px-2 py-0.5 text-left transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(query);
          }}
          className="flex items-center gap-1.5 mb-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything (e.g. 'Which vertical has the lowest SLA?')..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xs pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0D9488] focus:bg-white transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                &times;
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!query.trim() || isTyping}
            className="px-3 py-1.5 text-xs font-bold text-white bg-[#1A2B4B] hover:bg-slate-800 rounded-xs flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>Ask</span>
          </button>
        </form>

        {/* Loading State */}
        {isTyping && (
          <div className="p-3 rounded-xs border border-slate-200 bg-slate-50 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#0D9488] animate-spin" />
            <span>Analyzing local enterprise dataset and synthesizing insights...</span>
          </div>
        )}

        {/* Response View */}
        {currentResponse && !isTyping && (
          <div className="p-2.5 rounded-xs border border-teal-200 bg-teal-50/30 text-xs space-y-2">
            {/* User Query Echo */}
            <div className="flex items-start gap-1.5 text-slate-600 font-medium text-[11px]">
              <User className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
              <span>&ldquo;{currentResponse.question}&rdquo;</span>
            </div>

            {/* AI Summary */}
            <div className="flex items-start gap-1.5 text-[#1A2B4B] leading-relaxed font-normal bg-white p-2.5 rounded-xs border border-teal-100">
              <Bot className="w-3.5 h-3.5 text-[#0D9488] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-[#1A2B4B] text-[11.5px]">{currentResponse.summary}</p>

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-3 gap-1.5 mt-2 pt-1.5 border-t border-slate-100">
                  {currentResponse.keyMetrics.map((km, idx) => (
                    <div key={idx} className="bg-slate-50 p-1 rounded-xs border border-slate-200 text-center">
                      <div className="text-[8.5px] font-bold uppercase text-slate-400 truncate">{km.label}</div>
                      <div className={`text-xs font-bold font-mono ${
                        km.rag === 'RED' ? 'text-rose-700' :
                        km.rag === 'AMBER' ? 'text-amber-700' : 'text-emerald-700'
                      }`}>
                        {km.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mentioned Accounts */}
            {currentResponse.accountsMentioned.length > 0 && (
              <div>
                <div className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Directly Affected Accounts (Click to inspect):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {currentResponse.accountsMentioned.map((acc) => (
                    <div
                      key={acc.id}
                      onClick={() => selectAccountAndNavigate(acc.id)}
                      className="p-1.5 rounded-xs bg-white border border-slate-200 hover:border-[#0D9488] hover:bg-teal-50/40 transition-colors cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div className="truncate">
                        <div className="font-bold text-[#1A2B4B] truncate hover:text-[#0D9488] text-[11px]">
                          {acc.name}
                        </div>
                        <div className="text-[9.5px] text-slate-500 truncate font-normal">{acc.note}</div>
                      </div>
                      <span className="text-[10px] font-bold font-mono text-[#0D9488] shrink-0 ml-1">
                        {acc.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actionable Recommendation */}
            <div className="flex items-start gap-1.5 p-1.5 rounded-xs bg-emerald-50/80 border border-emerald-200 text-[10.5px] text-emerald-950">
              <CheckCircle className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <strong>Recommended Action:</strong> {currentResponse.recommendation}
              </div>
            </div>
          </div>
        )}
      </div>

      {!currentResponse && !isTyping && (
        <div className="text-[10.5px] text-slate-400 text-center py-1">
          Click any sample question above or type to interrogate the local dataset.
        </div>
      )}
    </div>
  );
};
