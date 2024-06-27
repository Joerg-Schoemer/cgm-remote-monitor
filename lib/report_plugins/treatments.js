'use strict';

const _ = window._;
const moment = window.moment;

let treatments = {
  name: 'treatments'
  , label: 'Treatments'
  , pluginType: 'report'
};

function init() {
  return treatments;
}

module.exports = init;

treatments.html = function html(client) {
  const translate = client.translate;

  return '<h2>' + translate('Treatments') + '</h2>'
    + '<div id="treatments-report">'
    + '<b>' + translate('To see this report, press SHOW while in this view') + '</b>'
    + '</div>'
    + '<form id="rp_edittreatmentdialog" style="display:none" title="' + translate('Edit treatment') + '">'
    + '  <field>'
    + '    <label for="rped_eventType">' + translate('Event Type') + '</label>'
    + '    <select id="rped_eventType"></select>'
    + '  </field>'
    + '  <field>'
    + '     <label for="rped_foodType">' + translate('Food Type') + '</label>'
    + '     <input type="text" id="rped_foodType" />'
    + '  </field>'
    + '  <fieldset>'
    + '      <legend>' + translate('Glucose Reading') + '</legend>'
    + '      <input type="number" step="any" id="rped_glucoseValue" />'
    + '  <field>'
    + '      <label for="rped_mes">' + translate('Measurement Method') + '</label>'
    + '  <span id="rped_mes">'
    + '  <field>'
    + '      <input type="radio" name="rp_bginput" id="rped_bgfromsensor"  value="Sensor">'
    + '      <label title="' + translate('BG from CGM') + '" class="icon-chart-line" style="color:lightgreen" for="rped_bgfromsensor"></label>'
    + '  </field>'
    + '  <field>'
    + '      <input type="radio" name="rp_bginput" id="rped_bgfrommeter"  value="Finger">'
    + '      <label title="' + translate('BG from meter') + '" class="icon-tint" style="color:red" for="rped_bgfrommeter"></label>'
    + '  </field>'
    + '  <field>'
    + '      <input type="radio" name="rp_bginput" id="rped_bgmanual" value="Manual">'
    + '      <label title="' + translate('Manual BG') + '" class="icon-sort-numeric" style="color:blue" for="rped_bgmanual"></label>'
    + '  </field>'
    + '  </span>'
    + '  </field>'
    + '  </fieldset>'
    + '  <field>'
    + '     <label for="rped_carbsGiven">' + translate('Carbs Given') + '</label>'
    + '     <input type="number" step="any" min="0" id="rped_carbsGiven" placeholder="' + translate('Amount in grams') + '" />'
    + '  </field>'
    + '  <field>'
    + '    <label for="rped_proteinGiven">' + translate('Protein') + '</label>'
    + '    <input type="number" step="any" min="0" id="rped_proteinGiven" placeholder="' + translate('Amount in grams') + '" />'
    + '  </field>'
    + '  <field>'
    + '    <label for="rped_fatGiven">' + translate('Fat') + '</label>'
    + '    <input type="number" step="any" min="0" id="rped_fatGiven" placeholder="' + translate('Amount in grams') + '" />'
    + '  </field>'
    + '  <field>'
    + '    <label for="rped_insulinGiven">' + translate('Insulin Given') + '</label>'
    + '    <input type="number" step="0.05" min="0" id="rped_insulinGiven" placeholder="' + translate('Amount in units') + '"/>'
    + '  </field>'
    + '  <field>'
    + '    <label for="rped_duration">' + translate('Duration') + '</label>'
    + '    <input type="number" step="1" min="0" id="rped_duration" placeholder="' + translate('Duration in minutes') + '"/>'
    + '  </field>'
    + '  <field>'
    + '    <label for="rped_percent">' + translate('Percent') + '</label>'
    + '    <input type="number" step="10" id="rped_percent" placeholder="' + translate('Basal change in %') + '"/>'
    + '  </field>'
    + '  <field>'
    + '    <label for="rped_absolute">' + translate('Basal value') + '</label>'
    + '    <input type="number" step="0.05" id="rped_absolute" placeholder="' + translate('Absolute basal value') + '"/>'
    + '  </field>'
    + '  <field>'
    + '    <label for="rped_profile">' + translate('Profile') + '</label>'
    + '    <select id="rped_profile" /></select>'
    + '  </field>'
    + '  <field>'
    + '    <label for="rped_adnotes">' + translate('Additional Notes, Comments') + '</label>'
    + '    <textarea id="rped_adnotes" ></textarea>'
    + '  </field>'
    + '  <field>'
    + '    <label for="rped_enteredBy" class="left-column extra-space">' + translate('Entered By') + '</label>'
    + '    <input type="text" id="rped_enteredBy" value="" />'
    + '  </field>'
    + '  <field>'
    + '    <label for="rp_eventTime" class="left-column extra-space">' + translate('Event Time') + '</label>'
    + '    <span id="rp_eventTime">'
    + '      <input type="date" id="rped_eventDateValue" class="rp_eventinput"/>'
    + '      <input type="time" id="rped_eventTimeValue" class="rp_eventinput"/>'
    + '    </span>'
    + '  </field>'
    + '</form>';
};

