import { BarChart, Bar, XAxis, YAxis, Tooltip, Rectangle, ResponsiveContainer, LabelList } from 'recharts';

// Fixed hue per category (identity, not rank) — order matches App.jsx's `categories` list.
const CATEGORY_COLORS = {
  food: '#2a78d6',
  housing: '#008300',
  utilities: '#e87ba4',
  transport: '#eda100',
  entertainment: '#1baf7a',
  salary: '#eb6834',
  other: '#4a3aa7',
};
const FALLBACK_COLOR = '#898781';

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
      <h2>Spending by Category</h2>
      {data.length === 0 ? (
        <p className="empty-state">No expenses yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(data.length * 40, 80)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="category"
              width={90}
              axisLine={false}
              tickLine={false}
              tickFormatter={value => value.charAt(0).toUpperCase() + value.slice(1)}
              tick={{ fill: '#52514e', fontSize: 13 }}
            />
            <Tooltip
              cursor={{ fill: '#f5f5f5' }}
              formatter={value => [`$${value}`, 'Spent']}
              labelFormatter={value => value.charAt(0).toUpperCase() + value.slice(1)}
            />
            <Bar dataKey="amount" barSize={20} shape={CategoryBarShape} isAnimationActive={false}>
              <LabelList
                dataKey="amount"
                position="right"
                formatter={value => `$${value}`}
                fill="#0b0b0b"
                fontSize={13}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default CategoryChart;
