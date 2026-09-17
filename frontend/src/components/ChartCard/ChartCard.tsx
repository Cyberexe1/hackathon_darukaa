import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { MetricYearPoint } from '../../types/dashboard';

interface ChartCardProps {
  title: string;
  unit: string;
  data: MetricYearPoint[];
  color?: string;
  /** e.g. "+338% NET" shown top-right, matching the landing page chart cards. */
  badge?: string;
  valueFormatter?: (value: number) => string;
}

const BRAND_GREEN = '#12372a';

/**
 * Highcharts line-chart card matching the visual language of the landing
 * page's hand-drawn SVG analytics cards (rounded card, label-technical
 * header, headline value, muted axis labels). Used for Carbon,
 * Biodiversity, and Vegetation trend charts.
 */
export function ChartCard({ title, unit, data, color = BRAND_GREEN, badge, valueFormatter }: ChartCardProps) {
  const latest = data[data.length - 1];
  const formattedLatest = valueFormatter ? valueFormatter(latest.value) : latest.value.toLocaleString();

  const options: Highcharts.Options = {
    chart: {
      type: 'line',
      height: 220,
      backgroundColor: 'transparent',
      style: { fontFamily: '"Plus Jakarta Sans", sans-serif' },
      animation: { duration: 700 },
      spacing: [8, 4, 8, 4],
    },
    title: { text: undefined },
    credits: { enabled: false },
    xAxis: {
      categories: data.map((p) => String(p.year)),
      lineColor: '#c1c8c3',
      tickColor: '#c1c8c3',
      labels: { style: { color: '#414844', fontSize: '11px' } },
    },
    yAxis: {
      title: { text: undefined },
      gridLineColor: '#e7f0e8',
      labels: { style: { color: '#414844', fontSize: '11px' } },
    },
    legend: { enabled: false },
    tooltip: {
      backgroundColor: '#ffffff',
      borderColor: '#c1c8c3',
      style: { fontSize: '12px', color: '#151d19' },
      valueSuffix: ` ${unit}`,
    },
    plotOptions: {
      line: {
        animation: { duration: 900 },
        marker: { radius: 4, fillColor: color, lineWidth: 0 },
      },
    },
    series: [
      {
        type: 'line',
        name: title,
        data: data.map((p) => p.value),
        color,
        lineWidth: 3,
      },
    ],
  };

  return (
    <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm h-full">
      <div className="flex items-center justify-between mb-space-xs">
        <span className="font-label-technical text-label-technical text-on-surface-variant uppercase">{title}</span>
        {badge && <span className="font-label-technical text-label-micro text-surface-tint font-bold">{badge}</span>}
      </div>
      <div className="font-headline-lg text-headline-lg text-primary mb-2">
        {formattedLatest} <span className="text-body-sm font-normal text-on-surface-variant">{unit}</span>
      </div>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
