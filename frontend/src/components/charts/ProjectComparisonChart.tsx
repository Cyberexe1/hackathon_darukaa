import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { BRAND_COLORS, baseChartOptions } from './chartTheme';

export interface ProjectComparisonDatum {
  projectName: string;
  value: number;
}

interface ProjectComparisonChartProps {
  data: ProjectComparisonDatum[];
  /** Which metric is being compared — drives the axis/tooltip label. */
  metricLabel: string;
  unit?: string;
  height?: number;
}

/**
 * Horizontal bar comparison across projects for a single selected metric
 * at a time (carbon OR biodiversity, etc — never overlapping several
 * metrics at once, to keep the comparison legible).
 */
export function ProjectComparisonChart({ data, metricLabel, unit = '', height = 300 }: ProjectComparisonChartProps) {
  const options: Highcharts.Options = Highcharts.merge(baseChartOptions(height), {
    chart: { type: 'bar' },
    xAxis: {
      categories: data.map((d) => d.projectName),
      labels: { style: { color: '#414844', fontSize: '11px' } },
    },
    yAxis: {
      title: { text: undefined },
      min: 0,
    },
    tooltip: { valueSuffix: unit ? ` ${unit}` : '' },
    plotOptions: {
      bar: {
        borderRadius: 4,
        color: BRAND_COLORS.carbon,
      },
    },
    series: [
      {
        type: 'bar',
        name: metricLabel,
        data: data.map((d) => d.value),
        color: BRAND_COLORS.carbon,
      },
    ],
  } satisfies Highcharts.Options);

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
