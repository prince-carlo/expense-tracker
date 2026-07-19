import { BarChart, Bar, XAxis, YAxis, Tooltip, Rectangle, ResponsiveContainer, LabelList } from 'recharts';
import { CATEGORY_COLORS, FALLBACK_CATEGORY_COLOR as FALLBACK_COLOR } from './categoryColors';

function CategoryBarShape(props) {
  const { fill, ...rest } = props;
  return <Rectangle {...rest} fill={fill} radius={[0, 4, 4, 0]} />;
}

function CategoryChart({ transactions }) {
  const totalsByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((totals, t) => {
      totals[t.category] = (totals[t.category] || 0) + Number(t.amount);
      return totals;
    }, {});

  const data = Object.entries(totalsByCategory)
    .map(([category, amount]) => ({ category, amount, fill: CATEGORY_COLORS[category] || FALLBACK_COLOR }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="category-chart">
      <h2>Spending by category</h2>
      {data.length === 0 ? (
        <p className="empty-state">No expenses recorded yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(data.length * 40, 80)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 44, left: 8, bottom: 4 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="category"
              width={92}
              axisLine={false}
              tickLine={false}
              tickFormatter={value => value.charAt(0).toUpperCase() + value.slice(1)}
              tick={{ fill: '#57685c', fontSize: 13, fontFamily: 'IBM Plex Sans, sans-serif' }}
            />
            <Tooltip
              cursor={{ fill: '#dde9d7' }}
              contentStyle={{
                background: '#fbfcf9',
                border: '1px solid #c7d4c1',
                borderRadius: 4,
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontSize: 13,
              }}
              labelStyle={{ color: '#1f2e22', fontWeight: 600 }}
              formatter={value => [`$${value}`, 'Spent']}
              labelFormatter={value => value.charAt(0).toUpperCase() + value.slice(1)}
            />
            <Bar dataKey="amount" barSize={20} shape={CategoryBarShape} isAnimationActive={false}>
              <LabelList
                dataKey="amount"
                position="right"
                formatter={value => `$${value}`}
                fill="#1f2e22"
                fontSize={13}
                fontFamily="IBM Plex Mono, monospace"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default CategoryChart;
