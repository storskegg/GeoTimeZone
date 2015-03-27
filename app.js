(function($, _h) {
  $(function() {
    var tmpl = {
      geolocation_display: _h.compile($('#tmpl_geolocation_display').html()),
      timestamp_now: _h.compile($('#tmpl_timestamp_now').html()),
      timezone_info: _h.compile($('#tmpl_timezone_info').html()),
      alerts: _h.compile($('#tmpl_alerts').html())
    };

    var update_geolocation_display = function(data) {
      $('#geolocation_display').html(tmpl.geolocation_display(data));
    };
    var update_timestamp_now = function(data) {
      $('#timestamp_now').html(tmpl.timestamp_now(data));
    };
    var update_timezone_info = function(data) {
      $('#timezone_info').html(tmpl.timezone_info(data));
    };
    var update_alerts = function() {};

    var get_timezone = function(latitude, longitude, timestamp, useStore) {
      var uri = 'https://maps.googleapis.com/maps/api/timezone/json?location=' + latitude + ',' + longitude + '&timestamp=' + timestamp;
      $.getJSON(uri, function(data) {
        if (useStore) {
          store.set('last_timezone_id', data.timeZoneId);
          store.set('last_timezone_name', data.timeZoneName);
        }
        update_timezone_info(data);
      }).fail(function(data) {alert('fail');});
    };

    var get_geolocation = function(useStore) {
      useStore = !!useStore;	// Just forcing a boolean here

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
          if (useStore) {
            store.set('last_latitude', position.coords.latitude);
            store.set('last_longitude', position.coords.longitude);
          }

          update_geolocation_display({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });

          get_timezone(position.coords.latitude, position.coords.longitude, now.unix(), useStore);
        });
      } else {
        $('#alerts').append(tmpl.alerts({
          type: 'warning',
          location: 'top',
          msg: {
            heading: 'Warning',
            body: 'Geolocation is unsupported or disabled in your browser.'
          }
        }));
      }
    };

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

    get_geolocation(store.enabled);
    setInterval(function() {
      get_geolocation(store.enabled);
    }, 60 * 60 * 1000);
  });
}(jQuery, Handlebars));
