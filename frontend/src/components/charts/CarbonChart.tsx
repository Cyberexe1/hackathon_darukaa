import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { ChartPoint } from '../../types/dashboard';
import { BRAND_COLORS, baseChartOptions } from './chartTheme';

interface CarbonChartProps {
  data: ChartPoint[];
  /** Set when `data` is synthetic/example data rather than real stored
   * measurements — renders a visible "Demo data" badge so synthetic
   * numbers are never mistaken for verified environmental measurements. */
  isDemoData?: boolean;
  height?: number;
}

/** Carbon Sequestration line chart (tCO2e over time). */
export function CarbonChart({ data, isDemoData, height = 280 }: CarbonChartProps) {
  const options: Highcharts.Options = Highcharts.merge(baseChartOptions(height), {
    chart: { type: 'line' },
    xAxis: { categories: data.map((p) => p.label) },
    tooltip: { valueSuffix: ' tCO\u2082e' },
    plotOptions: {
      line: { marker: { radius: 4, fillColor: BRAND_COLORS.carbon, lineWidth: 0 } },
    },
    series: [
      {
        type: 'line',
        name: 'Carbon (tCO\u2082e)',
        data: data.map((p) => p.value),
        color: BRAND_COLORS.carbon,
        lineWidth: 3,
      },
    ],
  } satisfies Highcharts.Options);

  return (
    <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm h-full">
      <div className="flex items-center justify-between mb-space-sm">
        <span className="font-label-technical text-label-technical text-on-surface-variant uppercase">
          Carbon Sequestration
        </span>
        {isDemoData && (
          <span className="font-label-technical text-label-micro text-surface-tint font-bold uppercase">
            Demo data
          </span>
        )}
      </div>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
