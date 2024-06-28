  function processPolylines(p) {var lines = Array(p.length); if (!p || p.length == 0) return; // array to keep track of loaded geojson polylines
    var pos = (getSetting('_polylinesLegendPos') == 'off') ? 'topleft'  : getSetting('_polylinesLegendPos');
    var polylinesLegend = L.control.layers(null, null, {position: pos,  collapsed: false, });
    for (i = 0; i < p.length; i++) {
      $.getJSON(p[i]['GeoJSON URL'], function(index) {return function(data) { latlng = [];  for (l in data['features']) {latlng.push(data['features'][l].geometry.coordinates);  }
          // Reverse [lon, lat] to [lat, lon] for each point
          for (l in latlng) {for (c in latlng[l]) {latlng[l][c].reverse(); if (latlng[l][c].length == 3) {latlng[l][c].shift();}}     } // If coords contained 'z' (altitude), remove it
          var line = L.polyline(latlng, {color: (p[index]['Color'] == '') ? 'grey' : p[index]['Color'], weight: trySetting('_polylinesWeight', 2), pane: 'shadowPane' })
          lines[index] = line; line.addTo(map); if (p[index]['Description'] && p[index]['Description'] != '') {line.bindPopup(p[index]['Description']);}
          if (index == 0) {if (polylinesLegend._container) {polylinesLegend._container.id = 'polylines-legend'; polylinesLegend._container.className += ' ladder'; }
            if (getSetting('_polylinesLegendTitle') != '') {
              $('#polylines-legend').prepend('<h6 class="pointer">' + getSetting('_polylinesLegendTitle') + '</h6>');
              if (getSetting('_polylinesLegendIcon') != '') {$('#polylines-legend h6').prepend('<span class="legend-icon"><i class="fas ' + getSetting('_polylinesLegendIcon') + '"></i></span>'); }
              // Add map title if set to be displayed in polylines legend
              if (getSetting('_mapTitleDisplay') == 'in polylines legend') {var title = '<h3>' + getSetting('_mapTitle') + '</h3>'; var subtitle = '<h6>' + getSetting('_mapSubtitle') + '</h6>';
                                                                $('#polylines-legend').prepend(title + subtitle); } } }
          if ( lines.filter(Boolean).length == p.length ) { completePolylines = true;// only if all polylines loaded
            // Add polylines to the legend - we do this after all lines are loaded
            for (let j = 0; j < p.length; j++) {polylinesLegend.addOverlay(lines[j],'<i class="color-line" style="background-color:' + p[j]['Color'] + '"></i> ' + p[j]['Display Name']); } } };  }(i)); }
    if (getSetting('_polylinesLegendPos') !== 'off') {polylinesLegend.addTo(map);} }

  function togglePolygonLabels() {/** * Turns on and off polygon text labels depending on current map zoom */
    for (i in allTextLabels) {if (map.getZoom() <= tryPolygonSetting(i, '_polygonLabelZoomLevel', 9)) {$('.polygon-label' + i).hide();} 
    else {if ($('.polygons-legend' + i + ' input[name=prop]:checked').val() != '-1') {$('.polygon-label' + i).show(); }      }    }  }

  /** Reformulates documentSettings as a dictionary, e.g. {"webpageTitle": "Leaflet Boilerplate", "infoPopupText": "Stuff"}  */
  function createDocumentSettings(settings) {for (var i in settings) {var setting = settings[i]; documentSettings[setting.Setting] = setting.Customize; } }

  /** Reformulates polygonSettings as a dictionary, e.g. {"webpageTitle": "Leaflet Boilerplate", "infoPopupText": "Stuff"} */
  function createPolygonSettings(settings) { var p = {}; for (var i in settings) {var setting = settings[i];  p[setting.Setting] = setting.Customize; }
    polygonSettings.push(p);  }

  // Returns a string that contains digits of val split by comma evey 3 positions  // Example: 12345678 -> "12,345,678"
  function comma(val) { while (/(\d+)(\d{3})/.test(val.toString())) {val = val.toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2'); }
      return val;  }
      
  function getPolygonSetting(p, s) {if (polygonSettings[p]) {return polygonSettings[p][constants[s]]; }
    return false;}

  /** Returns the value of setting named s from constants.js or def if setting is either not set or does not exist Both arguments are strings e.g. trySetting('_authorName', 'No Author') */
  function trySetting(s, def) {s = getSetting(s); if (!s || s.trim() === '') { return def; }
    return s;  }
  function tryPolygonSetting(p, s, def) {s = getPolygonSetting(p, s); if (!s || s.trim() === '') { return def; }
    return s;  }