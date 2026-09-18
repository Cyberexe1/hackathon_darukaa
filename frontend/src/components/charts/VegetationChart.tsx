import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { ChartPoint } from '../../types/dashboard';
import { BRAND_COLORS, baseChartOptions } from './chartTheme';

interface VegetationChartProps {
  data: ChartPoint[];
  isDemoData?: boolean;
  height?: number;
}

/** Vegetation Index — clean filled area chart, 0-1 scale. */
export function VegetationChart({ data, isDemoData, height = 280 }: VegetationChartProps) {
  const options: Highcharts.Options = Highcharts.merge(baseChartOptions(height), {
    chart: { type: 'area' },
    xAxis: { categories: data.map((p) => p.label) },
    yAxis: { min: 0, max: 1 },
    tooltip: { valueDecimals: 2 },
    plotOptions: {
      area: {
        fillOpacity: 0.18,
        marker: { radius: 4, fillColor: BRAND_COLORS.vegetation, lineWidth: 0 },
      },
    },
    series: [
      {
        type: 'area',
        name: 'Vegetation Index',
        data: data.map((p) => p.value),
        color: BRAND_COLORS.vegetation,
        lineWidth: 3,
      },
    ],
  } satisfies Highcharts.Options);

  return (
    <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm h-full">
      <div className="flex items-center justify-between mb-space-sm">
        <span className="font-label-technical text-label-technical text-on-surface-variant uppercase">
          Vegetation Index
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
