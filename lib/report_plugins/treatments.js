'use strict';

const _ = window._;
const moment = window.moment;
const dateFormatOptions = {hour: '2-digit', minute: '2-digit'}

let treatments = {
  name: 'treatments', label: 'Treatments', pluginType: 'report'
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
    + '    <label for="rped_foodType">' + translate('Food Type') + '</label>'
    + '    <input id="rped_foodType" type="text" />'
    + '  </field>'
    + '  <fieldset>'
    + '    <legend>' + translate('Glucose Reading') + '</legend>'
    + '    <input id="rped_glucoseValue" type="number" step="any" />'
    + '    <field>'
    + '      <label for="rped_mes">' + translate('Measurement Method') + '</label>'
    + '      <span id="rped_mes">'
    + '        <field>'
    + '          <input type="radio" name="rp_bginput" id="rped_bgfromsensor"  value="Sensor">'
    + '          <label title="' + translate('BG from CGM') + '" class="icon-chart-line" style="color:lightgreen" for="rped_bgfromsensor"></label>'
    + '        </field>'
    + '        <field>'
    + '          <input type="radio" name="rp_bginput" id="rped_bgfrommeter"  value="Finger">'
    + '          <label title="' + translate('BG from meter') + '" class="icon-tint" style="color:red" for="rped_bgfrommeter"></label>'
    + '        </field>'
    + '        <field>'
    + '          <input type="radio" name="rp_bginput" id="rped_bgmanual" value="Manual">'
    + '          <label title="' + translate('Manual BG') + '" class="icon-sort-numeric" style="color:blue" for="rped_bgmanual"></label>'
    + '        </field>'
    + '      </span>'
    + '    </field>'
    + '  </fieldset>'
    + '  <field>'
    + '    <label for="rped_carbsGiven">' + translate('Carbs Given') + '</label>'
    + '    <input id="rped_carbsGiven" type="number" step="any" min="0" placeholder="' + translate('Amount in grams') + '" />'
    + '  </field>'
    + '  <field>'
    + '    <label for="rped_absorptionTime">' + translate('Absorption time') + '</label>'
    + '    <input id="rped_absorptionTime" type="number" step="any" min="0" placeholder="' + translate('Duration in minutes') + '" />'
    + '  </field>'
    + '  <field>'
    + '    <label for="rped_proteinGiven">' + translate('Protein') + '</label>'
    + '    <input id="rped_proteinGiven" type="number" step="any" min="0" placeholder="' + translate('Amount in grams') + '" />'
    + '  </field>'
    + '  <field>'
    + '    <label for="rped_fatGiven">' + translate('Fat') + '</label>'
    + '    <input id="rped_fatGiven" type="number" step="any" min="0" placeholder="' + translate('Amount in grams') + '" />'
    + '  </field>'
    + '  <field>'
    + '    <label for="rped_insulinGiven">' + translate('Insulin Given') + '</label>'
    + '    <input id="rped_insulinGiven" type="number" step="0.05" min="0" placeholder="' + translate('Amount in units') + '"/>'
    + '  </field>'
    + '  <field>'
    + '    <label for="rped_duration">' + translate('Duration') + '</label>'
    + '    <input id="rped_duration" type="number" step="1" min="0" placeholder="' + translate('Duration in minutes') + '"/>'
    + '  </field>'
    + '  <field>'
    + '    <label for="rped_percent">' + translate('Percent') + '</label>'
    + '    <input id="rped_percent" type="number" step="10" placeholder="' + translate('Basal change in %') + '"/>'
    + '  </field>'
    + '  <field>'
    + '    <label for="rped_absolute">' + translate('Basal value') + '</label>'
    + '    <input id="rped_absolute" type="number" step="0.05" placeholder="' + translate('Absolute basal value') + '"/>'
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
    + '    <input id="rped_enteredBy" type="text" value="" />'
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
  const client = window.Nightscout.client;
  const report_plugins = window.Nightscout.report_plugins;
  const translate = client.translate;

  function buildConfirmText(data) {
    const text = [translate('Delete this treatment?') + '\n', '\n' + translate('Event Type') + ': ' + translate(client.careportal.resolveEventName(data.eventType))];

    function pushIf(check, valueText) {
      if (check) {
        text.push(valueText);
      }
    }

    pushIf(data.glucose, translate('Blood Glucose') + ': ' + data.glucose);
    pushIf(data.glucoseType, translate('Measurement Method') + ': ' + translate(data.glucoseType));

    pushIf(data.carbs, translate('Carbs Given') + ': ' + data.carbs);
    pushIf(data.absorptionTime, translate('Absorption Time') + ': ' + data.absorptionTime);
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

    const data = JSON.parse($(this).parent().parent().attr('data'));
    const day = $(this).parent().parent().attr('day');

    if (window.confirm(buildConfirmText(data))) {
      $.ajax({
        method: 'DELETE', url: '/api/v1/treatments/' + data._id, headers: client.headers()
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

  function deleteIfEmpty(data, propertiesToCheck) {
    for (let prop of propertiesToCheck) {
      if (data[prop] === "") {
        delete data[prop]
      }
    }
  }

  function editTreatment(event) {
    const data = JSON.parse($(this).parent().parent().attr('data'));
    const day = $(this).parent().parent().attr('day');

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
      width: 640, height: 800, buttons: [{
        text: translate('Save'), class: 'leftButton', click: function () {
          data.eventType = rpedEventType.val();
          data.foodType = $('#rped_foodType').val();
          data.glucose = $('#rped_glucoseValue').val();
          data.glucoseType = $('#rp_edittreatmentdialog').find('input[name=rp_bginput]:checked').val();
          data.carbs = $('#rped_carbsGiven').val();
          data.absorptionTime = $('#rped_absorptionTime').val();
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

          deleteIfEmpty(data, ['protein', 'fat', 'profile', 'absolute', 'duration'])

          $(this).dialog('close');

          saveTreatmentRecord(data);
          delete datastorage[day];
          report_plugins.show();
        }
      }, {
        text: translate('Cancel'), click: function () {
          $(this).dialog('close');
        }
      }], open: function () {
        $(this).parent().css('box-shadow', '10px 10px 10px 0px gray');
        $(this).parent().find('.ui-dialog-buttonset').css({'width': '100%', 'text-align': 'right'});
        rpedEventType.val(data.eventType);
        rpedEventType.attr("disabled", true);
        let rpedFoodType = $('#rped_foodType');
        rpedFoodType.val(data.foodType);
        console.info('eventType: ' + data.eventType)
        if (data.eventType === 'Carb Correction') {
          rpedFoodType.parent().css({'display': 'block'})
        } else {
          rpedFoodType.parent().css({'display': 'none'})
        }
        $('#rped_glucoseValue').val(data.glucose).attr('placeholder', translate('Value in') + ' ' + options.units);
        $('#rped_bgfromsensor').prop('checked', data.glucoseType === 'Sensor');
        $('#rped_bgfrommeter').prop('checked', data.glucoseType === 'Finger');
        $('#rped_bgmanual').prop('checked', data.glucoseType === 'Manual');
        $('#rped_carbsGiven').val(data.carbs);
        $('#rped_absorptionTime').val(data.absorptionTime);
        $('#rped_proteinGiven').val(data.protein);
        $('#rped_fatGiven').val(data.fat);
        $('#rped_insulinGiven').val(data.insulin);
        $('#rped_duration').val(data.duration);
        $('#rped_percent').val(data.percent);
        $('#rped_absolute').val(data.absolute);
        $('#rped_profile').val(data.profile);
        $('#rped_adnotes').val(data.notes);
        $('#rped_enteredBy').val(data.enteredBy);
        $('#rped_eventTimeValue').val(moment(data.created_at).format('HH:mm'));
        $('#rped_eventDateValue').val(moment(data.created_at).format('YYYY-MM-DD'));
        $('#rp_edittreatmentdialog').focus();
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
      method: 'PUT', url: '/api/v1/treatments/', headers: client.headers(), data: data
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

  const table = $('<table id="treatments">');
  table.addClass('treatments');

  const editableEventTypes = client.careportal.events.map((e) => e.name);

  sorteddaystoshow.forEach(function (day) {

    let tableHeader = $('<thead>')
      .append($('<tr>')
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
        .append($('<th>').append(translate('Notes'))))
      .append($('<tr>')
        .append($('<td>').attr('colspan', 14).addClass('next_day').append(report_plugins.utils.localeDate(day))));
    table.append(tableHeader);

    let tableBody = $('<tbody>');
    table.append(tableBody);

    const treatments = _.clone(datastorage[day].treatments);
    if (options.order === report_plugins.consts.ORDER_NEWESTONTOP) {
      treatments.reverse();
    }
    for (const treatment of treatments) {
      let carbs = (treatment.carbs ? treatment.carbs + 'g' : '') + (treatment.foodType ? ' / ' + treatment.foodType : '') + (treatment.absorptionTime ? ' / ' + (Math.round(treatment.absorptionTime / 60.0 * 10) / 10) + 'h' : '')
      let correctionRangeText = ''
      if (treatment.correctionRange) {
        let min = treatment.correctionRange[0]
        let max = treatment.correctionRange[1]

        if (client.settings.units === 'mmol') {
          max = client.utils.roundBGForDisplay(client.utils.scaleMgdl(max))
          min = client.utils.roundBGForDisplay(client.utils.scaleMgdl(min))
        }

        if (treatment.correctionRange[0] === treatment.correctionRange[1]) {
          correctionRangeText = '' + min;
        } else {
          correctionRangeText = '' + min + ' - ' + max;
        }
      }

      let editCell = $('<td>');
      if (editableEventTypes.includes(treatment.eventType)) {
        editCell
          .append($(`<img src="/images/delete.png" alt="${translate('Delete record')}">`)
            .addClass('deleteTreatment')
            .attr('title', translate('Delete record')))
          .append($(`<img src="/images/edit.png" alt="${translate('Edit record')}">`)
            .addClass('editTreatment')
            .attr('title', translate('Edit record')))
      }

      let description = treatment.eventType ? translate(client.careportal.resolveEventName(treatment.eventType)) + (treatment.reason ? '<br>' + treatment.reason : '') + (treatment.insulinNeedsScaleFactor ? '<br>' + treatment.insulinNeedsScaleFactor * 100 + '%' : '') + (treatment.correctionRange ? ' ' + correctionRangeText : '') : '';
      tableBody.append($('<tr>')
        .addClass('border_bottom')
        .attr('data', JSON.stringify(treatment))
        .attr('day', day)
        .append(editCell)
        .append($('<td>').addClass('time').append(new Date(treatment.created_at).toLocaleTimeString(undefined, dateFormatOptions)))
        .append($('<td>').addClass('text').append(description))
        .append($('<td>').addClass('number').append(treatment.glucose ? treatment.glucose + ' (' + translate(treatment.glucoseType) + ')' : ''))
        .append($('<td>').addClass('number').append(treatment.insulin ? treatment.insulin.toFixed(2) : ''))
        .append($('<td>').addClass('text').append(carbs))
        .append($('<td>').addClass('number').append(treatment.protein ? treatment.protein : ''))
        .append($('<td>').addClass('number').append(treatment.fat ? treatment.fat : ''))
        .append($('<td>').addClass('number').append(treatment.duration ? treatment.duration.toFixed(0) : ''))
        .append($('<td>').addClass('number').append(treatment.percent ? treatment.percent : ''))
        .append($('<td>').addClass('number').append('absolute' in treatment ? treatment.absolute.toFixed(2) : ''))
        .append($('<td>').addClass('text').append(treatment.profile ? treatment.profile : ''))
        .append($('<td>').addClass('text').append(treatment.enteredBy ? treatment.enteredBy : ''))
        .append($('<td>').addClass('text').append(treatment.notes ? treatment.notes : '')))
    }
  })

  const div = $('<div>')
  let filterInput = $('<input id="filter-text" type="text">');
  filterInput.attr('placeholder', translate('filter table data...'));
  div.append(filterInput)
  div.append(table)

  $('#treatments-report').html(div)
  $('.deleteTreatment').click(deleteTreatment)
  $('.editTreatment').click(editTreatment)

  $(document).ready(function () {
    $("#filter-text").on("keyup", function () {
      const value = $(this).val().toLowerCase();
      $("#treatments tbody tr").filter(function () {
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
      });
    });
  });
};
