  function loadAllGeojsons(p) {
    if (p < polygonSettings.length && getPolygonSetting(p, '_polygonsGeojsonURL').trim()) {// Pre-process popup properties to be used in onEachFeature below
      polygon = p; var popupProperties = getPolygonSetting(p, '_popupProp').split(';'); for (i in popupProperties) { popupProperties[i] = popupProperties[i].split(','); }
      allPopupProperties.push(popupProperties);// Load geojson
      $.getJSON(getPolygonSetting(p, '_polygonsGeojsonURL').trim(), function(data) {geoJsonLayer = L.geoJson(data, {onEachFeature: onEachFeature, pointToLayer: function(feature, latlng) {
              return L.circleMarker(latlng, { className: 'geojson-point-marker' });            }          });  allGeojsons.push(geoJsonLayer);    loadAllGeojsons(p+1);   });    } 
    else {processAllPolygons();}
  }
  
  function processAllPolygons() {var p = 0;  // polygon sheet
    while (p < polygonSettings.length && getPolygonSetting(p, '_polygonsGeojsonURL').trim()) {isNumerical = []; divisors = []; colors = [];
      polygonLayers = getPolygonSetting(p, '_polygonLayers').split(';'); for (i in polygonLayers) { polygonLayers[i] = polygonLayers[i].split(','); }
      divisors = getPolygonSetting(p, '_bucketDivisors').split(';'); 
      if (divisors.length != polygonLayers.length) {alert('Error in Polygons: The number of sets of divisors has to match the number of properties'); return;}
      colors = getPolygonSetting(p, '_bucketColors').split(';');
      for (i = 0; i < divisors.length; i++) {divisors[i] = divisors[i].split(','); for (j = 0; j < divisors[i].length; j++) {divisors[i][j] = divisors[i][j].trim(); }
        if (!colors[i]) {colors[i] = []; } else {colors[i] = colors[i].split(','); } }

      for (i = 0; i < divisors.length; i++) {if (divisors[i].length == 0) {alert('Error in Polygons: The number of divisors should be > 0'); return; } // Stop here
      else if (colors[i].length == 0) {// If no colors specified, generate the colors
          colors[i] = palette(tryPolygonSetting(p, '_colorScheme', 'tol-sq'), divisors[i].length); for (j = 0; j < colors[i].length; j++) {colors[i][j] = '#' + colors[i][j].trim();}
        } else if (divisors[i].length != colors[i].length) {alert('Error in Polygons: The number of divisors should match the number of colors'); return; } // Stop here
      }

      // For each set of divisors, decide whether textual or numerical
      for (i = 0; i < divisors.length; i++) {if (!isNaN(parseFloat(divisors[i][0].trim()))) {isNumerical[i] = true;
          for (j = 0; j < divisors[i].length; j++) {divisors[i][j] = parseFloat(divisors[i][j].trim());} } else {isNumerical[i] = false; }}

      allDivisors.push(divisors); allColors.push(colors); allIsNumerical.push(isNumerical);  allPolygonLayers.push(polygonLayers);
      var legendPos = tryPolygonSetting(p, '_polygonsLegendPosition', 'off');  polygonsLegend = L.control({position: (legendPos == 'off') ? 'topleft' : legendPos});
      polygonsLegend.onAdd = function(map) {var content = '<h6 class="pointer">' + getPolygonSetting(p, '_polygonsLegendTitle') + '</h6>';  content += '<form>';
        for (i in polygonLayers) {var layer = polygonLayers[i][1] ? polygonLayers[i][1].trim() : polygonLayers[i][0].trim(); layer = (layer == '') ? 'On' : layer;
          content += '<label><input type="radio" name="prop" value="' + p + ';' + i + '"> ';  content += layer + '</label><br>';     }
        content += '<label><input type="radio" name="prop" value="' + p + ';-1"> Off</label></form><div class="polygons-legend-scale">';
        var div = L.DomUtil.create('div', 'leaflet-control leaflet-control-custom leaflet-bar ladder polygons-legend' + p); div.innerHTML = content; div.innerHTML += '</div>'; return div; };
      polygonsLegend.addTo(map); if (getPolygonSetting(p, '_polygonsLegendPosition') == 'off') { $('.polygons-legend' + p).css('display', 'none'); }
      allPolygonLegends.push(polygonsLegend);  p++;}
    
    for (var i in allTextLabels) {var g = L.featureGroup(allTextLabels[i]);  allTextLabelsLayers.push(g); } // Generate polygon labels layers

    // This is triggered when user changes the radio button
    $('.ladder input:radio[name="prop"]').change(function() {polygon = parseInt($(this).val().split(';')[0]); layer = parseInt($(this).val().split(';')[1]);
      if (layer == -1) {$('.polygons-legend' + polygon).find('.polygons-legend-scale').hide();
        if (map.hasLayer(allGeojsons[polygon])) {map.removeLayer(allGeojsons[polygon]);
          if (map.hasLayer(allTextLabelsLayers[polygon])) {map.removeLayer(allTextLabelsLayers[polygon]); } } } 
      else {updatePolygons(); }    });
    for (t = 0; t < p; t++) {if (getPolygonSetting(t, '_polygonShowOnStart') == 'on') {$('.ladder input:radio[name="prop"][value="' + t + ';0"]').click();
      } else {$('.ladder input:radio[name="prop"][value="' + t + ';-1"]').click(); }    }
    $('.polygons-legend-merged h6').eq(0).click().click();  completePolygons = true; }
    
    
  function updatePolygons() { p = polygon; z = layer; allGeojsons[p].setStyle(polygonStyle);
    if (!map.hasLayer(allGeojsons[p])) {map.addLayer(allGeojsons[p]); if (!map.hasLayer(allTextLabelsLayers[p]) && allTextLabelsLayers[p]) { map.addLayer(allTextLabelsLayers[p]); } }
    doubleClickPolylines();
    // If no scale exists: hide the legend. Ugly temporary fix. Can't use 'hide' because it is later toggled
    if (allDivisors[p][z] == '') { $('.polygons-legend' + p).find('.polygons-legend-scale').css( {'margin': '0px', 'padding': '0px', 'border': '0px solid'} );  return; }
    $('.polygons-legend' + p + ' .polygons-legend-scale').html('');  var labels = []; var from, to, isNum, color;
    for (var i = 0; i < allDivisors[p][z].length; i++) {var isNum = allIsNumerical[p][z]; var from = allDivisors[p][z][i];  var to = allDivisors[p][z][i+1];
      var color = getColor(from);  from = from ? comma(from) : from;  to = to ? comma(to) : to;
      labels.push('<i style="background:' + color + '; opacity: ' + tryPolygonSetting(p, '_colorOpacity', '0.7') + '"></i> ' + from + ((to && isNum) ? '&ndash;' + to : (isNum) ? '+' : '')); }
    $('.polygons-legend' + p + ' .polygons-legend-scale').html(labels.join('<br>'));  $('.polygons-legend' + p + ' .polygons-legend-scale').show();
    togglePolygonLabels(); }
  /** Generates CSS for each geojson feature */
  function polygonStyle(feature) {var value = feature.properties[allPolygonLayers[polygon][layer][0].trim()];  // Point style
    if (feature.geometry.type == 'Point') { return {radius: 4, weight: 1, opacity: 1, color: getColor(value), fillOpacity: tryPolygonSetting(polygon, '_colorOpacity', '0.7'), fillColor: 'white' }} 
    else {return {  // Polygon and Polyline style
         weight: 2, opacity: 1, color: tryPolygonSetting(polygon, '_outlineColor', 'white'), dashArray: '3', fillOpacity: tryPolygonSetting(polygon, '_colorOpacity', '0.7'), fillColor: getColor(value)} }}
  /** Returns a color for polygon property with value d */
  function getColor(d) { var num = allIsNumerical[polygon][layer];  var col = allColors[polygon][layer]; var div = allDivisors[polygon][layer];  var i;
    if (num) {i = col.length - 1; while (d < div[i]) i -= 1;} else {for (i = 0; i < col.length - 1; i++) { if (d == div[i]) break; } }
    if (!col[i]) {i = 0} return col[i];  }
  /** Generates popup windows for every polygon */
  function onEachFeature(feature, layer) { // Do not bind popups if 1. no popup properties specified and 2. display images is turned off.
    if (getPolygonSetting(polygon, '_popupProp') == '' && getPolygonSetting(polygon, '_polygonDisplayImages') == 'off') return;  var info = '';  props = allPopupProperties[polygon];
    for (i in props) { if (props[i] == '') { continue; }
      info += props[i][1] ? props[i][1].trim() : props[i][0].trim();  var val = feature.properties[props[i][0].trim()];  info += ': <b>' + (val ? comma(val) : val) + '</b><br>';  }
    if (getPolygonSetting(polygon, '_polygonDisplayImages') == 'on') {if (feature.properties['img']) {info += '<img src="' + feature.properties['img'] + '">'; } }
    layer.bindPopup(info); if (!allTextLabels[polygon]) { allTextLabels.push([]) } // Add polygon label if needed
    if (getPolygonSetting(polygon, '_polygonLabel') !== '') {
      var myTextLabel = L.marker(polylabel(layer.feature.geometry.coordinates, 1.0).reverse(), {
        icon: L.divIcon({className: 'polygon-label' + polygon + ' polygon-label', html: feature.properties[getPolygonSetting(polygon, '_polygonLabel')], })  });
      allTextLabels[polygon].push(myTextLabel);    }  }
  /** Perform double click on polyline legend checkboxes so that they get redrawn and thus get on top of polygons  */
  function doubleClickPolylines() {$('#polylines-legend form label input').each(function(i) {$(this).click().click(); });  }