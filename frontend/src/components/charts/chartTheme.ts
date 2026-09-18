import type Highcharts from 'highcharts';

/**
 * Shared Highcharts base configuration for every analytics chart
 * (CarbonChart, BiodiversityChart, VegetationChart, TreeCoverChart,
 * ProjectComparisonChart). Centralizing this avoids duplicating the same
 * fonts/colors/tooltip/credits config in every chart component — each
 * chart only supplies its type-specific series/axis options on top of
 * this base via `Highcharts.merge()`.
 */
export const BRAND_COLORS = {
  carbon: '#12372a',
  biodiversity: '#416656',
  vegetation: '#10b981',
  treeCover: '#00a7c3',
  comparison: ['#12372a', '#416656', '#10b981', '#00a7c3', '#6c5c46'],
} as const;

export function baseChartOptions(height = 260): Highcharts.Options {
  return {
    chart: {
      height,
      backgroundColor: 'transparent',
      style: { fontFamily: '"Plus Jakarta Sans", sans-serif' },
      animation: { duration: 700 },
      spacing: [8, 8, 8, 4],
    },
    title: { text: undefined },
    credits: { enabled: false },
    xAxis: {
      lineColor: '#c1c8c3',
      tickColor: '#c1c8c3',
      labels: { style: { color: '#414844', fontSize: '11px' } },
    },
    yAxis: {
      title: { text: undefined },
      gridLineColor: '#e7f0e8',
      labels: { style: { color: '#414844', fontSize: '11px' } },
    },
    legend: {
      enabled: false,
      itemStyle: { color: '#414844', fontSize: '12px', fontWeight: '500' },
    },
    tooltip: {
      backgroundColor: '#ffffff',
      borderColor: '#c1c8c3',
      style: { fontSize: '12px', color: '#151d19' },
      animation: true,
    },
    plotOptions: {
      series: {
        animation: { duration: 900 },
      },
    },
    responsive: {
      rules: [
        {
          condition: { maxWidth: 480 },
          chartOptions: {
            chart: { height: Math.max(180, height - 60) },
            legend: { itemStyle: { fontSize: '10px' } },
            xAxis: { labels: { style: { fontSize: '9px' } } },
            yAxis: { labels: { style: { fontSize: '9px' } } },
          },
        },
      ],
    },
  };
}
