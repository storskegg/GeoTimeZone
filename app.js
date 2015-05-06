// https://maps.googleapis.com/maps/api/geocode/json?latlng=
(function($, _h) {
  'use strict';

  var update_geolocation_display = function(data) {
    $('#geolocation_display').html(_h.templates.geolocation_display(data));
  };
  var update_timestamp_now = function(data) {
    $('#timestamp_now').html(_h.templates.timestamp_now(data));
  };
  var update_timezone_info = function(data) {
    $('#timezone_info').html(_h.templates.timezone_info(data));
  };
  var update_possible_locations = function(data) {
    $('#possible_locations').html(_h.templates.possible_locations(data));
  };

  var get_timezone = function(latitude, longitude, timestamp, useStore) {
    var uri = 'https://maps.googleapis.com/maps/api/timezone/json?location=' + latitude + ',' + longitude + '&timestamp=' + timestamp;
    $.getJSON(uri, function(data) {
      if (useStore) {
        store.set('last_timezone_id', data.timeZoneId);
        store.set('last_timezone_name', data.timeZoneName);
      }
      update_timezone_info(data);
    }).fail(function(data) {console.error('get timezone failed');});
  };

  var get_possible_locations = function(latitude, longitude) {
    var uri = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + latitude + "," + longitude;
    $.getJSON(uri, function(data) {
      update_possible_locations(data);
    }).fail(function(data) {console.error('get locations failed');});
  };

  var geoloc_success = function(position) {
    if (useStore) {
      store.set('last_latitude', position.coords.latitude);
      store.set('last_longitude', position.coords.longitude);
    }

    update_geolocation_display({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });

    get_timezone(position.coords.latitude, position.coords.longitude, now.unix(), useStore);

    get_possible_locations(position.coords.latitude, position.coords.longitude);
  };
  var geoloc_error = function() {
    console.error('location not available');
  };
  var geoloc_opts = {
    enableHighAccuracy: true,
    maximumAge: 30000,
    timeout: 27000
  };

  var get_geolocation = function(useStore, now) {
    useStore = !!useStore;	// Just forcing a boolean here

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(geoloc_success, geoloc_error, geoloc_opts);
    } else {
      $('#alerts').append(_h.templates.alerts({
        type: 'warning',
        location: 'top',
        msg: {
          heading: 'Warning',
          body: 'Geolocation is unsupported or disabled in your browser.'
        }
      }));
    }
  };

  $(function() {
    $('body').on('click', 'li[loc-details]', function(evt) {
      var place_id = $(this).data('placeid');
      var uri = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4' + place_id + '&key=AIzaSyC09akcDbwI6mzbMVoFhUWmkwEx7F_Az68';
      $.getJSON(uri, function(data) {
        console.info(data);
      }).fail(function(data) { console.error(data); });
    });

    if (_h.templates === undefined) {
      _.templates = {};
    }

    _h.templates = {
      geolocation_display: _h.compile($('#tmpl_geolocation_display').html()),
      timestamp_now: _h.compile($('#tmpl_timestamp_now').html()),
      timezone_info: _h.compile($('#tmpl_timezone_info').html()),
      possible_locations: _h.compile($('#tmpl_possible_locations').html()),
      alerts: _h.compile($('#tmpl_alerts').html())
    };

    _h.partials = _h.templates;

    var latitude = 0;
    var longitude = 0;
    var timezone_id = '';
    var timezone_name = '';
    var now = moment.utc();

    update_timestamp_now({
      utc: {
        pretty: now.format(),
        timestamp: now.unix()
      },
      pretty: now.local().format()
    });

    if (!!store.enabled) {
      // let's store
      latitude = store.get('last_latitude');
      longitude = store.get('last_longitude');
      timezone_id = store.get('last_timezone_id');
      timezone_name = store.get('last_timezone_name');

      if (latitude !== undefined && longitude !== undefined) {
        update_geolocation_display({
          latitude: latitude,
          longitude: longitude
        });
      }

      if (timezone_id !== undefined && timezone_name !== undefined) {
        update_timezone_info({
          timeZoneId: timezone_id,
          timeZoneName: timezone_name
        });
      }
    }

    get_geolocation(store.enabled, now);
    setInterval(function() {
      now = moment.utc();
      get_geolocation(store.enabled, now);
    }, 60 * 60 * 1000);
  });
}(jQuery, Handlebars));
