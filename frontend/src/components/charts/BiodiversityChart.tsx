import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { ChartPoint } from '../../types/dashboard';
import { BRAND_COLORS, baseChartOptions } from './chartTheme';

interface BiodiversityChartProps {
  data: ChartPoint[];
  isDemoData?: boolean;
  height?: number;
}

/** Biodiversity Score chart, fixed 0-100 y-axis for consistent scale reading. */
export function BiodiversityChart({ data, isDemoData, height = 280 }: BiodiversityChartProps) {
  const options: Highcharts.Options = Highcharts.merge(baseChartOptions(height), {
    chart: { type: 'line' },
    xAxis: { categories: data.map((p) => p.label) },
    yAxis: { min: 0, max: 100 },
    tooltip: { valueSuffix: ' / 100' },
    plotOptions: {
      line: { marker: { radius: 4, fillColor: BRAND_COLORS.biodiversity, lineWidth: 0 } },
    },
    series: [
      {
        type: 'line',
        name: 'Biodiversity Score',
        data: data.map((p) => p.value),
        color: BRAND_COLORS.biodiversity,
        lineWidth: 3,
      },
    ],
  } satisfies Highcharts.Options);

  return (
    <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm h-full">
      <div className="flex items-center justify-between mb-space-sm">
        <span className="font-label-technical text-label-technical text-on-surface-variant uppercase">
          Biodiversity Score
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
