import { Card } from '@/lib/api';
import { fmtUnits } from '@/lib/format';
import Pct from './Pct';
import MonthSelect from './MonthSelect';

// One component, used 3 times: production, domestic sales, exports.
export default function StatCard({ title, card, month, onMonth }: {
  title: string; card: Card | undefined; month: string; onMonth: (m: string) => void;
}) {
  return (
    <div>
      <div className="stat-head">
        <div>
          <div className="stat-total">
            {card ? fmtUnits(card.totalUnits) : '—'}<small>UNITS</small>
          </div>
          <div className="stat-label">{title}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {card && <Pct value={card.changePct} large />}
          <div><MonthSelect value={month} onChange={onMonth} label={`${title} month`} /></div>
        </div>
      </div>
      <div className="rows">
        {card?.groups.map((g, gi) => (
          <div key={g.name}>
            <div className={`row group ${gi === 0 ? 'first' : ''}`}>
              <span>{g.name}</span>
              <span className="v">{fmtUnits(g.units)} (<Pct value={g.changePct} />)</span>
            </div>
            {g.children.map((c) => (
              <div className="row" key={c.name}>
                <span>{c.name}</span>
                <span className="v">{fmtUnits(c.units)} (<Pct value={c.changePct} />)</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
