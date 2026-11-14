class ChartGenerator {
  generateBarChart(data, options = {}) {
    const { labels, values, title, color = '#3b82f6' } = data;
    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: title || 'Data', data: values, backgroundColor: color }],
      },
      options: { responsive: true },
    };
  }

  generateLineChart(data, options = {}) {
    const { labels, datasets, title } = data;
    return {
      type: 'line',
      data: { labels, datasets },
      options: { responsive: true },
    };
  }

  generatePieChart(data, options = {}) {
    const { labels, values, title } = data;
    return {
      type: 'pie',
      data: { labels, datasets: [{ data: values }] },
      options: { responsive: true },
    };
  }

  getColor(index) {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    return colors[index % colors.length];
  }
}

module.exports = new ChartGenerator();