treatments.report = function report_treatments(datastorage, sorteddaystoshow, options) {
  const Nightscout = window.Nightscout;
  const client = Nightscout.client;
  const translate = client.translate;
  const report_plugins = Nightscout.report_plugins;

  function buildConfirmText(data) {
    const text = [
      translate('Delete this treatment?') + '\n'
      , '\n' + translate('Event Type') + ': ' + translate(client.careportal.resolveEventName(data.eventType))
    ];

    function pushIf(check, valueText) {
      if (check) {
        text.push(valueText);
      }
    }

    pushIf(data.glucose, translate('Blood Glucose') + ': ' + data.glucose);
    pushIf(data.glucoseType, translate('Measurement Method') + ': ' + translate(data.glucoseType));

    pushIf(data.carbs, translate('Carbs Given') + ': ' + data.carbs);
    pushIf(data.protein, translate('Protein') + ': ' + data.protein);
    pushIf(data.fat, translate('Fat') + ': ' + data.fat);
    pushIf(data.insulin, translate('Insulin Given') + ': ' + data.insulin);
    pushIf(data.duration, translate('Duration') + ': ' + data.duration);
    pushIf(data.percent, translate('Percent') + ': ' + data.percent);
    pushIf(!isNaN(data.absolute), translate('Basal value') + ': ' + data.absolute);
    pushIf(data.preBolus, translate('Carb Time') + ': ' + data.preBolus + ' ' + translate('mins'));
    pushIf(data.notes, translate('Notes') + ': ' + data.notes);
    pushIf(data.enteredBy, translate('Entered By') + ': ' + data.enteredBy);

    text.push(translate('Event Time') + ': ' + (data.eventTime ? data.eventTime.toLocaleString() : new Date().toLocaleString()));
    return text.join('\n');
  }

  function deleteTreatment(event) {
    if (!client.hashauth.isAuthenticated()) {
      window.alert(translate('Your device is not authenticated yet'));
      return false;
    }

    const data = JSON.parse($(this).parent().attr('data'));
    const day = $(this).parent().attr('day');

    if (window.confirm(buildConfirmText(data))) {
      $.ajax({
        method: 'DELETE'
        , url: '/api/v1/treatments/' + data._id
        , headers: client.headers()
      }).done(function treatmentDeleted(response) {
        console.info('treatment deleted', response);
      }).fail(function treatmentDeleteFail(response) {
        console.info('treatment delete failed', response);
        window.alert(translate('Deleting record failed') + '. ' + translate('Status') + ': ' + response.status);
      });
      delete datastorage[day];
      report_plugins.show();
    }
    maybePrevent(event);
    return false;
  }

  function editTreatment(event) {
    const data = JSON.parse($(this).parent().attr('data'));
    const day = $(this).parent().attr('day');

    // prepare event list
    let rpedEventType = $('#rped_eventType');
    rpedEventType.empty();
    _.each(client.careportal.events, function eachEvent(event) {
      if (event.name.indexOf('Temp Basal') > -1) {
        return;
      }
      rpedEventType.append(`<option value="${event.val}">${translate(event.name)}</option>`);
    });
    rpedEventType.append(`<option value="Temp Basal">${translate('Temp Basal')}</option>`);
    rpedEventType.append(`<option value="Bolus Wizard">${translate('Bolus Wizard')}</option>`);

    $('#rped_profile').empty().append('<option value=""></option>');
    client.profilefunctions.listBasalProfiles().forEach(function (p) {
      $('#rped_profile').append(`<option id="${p}">${p}</option>`);
    });

    $('#rp_edittreatmentdialog').dialog({
      width: 640
      , height: 800
      , buttons: [
        {
          text: translate('Save'),
          class: 'leftButton',
          click: function () {
            data.eventType = rpedEventType.val();
            data.foodType = $('#rped_foodType').val();
            data.glucose = $('#rped_glucoseValue').val();
            data.glucoseType = $('#rp_edittreatmentdialog').find('input[name=rp_bginput]:checked').val();
            data.carbs = $('#rped_carbsGiven').val();
            data.protein = $('#rped_proteinGiven').val();
            data.fat = $('#rped_fatGiven').val();
            data.insulin = $('#rped_insulinGiven').val();
            data.duration = $('#rped_duration').val();
            data.percent = $('#rped_percent').val();
            data.absolute = $('#rped_absolute').val();
            data.profile = $('#rped_profile').val();
            data.notes = $('#rped_adnotes').val();
            data.enteredBy = $('#rped_enteredBy').val();
            data.eventTime = new Date(client.utils.mergeInputTime($('#rped_eventTimeValue').val(), $('#rped_eventDateValue').val())).toISOString();
            data.units = options.units;
            delete data.mills;
            delete data.created_at;
            if (data.absolute === '') {
              delete data.absolute;
            }
            $(this).dialog('close');
            saveTreatmentRecord(data);
            delete datastorage[day];
            report_plugins.show();
          }
        },
        {
          text: translate('Cancel'),
          click: function () {
            $(this).dialog('close');
          }
        }
      ]
      , open: function () {
        $(this).parent().css('box-shadow', '10px 10px 10px 0px gray');
        $(this).parent().find('.ui-dialog-buttonset').css({'width': '100%', 'text-align': 'right'});
        rpedEventType.val(data.eventType);
        let rpedFoodType = $('#rped_foodType');
        rpedFoodType.val(data.foodType);
        console.info('eventType: ' + data.eventType)
        if (data.eventType === 'Carb Correction') {
          rpedFoodType.parent().css({'display': 'block'})
        } else {
          rpedFoodType.parent().css({'display': 'none'})
        }
        $('#rped_glucoseValue').val(data.glucose ? data.glucose : '').attr('placeholder', translate('Value in') + ' ' + options.units);
        $('#rped_bgfromsensor').prop('checked', data.glucoseType === 'Sensor');
        $('#rped_bgfrommeter').prop('checked', data.glucoseType === 'Finger');
        $('#rped_bgmanual').prop('checked', data.glucoseType === 'Manual');
        $('#rped_carbsGiven').val(data.carbs ? data.carbs : '');
        $('#rped_proteinGiven').val(data.protein ? data.protein : '');
        $('#rped_fatGiven').val(data.fat ? data.fat : '');
        $('#rped_insulinGiven').val(data.insulin ? data.insulin : '');
        $('#rped_duration').val(data.duration ? data.duration : '');
        $('#rped_percent').val(data.percent ? data.percent : '');
        $('#rped_absolute').val('absolute' in data ? data.absolute : '');
        $('#rped_profile').val(data.profile ? data.profile : '');
        $('#rped_adnotes').val(data.notes ? data.notes : '');
        $('#rped_enteredBy').val(data.enteredBy ? data.enteredBy : '');
        $('#rped_eventTimeValue').val(moment(data.created_at).format('HH:mm'));
        $('#rped_eventDateValue').val(moment(data.created_at).format('YYYY-MM-DD'));
        rpedEventType.focus();
      }
    });

    if (event) {
      event.preventDefault();
    }
    return false;
  }

  function saveTreatmentRecord(data) {
    if (!client.hashauth.isAuthenticated()) {
      window.alert(translate('Your device is not authenticated yet'));
      return false;
    }

    $.ajax({
      method: 'PUT'
      , url: '/api/v1/treatments/'
      , headers: client.headers()
      , data: data
    }).done(function treatmentSaved(response) {
      console.info('treatment saved', response);
    }).fail(function treatmentSaveFail(response) {
      console.info('treatment save failed', response);
      window.alert(translate('Saving record failed') + '. ' + translate('Status') + ': ' + response.status);
    });

    return true;
  }

  function maybePrevent(event) {
    if (event) {
      event.preventDefault();
    }
    return false;
  }

  const icon_remove = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACrElEQVQ4T42Ty2sTQRzHv5tmk2yyjRNtpfZhL8V6s2KoUNC2XqwgaCsVQcGiFqpHi0c9iRdR/ANE9KR40FIQX4cueKoPaKFoLdSYNtE0abKT1+5s9iW7aUMiHtzTzO7v85md+c6PA4DrHbsPCKIgOWO1pA7dT6YXnXH949SE/F63pqwZtRrO+SCKgjQ5NUV+azpmHj2krMwaJC4c8Erj+/eRyloMMwWFKgbn1nC3ervlK1evkXBLGBZT8SOewotnTylTNLdgeg/pDgZDC2cPHSR8bB22DVC9hFe0SG/H0xFXcHlykjRHRDBWgJcZSCY38Xx2lhqMnRYE34Px/sN9vlQWeoHBAx2yXsRruVAVuFsIBaSJ8+eJGPaBqQV4NROJjTzez89jLBoFn6FgybQL54wS3uTyVDFQ3cL2IYpBv3RhdJSIIQ80tQyv7gEqJvS8AmUlBs7UXPhtjtZgh3UFNYngk86NHCfNAg9dMwHVBPu+CpsVkTXKeJeVG+AGgTOZ3tt6MSKKjy+NjEBjFrR4ElZmA4pdxstMFsyyJu6tZZ7Ux9vwB6EAL50ZGiRECEPPUOixVTRxHlicgSVWxEdZpuZWfNuS2hk48NjwMIkIYZglBnV5Cbqtws/5IaAJmsfCglrEl2y2QeKmEBJ80tixKmxrFpSVr0gV0viQoxho2YUuPohmeFD22PiklLC4ma5JuBvdrfLJI0dJd0s7bM0ES8aR/BXDXGaTskqlL+D3Lwy0tZEePoAd4EA5YF4tYymdonfjmQh3s6dTPjU4SHYGwjAKecSXFyGlM1TdytntE56T+ts7SC/vhw3gm6njc2Kd3vm5Ub1IwQAvnYhGiZpYw1wiWYPrIw7wnBTt7CLOOwdmut14kQQvqt24tfK/utGR6LaF+iRqMf4N/O/8D28HiiCRYqzAAAAAAElFTkSuQmCC';
  const icon_edit = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABEUlEQVQ4jZ3MMUsCYQDG8ee8IySQbNCLyyEKG/RLNAXicqvQcAeNLrcFLlE0+xHuNpt8wy04rrYm8Q4HQRE56BSC3lSqU1BwCoxM39dnffj9BWyxXvVeEzvtctBwHyRebNu2Nk2lzMlrgJB+qBEeTByiKYpihl+fIO8jTI9PDJEVF1+K2iw+M6PhDuyag4NkQi/c3FkCK5Z3ZbM76qLltpCbn+vXxq0FABsDy9hzPdBvqvtXvvXzrw1swmsDLPjfACteGeDBfwK8+FdgGwwAIgC0ncsjxGRSH/eiPBgAJADY2z8sJ4JBfNBsDqlADVYMANIzKalv/bHaefKsTH9iPFb8ISsGAJym0+Qinz3jQktbAHcxvx3559eSAAAAAElFTkSuQmCC';

  const table = $('<table>');
  table.addClass('treatments').append($('<tr>')
    .append($('<th>'))
    .append($('<th>').append(translate('Time')))
    .append($('<th>').append(translate('Event Type')))
    .append($('<th>').append(translate('Blood Glucose')))
    .append($('<th>').append(translate('Insulin')))
    .append($('<th>').append(translate('Carbs/Food/Time')))
    .append($('<th>').append(translate('Protein')))
    .append($('<th>').append(translate('Fat')))
    .append($('<th>').append(translate('Duration')))
    .append($('<th>').append(translate('Percent')))
    .append($('<th>').append(translate('Basal value')))
    .append($('<th>').append(translate('Profile')))
    .append($('<th>').append(translate('Entered By')))
    .append($('<th>').append(translate('Notes')))
  );

  sorteddaystoshow.forEach(function (day) {
    table.append(
      $('<tr>').append($('<td>').attr('colspan', 14).addClass('next_day').append(report_plugins.utils.localeDate(day)))
    );

    const treatments = _.clone(datastorage[day].treatments);
    if (options.order === report_plugins.consts.ORDER_NEWESTONTOP) {
      treatments.reverse();
    }
    for (const tr of treatments) {
      let carbs = (tr.carbs ? tr.carbs + 'g' : '')
        + (tr.foodType ? ' / ' + tr.foodType : '')
        + (tr.absorptionTime ? ' / ' + (Math.round(tr.absorptionTime / 60.0 * 10) / 10) + 'h' : '');
      let correctionRangeText = '';
      if (tr.correctionRange) {
        let min = tr.correctionRange[0];
        let max = tr.correctionRange[1];

        if (client.settings.units === 'mmol') {
          max = client.utils.roundBGForDisplay(client.utils.scaleMgdl(max));
          min = client.utils.roundBGForDisplay(client.utils.scaleMgdl(min));
        }

        if (tr.correctionRange[0] === tr.correctionRange[1]) {
          correctionRangeText = '' + min;
        } else {
          correctionRangeText = '' + min + ' - ' + max;
        }
      }
      table.css('width', '100%').append($('<tr>').addClass('border_bottom')
        .append($('<td>')
          .attr('data', JSON.stringify(tr))
          .attr('day', day)
          .append($(`<img src="${icon_remove}" alt="${translate('Delete record')}">`)
            .addClass('deleteTreatment')
            .attr('title', translate('Delete record'))
          )
          .append('&nbsp;')
          .append($(`<img src="${icon_edit}" alt="${translate('Edit record')}">`)
            .addClass('editTreatment')
            .attr('title', translate('Edit record'))
          )
        )
        .append($('<td>').addClass('time').append(new Date(tr.created_at).toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, '$1$3')))
        .append($('<td>').addClass('text').append(tr.eventType ? translate(client.careportal.resolveEventName(tr.eventType)) + (tr.reason ? '<br>' + tr.reason : '') +
          (tr.insulinNeedsScaleFactor ? '<br>' + tr.insulinNeedsScaleFactor * 100 + '%' : '') + (tr.correctionRange ? ' ' + correctionRangeText : '') : ''))
        .append($('<td>').addClass('number').append(tr.glucose ? tr.glucose + ' (' + translate(tr.glucoseType) + ')' : ''))
        .append($('<td>').addClass('number').append(tr.insulin ? tr.insulin.toFixed(2) : ''))
        .append($('<td>').addClass('text').append(carbs))
        .append($('<td>').addClass('number').append(tr.protein ? tr.protein : ''))
        .append($('<td>').addClass('number').append(tr.fat ? tr.fat : ''))
        .append($('<td>').addClass('number').append(tr.duration ? tr.duration.toFixed(0) : ''))
        .append($('<td>').addClass('number').append(tr.percent ? tr.percent : ''))
        .append($('<td>').addClass('number').append('absolute' in tr ? tr.absolute.toFixed(2) : ''))
        .append($('<td>').addClass('text').append(tr.profile ? tr.profile : ''))
        .append($('<td>').addClass('text').append(tr.enteredBy ? tr.enteredBy : ''))
        .append($('<td>').addClass('text').append(tr.notes ? tr.notes : ''))
      );
    }
  });
  $('#treatments-report').html(table);
  $('.deleteTreatment').click(deleteTreatment);
  $('.editTreatment').click(editTreatment);
};
  
