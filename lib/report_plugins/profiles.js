'use strict';

const textAsHtml = require('../utils/html').textAsHtml;
const dateFormat = require('../report/date-format');
const toTextContent = require('../utils/html').toTextContent;

const profiles = {
  name: 'profiles'
  , label: 'Profiles'
  , pluginType: 'report'
};

function init () {
  return profiles;
}

module.exports = init;

profiles.html = function html (client) {
  const translate = client.translate;
  return `<div class="agp-wrap profiles-wrap">  
  <div class="agp-header">
    <h2 class="agp-h2">${translate('Profiles')}</h2>
    <select id="profiles-databaserecords" hidden></select>
    <div class="agp-card profiles-active-card">
      <div class="agp-card-title">${translate('Active profile')}</div>
      <div class="agp-subhead" id="profiles-default"></div>
    </div>
    <div class="agp-card profiles-timeline-card">
      <div class="agp-card-title">${translate('Timeline')}</div>
      <div id="profiles-timeline"></div>
    </div>
  </div>
  <div id="profiles-chart"></div>
</div>`;
};

profiles.report = function report_profiles (datastorage) {
  const Nightscout = window.Nightscout;
  const client = Nightscout.client;
  const translate = client.translate;
  const moment = window.moment;
  const profile = client.sbx.data.profile;

  const profileRecords = datastorage.profiles;
  const databaseRecords = $('#profiles-databaserecords');

  databaseRecords.empty();
  for (let r = 0; r < profileRecords.length; r++) {
    databaseRecords.append('<option value="' + r + '">' + translate('Valid from:') + ' ' + dateFormat(client).dateTime(profile.applyTimezone(moment(profileRecords[r].startDate))) + '</option>');
  }
  databaseRecords.unbind().bind('change', recordChange);
  $('#profiles-timeline').off('click.profilesTimeline').on('click.profilesTimeline', '[data-record]', function () {
    databaseRecords.val($(this).attr('data-record')).trigger('change');
  }).on('keydown.profilesTimeline', '[data-record]', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    const idx = $(this).attr('data-record');
    databaseRecords.val(idx).trigger('change');
    const again = $('#profiles-timeline [data-record="' + Number(idx) + '"]')[0];
    if (again && again.focus) again.focus({ preventScroll: true });
  });

  recordChange();

  function recordChange (event) {
    if ($('#profiles-databaserecords option').length < 1)
      return;
    const currentindex = databaseRecords.val();
    const currentrecord = profileRecords[currentindex];

    const container = $('<div class="profiles-grid">');

    $('#profiles-default').text(toTextContent(currentrecord.defaultProfile));

    Object.keys(currentrecord.store).forEach(key => {
      container.append(displayRecord(currentrecord.store[key], key));
    });

    drawTimeline(Number(currentindex));
    $('#profiles-chart').empty().append(container);
    bindCursor($('#profiles-chart'));

    if (event) {
      event.preventDefault();
    }
  }

  // Titles carry their unit in [...] at the end; the unit is shown separately, so drop it here
  function withoutUnit (title) {
    return String(title).replace(/\s*\[[^\]]*\]\s*$/, '');
  }

  function statTile (value, unit, label, cls) {
    return '<div class="agp-stat"><div class="agp-stat-value ' + (cls || '') + '">' + textAsHtml(value) +
      (unit ? '<span class="agp-stat-unit">' + textAsHtml(unit) + '</span>' : '') + '</div>' +
      '<div class="agp-stat-label">' + label + '</div></div>';
  }

  function card (title, unit, body) {
    return '<div class="agp-card">' +
      '<div class="agp-card-title">' + title + (unit ? ' <span class="profiles-unit">[' + textAsHtml(unit) + ']</span>' : '') + '</div>' +
      body + '</div>';
  }

  // Time axis of all database records: each record is valid from its start until the next one starts
  function drawTimeline (selected) {
    const holder = $('#profiles-timeline');
    if (!holder.length) return;

    const fmt = dateFormat(client);
    const records = profileRecords.map(function (rec, idx) {
      const m = profile.applyTimezone(moment(rec.startDate));
      return {idx: idx, t: moment(rec.startDate).valueOf(), label: fmt.date(m), full: fmt.dateTime(m)};
    }).filter(function (rec) {
      return isFinite(rec.t);
    }).sort(function (a, b) {
      return a.t - b.t;
    });
    if (!records.length) { holder.empty(); return; }

    const PX_PER_DAY = 150, DAY = 86400000;
    const L = 20, R = 20, Y = 38, BH = 14;
    const now = Date.now();
    const t0 = records[0].t, t1 = Math.max(now, records[records.length - 1].t);
    const avail = holder.innerWidth() || 600;
    let W = Math.max(Math.ceil((t1 - t0) / DAY * PX_PER_DAY) + L + R, avail); // 1 viewBox unit = 1 px
    const x = function (t) {
      return L + (t - t0) / DAY * PX_PER_DAY;
    };

    // Lanes: a record whose label would overlap the previous one in a row moves to a new row
    const LANE_H = BH + 34, LABEL_CHAR = 6.5, GAP = 10;
    const laneEnds = [];
    records.forEach(function (rec) {
      rec.x0 = x(rec.t);
      const need = rec.x0 + rec.full.length * LABEL_CHAR + GAP;
      let lane = 0;
      while (lane < laneEnds.length && laneEnds[lane] > rec.x0 - 6) lane++;
      laneEnds[lane] = need;
      rec.lane = lane;
    });
    const lanes = laneEnds.length;
    W = Math.max(W, Math.ceil(Math.max.apply(null, laneEnds)) + R); // room for the last label
    const H = Y + lanes * LANE_H - 4;

    // day ticks at local midnight (in the profile's time zone)
    let ticks = '';
    const day = profile.applyTimezone(moment(t0)).startOf('day');
    if (day.valueOf() < t0) day.add(1, 'day');
    for (; day.valueOf() <= t1; day.add(1, 'day')) {
      const dx = x(day.valueOf()).toFixed(1);
      ticks += '<line class="profiles-grid-line" x1="' + dx + '" x2="' + dx + '" y1="' + (Y - 6) + '" y2="' + (H - 4) + '"/>' +
        '<text class="profiles-axis" x="' + dx + '" y="' + (Y - 10) + '" text-anchor="middle">' + attr(fmt.date(day)) + '</text>';
    }

    let bars = '', labels = '', selX = null;
    records.forEach(function (rec, i) {
      const end = i + 1 < records.length ? records[i + 1].t : t1;
      const x0 = rec.x0, x1 = Math.max(x(end), x0 + 2);
      const isSel = rec.idx === selected;
      const ly = Y + rec.lane * LANE_H;
      if (isSel) selX = x0;
      bars += '<g class="profiles-tl-item' + (isSel ? ' profiles-tl-selected' : '') + '" data-record="' + rec.idx + '" tabindex="0" role="button" aria-pressed="' + isSel + '" aria-label="' + attr(translate('Valid from:') + ' ' + rec.full) + '">' +
        '<title>' + attr(translate('Valid from:') + ' ' + rec.full) + '</title>' +
        '<rect class="profiles-tl-bar" x="' + x0.toFixed(1) + '" y="' + ly + '" width="' + (x1 - x0).toFixed(1) + '" height="' + BH + '"/>' +
        '<circle class="profiles-tl-dot" cx="' + x0.toFixed(1) + '" cy="' + (ly + BH / 2) + '" r="' + (isSel ? 7 : 4.5) + '"/></g>';
      labels += '<text class="profiles-axis' + (isSel ? ' profiles-tl-label-sel' : '') + '" x="' + x0.toFixed(1) + '" y="' + (ly + BH + 16) + '" text-anchor="start">' + attr(rec.full) + '</text>';
    });

    const prev = holder.scrollLeft();
    holder.html('<svg class="profiles-timeline" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + attr(translate('Timeline')) + '">' + ticks + bars + labels + '</svg>');
    // keep the scroll position; bring the selected record into view if it is not visible
    const view = holder.innerWidth();
    if (selX !== null && (selX < prev + 10 || selX > prev + view - 140)) {
      holder.scrollLeft(Math.max(selX - view / 3, 0));
    } else {
      holder.scrollLeft(prev);
    }
  }

  function displayRecord (record, name) {
    const wrap = $('<div class="profiles-card agp-card">');
    const total = Math.round(totalDailyBasal(record.basal) * 1000) / 1000;
    const isfUnit = (record.units || 'mg/dL') + '/' + translate('U');
    const cards = [];

    cards.push(card(translate('Profile'), '',
      '<div class="agp-stats-grid">' +
      statTile(record.units, '', translate('Units'), 'profiles-stat-text') +
      statTile(record.dia, translate('h'), translate('DIA')) +
      statTile(record.timezone, '', translate('Timezone'), 'profiles-stat-text') +
      statTile(record.carbs_hr, 'g/' + translate('h'), translate('Carbs activity / absorption rate')) +
      statTile(total, translate('U'), translate('Total daily basal')) +
      '</div>'));

    [
      { cls: 'carbratio', title: translate('Insulin to carb ratio (I:C)'), unit: 'g/' + translate('U'), data: record.carbratio }
      , { cls: 'isf', title: translate('Insulin Sensitivity Factor (ISF)'), unit: isfUnit, data: record.sens }
      , { cls: 'basal', title: withoutUnit(translate('Basal rates [unit/hour]')), unit: translate('U') + '/h', data: record.basal, decimals: 2 }
    ].forEach(function (m) {
      cards.push(card(m.title, m.unit,
        '<div class="profiles-metric-body">' + displayRanges(m.data, null, m.decimals) + stepChart(m.data, m.title, m.cls, m.unit) + '</div>'));
    });
    const targetTitle = withoutUnit(translate('Target BG range [mg/dL,mmol/L]'));
    cards.push(card(targetTitle, record.units,
      '<div class="profiles-metric-body">' + displayRanges(record.target_low, record.target_high) +
      stepChart(record.target_low, targetTitle, 'target', record.units || '', record.target_high) + '</div>'));

    wrap.append('<div class="agp-card-title"><b>' + textAsHtml(name) + '</b></div>');
    wrap.append('<div class="profiles-cards">' + cards.join('') + '</div>');
    return wrap;
  }

  function toHours (entry) {
    if (typeof entry.timeAsSeconds === 'number') return entry.timeAsSeconds / 3600;
    const parts = String(entry.time).split(':');
    return (Number(parts[0]) || 0) + (Number(parts[1]) || 0) / 60;
  }

  // high (optional): second array paired by index (target BG), stored as v2
  function basalSteps (basal, high) {
    const steps = basal.map(function (e, i) {
      const st = {h: toHours(e), v: Number(e.value) || 0};
      if (high) st.v2 = high[i] ? Number(high[i].value) || 0 : st.v;
      return st;
    }).sort(function (a, b) {
      return a.h - b.h;
    });
    steps.forEach(function (st, i) { st.i = i; }); // i = row index in the value table
    if (steps[0].h > 0) steps.unshift({ h: 0, v: steps[0].v, v2: steps[0].v2, i: 0, syn: true });
    return steps;
  }

  function totalDailyBasal (basal) {
    if (!basal || !basal.length) return 0;
    const steps = basalSteps(basal);
    return steps.reduce(function (sum, s, i) {
      const end = i + 1 < steps.length ? steps[i + 1].h : 24;
      return sum + s.v * (end - s.h);
    }, 0);
  }

  // Step chart: each rate is held until the next entry starts (the last one until 24:00)
  function stepChart (basal, label, cls, unit, high) {
    if (!basal || !basal.length) return '';
    const steps = basalSteps(basal, high);

    const W = 400, H = 180, L = 36, R = 8, T = 18, B = 24;
    const pw = W - L - R, ph = H - T - B;
    let max = Math.max.apply(null, steps.map(function (s) {
      return high ? s.v2 : s.v;
    }));
    max = max > 0 ? Math.ceil(max * 1.2 * 10) / 10 : 1;
    const x = function (h) {
      return (L + h / 24 * pw).toFixed(1);
    };
    const y = function (v) {
      return (T + ph - v / max * ph).toFixed(1);
    };

    let line = '', area = 'M' + x(0) + ',' + y(0);
    steps.forEach(function (s, i) {
      const end = i + 1 < steps.length ? steps[i + 1].h : 24;
      line += (i ? 'L' : 'M') + x(s.h) + ',' + y(s.v) + 'L' + x(end) + ',' + y(s.v);
      area += 'L' + x(s.h) + ',' + y(s.v) + 'L' + x(end) + ',' + y(s.v);
    });
    area += 'L' + x(24) + ',' + y(0) + 'Z';

    // target range: shaded band between low and high, plus the upper line
    let lineHigh = '';
    if (high) {
      let top = '', bottom = '';
      steps.forEach(function (s, i) {
        const end = i + 1 < steps.length ? steps[i + 1].h : 24;
        top += (i ? 'L' : 'M') + x(s.h) + ',' + y(s.v2) + 'L' + x(end) + ',' + y(s.v2);
        bottom = 'L' + x(end) + ',' + y(s.v) + 'L' + x(s.h) + ',' + y(s.v) + bottom;
        lineHigh = top;
      });
      area = top + bottom + 'Z';
    }

    let grid = '';
    for (var h = 0; h <= 24; h += 6) {
      grid += '<line class="profiles-grid-line" x1="' + x(h) + '" x2="' + x(h) + '" y1="' + T + '" y2="' + (T + ph) + '"/>' +
        '<text class="profiles-axis" x="' + x(h) + '" y="' + (H - 6) + '" text-anchor="middle">' + h + ':00</text>';
    }
    [0, max / 2, max].forEach(function (v) {
      grid += '<line class="profiles-grid-line" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>' +
        '<text class="profiles-axis" x="' + (L - 4) + '" y="' + (Number(y(v)) + 3) + '" text-anchor="end">' + (Math.round(v * 100) / 100) + '</text>';
    });

    let labels = '';
    steps.forEach(function (st, i) {
      const end = i + 1 < steps.length ? steps[i + 1].h : 24;
      const cx = (Number(x(st.h)) + Number(x(end))) / 2;
      const txt = (Math.round(st.v * 1000) / 1000) + (high ? '–' + (Math.round(st.v2 * 1000) / 1000) : '');
      if (Number(x(end)) - Number(x(st.h)) < 6 * txt.length + 6) return; // not enough room
      labels += '<text class="profiles-step-label" x="' + cx.toFixed(1) + '" y="' + (Number(y(high ? st.v2 : st.v)) - 4) + '" text-anchor="middle">' + txt + '</text>';
    });
    grid += '<text class="profiles-axis" x="' + L + '" y="10">' + attr(unit) + '</text>';

    let bands = '', dots = '';
    steps.forEach(function (st, i) {
      const end = i + 1 < steps.length ? steps[i + 1].h : 24;
      bands += '<rect class="profiles-step-hl" data-idx="' + st.i + '" x="' + x(st.h) + '" y="' + T + '" width="' + (Number(x(end)) - Number(x(st.h))).toFixed(1) + '" height="' + ph + '"/>';
      if (!st.syn) dots += '<circle class="profiles-step-dot" cx="' + x(st.h) + '" cy="' + y(st.v) + '" r="2.5"/>';
    });

    const geom = {W: W, L: L, T: T, pw: pw, ph: ph, max: max, steps: steps};
    return '<svg class="profiles-step-chart profiles-step-' + attr(cls) + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
      attr(label) + '" data-geom="' + attr(JSON.stringify(geom)) + '">' + bands + grid +
      '<path class="profiles-step-area" d="' + area + '"/>' +
      '<path class="profiles-step-line" d="' + line + '"/>' +
      (high ? '<path class="profiles-step-line" d="' + lineHigh + '"/>' : '') + dots + labels +
      '<g class="profiles-cursor" visibility="hidden">' +
      '<line class="profiles-cursor-line" y1="' + T + '" y2="' + (T + ph) + '"/>' +
      '<circle class="profiles-cursor-dot" r="4"/>' +
      '<text class="profiles-cursor-text"/></g></svg>';
  }

  // textAsHtml does not escape quotes, so attribute values need their own escaping
  function attr (value) {
    return String(toTextContent(value)).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function pad (n) { return (n < 10 ? '0' : '') + n; }

  // Highlight the table row and the chart band that belong together (idx null clears)
  function highlight (body, idx) {
    body.find('.profiles-hl').removeClass('profiles-hl');
    if (idx === null || typeof idx === 'undefined') return;
    body.find('[data-idx="' + Number(idx) + '"]').addClass('profiles-hl');
  }

  function bindCursor (root) {
    root.off('.profilesCursor')
      .on('pointermove.profilesCursor pointerdown.profilesCursor', 'svg.profiles-step-chart', function (e) {
        const svg = this;
        const g = JSON.parse(svg.getAttribute('data-geom'));
        const rect = svg.getBoundingClientRect();
        if (!rect.width) return;
        const vx = (e.originalEvent.clientX - rect.left) / rect.width * g.W;
        const h = Math.min(Math.max(Math.round((vx - g.L) / g.pw * 48) / 2, 0), 24); // snap to half hours
        let step = g.steps[0];
        g.steps.forEach(function (st) { if (st.h <= Math.min(h, 24 - 1e-9)) step = st; });
        const cx = g.L + h / 24 * g.pw;
        const cy = g.T + g.ph - (typeof step.v2 === 'number' ? step.v2 : step.v) / g.max * g.ph;
        const mins = Math.floor(h * 60);
        const cursor = svg.querySelector('.profiles-cursor');
        cursor.setAttribute('visibility', 'visible');
        const line = cursor.querySelector('line');
        line.setAttribute('x1', cx); line.setAttribute('x2', cx);
        const dot = cursor.querySelector('circle');
        dot.setAttribute('cx', cx); dot.setAttribute('cy', cy);
        const text = cursor.querySelector('text');
        const right = cx > g.L + g.pw / 2;
        text.setAttribute('x', cx + (right ? -8 : 8));
        text.setAttribute('y', Math.max(cy - 8, g.T + 10));
        text.setAttribute('text-anchor', right ? 'end' : 'start');
        highlight($(svg).closest('.profiles-metric-body'), step.i);
        text.textContent = pad(Math.floor(mins / 60)) + ':' + pad(mins % 60) + '  ' + (Math.round(step.v * 1000) / 1000) + (typeof step.v2 === 'number' ? ' – ' + (Math.round(step.v2 * 1000) / 1000) : '');
      })
      .on('pointerleave.profilesCursor', 'svg.profiles-step-chart', function () {
        this.querySelector('.profiles-cursor').setAttribute('visibility', 'hidden');
        highlight($(this).closest('.profiles-metric-body'), null);
      })
      .on('mouseover.profilesCursor', '.profiles-ranges tr[data-idx]', function () {
        highlight($(this).closest('.profiles-metric-body'), $(this).attr('data-idx'));
      })
      .on('mouseout.profilesCursor', '.profiles-ranges tr[data-idx]', function () {
        highlight($(this).closest('.profiles-metric-body'), null);
      });
  }

  // Compact table: "from – to | value"; for two arrays (target low/high) the value is "low – high"
  function displayRanges (array, array2, decimals) {
    if (!array || !array.length) return '';
    const fmt = function (v) {
      return typeof decimals === 'number' && isFinite(Number(v)) ? Number(v).toFixed(decimals) : v;
    };
    const sorted = array.map(function (e, i) {
      return {
        h: toHours(e),
        time: e.time,
        value: array2 && array2[i] ? fmt(e.value) + ' – ' + fmt(array2[i].value) : fmt(e.value)
      };
    }).sort(function (a, b) {
      return a.h - b.h;
    });
    const rows = sorted.map(function (r, i) {
      const next = sorted[i + 1];
      const to = next ? next.time : '24:00';
      return '<tr data-idx="' + i + '"><td class="profiles-time">' + textAsHtml(r.time) + '–' + textAsHtml(to) + '</td><td class="profiles-value">' + textAsHtml(r.value) + '</td></tr>';
    });
    return '<table class="profiles-ranges">' + rows.join('') + '</table>';
  }
};
