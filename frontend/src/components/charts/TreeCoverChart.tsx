import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { ChartPoint } from '../../types/dashboard';
import { BRAND_COLORS, baseChartOptions } from './chartTheme';

interface TreeCoverChartProps {
  data: ChartPoint[];
  isDemoData?: boolean;
  height?: number;
}

/** Tree Cover % — filled area chart, fixed 0-100 y-axis. */
export function TreeCoverChart({ data, isDemoData, height = 280 }: TreeCoverChartProps) {
  const options: Highcharts.Options = Highcharts.merge(baseChartOptions(height), {
    chart: { type: 'area' },
    xAxis: { categories: data.map((p) => p.label) },
    yAxis: { min: 0, max: 100 },
    tooltip: { valueSuffix: '%' },
    plotOptions: {
      area: {
        fillOpacity: 0.18,
        marker: { radius: 4, fillColor: BRAND_COLORS.treeCover, lineWidth: 0 },
      },
    },
    series: [
      {
        type: 'area',
        name: 'Tree Cover %',
        data: data.map((p) => p.value),
        color: BRAND_COLORS.treeCover,
        lineWidth: 3,
      },
    ],
  } satisfies Highcharts.Options);

  return (
    <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm h-full">
      <div className="flex items-center justify-between mb-space-sm">
        <span className="font-label-technical text-label-technical text-on-surface-variant uppercase">
          Tree Cover %
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
