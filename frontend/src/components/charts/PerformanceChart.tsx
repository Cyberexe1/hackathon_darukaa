import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { YearAggregatePoint } from '../../types/dashboard';
import { BRAND_COLORS, baseChartOptions } from './chartTheme';

interface PerformanceChartProps {
  /** Year-bucketed aggregates (project or dashboard level historical data). */
  data: YearAggregatePoint[];
  height?: number;
}

/**
 * Combined multi-metric performance overview: carbon (left axis, bar)
 * against biodiversity/vegetation/tree-cover trend lines (right axis,
 * 0-100 normalized scale), so a project's/portfolio's overall trajectory
 * is readable in one chart without cramming 4 separate ones together.
 * Legend is enabled here (unlike the single-metric charts) since multiple
 * series need to be told apart.
 */
export function PerformanceChart({ data, height = 320 }: PerformanceChartProps) {
  const categories = data.map((d) => String(d.year));

  const options: Highcharts.Options = Highcharts.merge(baseChartOptions(height), {
    chart: { type: 'column' },
    xAxis: { categories },
    yAxis: [
      {
        title: { text: 'tCO\u2082e', style: { color: '#414844', fontSize: '11px' } },
        gridLineColor: '#e7f0e8',
        labels: { style: { color: '#414844', fontSize: '11px' } },
      },
      {
        title: { text: 'Score / Index', style: { color: '#414844', fontSize: '11px' } },
        labels: { style: { color: '#414844', fontSize: '11px' } },
        opposite: true,
        min: 0,
        max: 100,
      },
    ],
    legend: { enabled: true },
    plotOptions: {
      column: { borderRadius: 3, pointPadding: 0.1, groupPadding: 0.15 },
    },
    series: [
      {
        type: 'column',
        name: 'Carbon (tCO\u2082e)',
        data: data.map((d) => d.carbon_tco2e),
        color: BRAND_COLORS.carbon,
        yAxis: 0,
      },
      {
        type: 'line',
        name: 'Biodiversity Score',
        data: data.map((d) => d.biodiversity_score),
        color: BRAND_COLORS.biodiversity,
        yAxis: 1,
        lineWidth: 3,
        marker: { radius: 4 },
      },
      {
        type: 'line',
        name: 'Tree Cover %',
        data: data.map((d) => d.tree_cover_percentage),
        color: BRAND_COLORS.treeCover,
        yAxis: 1,
        lineWidth: 3,
        marker: { radius: 4 },
      },
    ],
  } satisfies Highcharts.Options);

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
