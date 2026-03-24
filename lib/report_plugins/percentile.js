'use strict';

const percentile = {
  name: 'percentile'
  , label: 'Percentile Chart'
  , pluginType: 'report'
};

function init() {
  return percentile;
}

module.exports = init;

percentile.html = function html(client) {
  return `<h2>${client.translate('Glucose Percentile report')} <span id="percentile-days"></span></h2>
    <div class="chart" id="percentile-chart"></div>`;
};

percentile.css = `#percentile-chart {  
  width: 100%;  
  height: 800px;
}`;

percentile.report = function report_percentile(dataStorage, sortedDaysToShow, options) {
  const ss = require('simple-statistics');
  const Nightscout = window.Nightscout;
  const translate = Nightscout.client.translate;

  const minuteWindow = 20; //minute-window should be a divisor of 60

  const data = dataStorage.allstatsrecords;

  const bins = [];

  const reportPlugins = Nightscout.report_plugins;
  const firstDay = reportPlugins.utils.localeDate(sortedDaysToShow[sortedDaysToShow.length - 1]);
  const lastDay = reportPlugins.utils.localeDate(sortedDaysToShow[0]);

  $('#percentile-days').text(`(${(sortedDaysToShow.length)} ${translate('days total')}, ${firstDay} - ${lastDay})`);

  for (let hour = 0; hour < 24; hour++) {
    for (let startInterval = 0; startInterval < 60; startInterval = startInterval + minuteWindow) {
      const endInterval = startInterval + minuteWindow;
      const readings = data.filter(record => {
        const recDate = new Date(record.displayTime);
        const recMinutes = recDate.getMinutes();

        return recDate.getHours() === hour && recMinutes >= startInterval && recMinutes < endInterval;
      }).map(record=> {
        return record.sgv;
      });

      const date = new Date();
      date.setHours(hour);
      date.setMinutes(startInterval);

      bins.push([date, readings]);
    }
  }

  const dat = bins.map(function (bin) {
    return [bin[0], ss.quantile(bin[1], [0.1, 0.25, 0.5, 0.75, 0.9])];
  });
  const dat10 = dat.map(function (bin) {
    return [bin[0], bin[1][0]]
  })
  const dat25 = dat.map(function (bin) {
    return [bin[0], bin[1][1]]
  })
  const dat50 = dat.map(function (bin) {
    return [bin[0], bin[1][2]]
  })
  const dat75 = dat.map(function (bin) {
    return [bin[0], bin[1][3]]
  })
  const dat90 = dat.map(function (bin) {
    return [bin[0], bin[1][4]]
  })

  const high = options.targetHigh;
  const low = options.targetLow;

  let percentile = translate('percentile');
  $.plot(
    '#percentile-chart',
    [
      {
        label: `90% ${percentile}`,
        data: dat90,
        id: 'c90',
        color: '#d0d0d0',
        lines: {
          show: true,
          fill: true
        },
        fillBetween: 'c75'
      },
      {
        label: `25%/75% ${percentile}`,
        data: dat25,
        id: 'c25',
        color: '#3999dc',
        lines: {
          show: true
        },
      },
      {
        label: translate('Median'),
        data: dat50,
        id: 'c50',
        color: '#000000',
        lines: {
          show: true
        }
      },
      {
        data: dat75,
        id: 'c75',
        color: '#3999dc',
        lines: {
          show: true,
          fill: true
        },
        fillBetween: 'c25'
      },
      {
        label: `10% ${percentile}`,
        data: dat10,
        id: 'c10',
        color: '#d0d0d0',
        lines: {
          show: true,
          fill: true
        },
        fillBetween: 'c25'
      },
      {
        label: translate('High'),
        data: [],
        color: '#FFFF00',
      },
      {
        label: translate('Low'),
        data: [],
        color: '#FF0000',
      }
    ],
    {
      xaxis: {
        mode: 'time',
        timezone: 'browser',
        timeformat: '%H:%M',
        tickColor: '#555',
      },
      yaxis: {
        min: 0,
        max: options.units === 'mmol' ? 22 : 400,
        tickColor: '#555',
      },
      grid: {
        markings: [
          {
            color: '#FF0000',
            lineWidth: 3,
            yaxis: {
              from: low,
              to: low
            }
          },
          {
            color: '#FFFF00',
            lineWidth: 3,
            yaxis: {
              from: high,
              to: high
            }
          }
        ],
        hoverable: true
      }
    }
  );
};
