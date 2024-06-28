  /** Returns an Awesome marker with specified parameters  */
  function createMarkerIcon(icon, prefix, markerColor, iconColor) {return L.AwesomeMarkers.icon({icon: icon,  prefix: prefix,  markerColor: markerColor,  iconColor: iconColor  });  }
  /** Sets the map view so that all markers are visible, or to specified (lat, lon) and zoom if all three are specified */
  function centerAndZoomMap(points) {var lat = map.getCenter().lat, latSet = false; var lon = map.getCenter().lng, lonSet = false;  var zoom = 12, zoomSet = false;  var center;
    if (getSetting('_initLat') !== '') {lat = getSetting('_initLat'); latSet = true;}
    if (getSetting('_initLon') !== '') {lon = getSetting('_initLon'); lonSet = true;}
    if (getSetting('_initZoom') !== '') {zoom = parseInt(getSetting('_initZoom')); zoomSet = true;}
    if ((latSet && lonSet) || !points) {center = L.latLng(lat, lon);} else {center = points.getBounds().getCenter();}
    if (!zoomSet && points) {zoom = map.getBoundsZoom(points.getBounds());}
    map.setView(center, zoom); }
  /** Given a collection of points, determines the layers based on 'Group' column in the spreadsheet. */
  function determineLayers(points) {var groups = []; var layers = {};
    for (var i in points) {var group = points[i].Group;
      if (group && groups.indexOf(group) === -1) {groups.push(group); // Add group to groups
        group2color[ group ] = points[i]['Marker Icon'].indexOf('.') > 0 ? points[i]['Marker Icon'] : points[i]['Marker Color']; } }         // Add color to the crosswalk
    if (groups.length === 0) {layers = undefined;} else {for (var i in groups) { var name = groups[i]; layers[name] = L.layerGroup();  layers[name].addTo(map);  }  }
    return layers; }     // if none of the points have named layers, return no layers
  /** Assigns points to appropriate layers and clusters them if needed  */
  function mapPoints(points, layers) {var markerArray = [];
    for (var i in points) {var point = points[i]; // check that map has loaded before adding points to it?
      // If icon contains '.', assume it's a path to a custom icon, otherwise create a Font Awesome icon
      var iconSize = point['Custom Size']; var size = (iconSize.indexOf('x') > 0) ? [parseInt(iconSize.split('x')[0]), parseInt(iconSize.split('x')[1])] : [32, 32];
      var anchor = [size[0] / 2, size[1]]; var icon = (point['Marker Icon'].indexOf('.') > 0) ? L.icon({iconUrl: point['Marker Icon'], iconSize: size, iconAnchor: anchor}) 
                                                               : createMarkerIcon(point['Marker Icon'], 'fa', point['Marker Color'].toLowerCase(),  point['Icon Color']   );
      if (point.Latitude !== '' && point.Longitude !== '') {var marker = L.marker([point.Latitude, point.Longitude], {icon: icon})
          .bindPopup("<b>" + point['Name'] + '</b><br>' + (point['Image'] ? ('<img src="' + point['Image'] + '"><br>') : '') + point['Description']);
        if (layers !== undefined && layers.length !== 1) {marker.addTo(layers[point.Group]);}
        markerArray.push(marker);}
    }
    var group = L.featureGroup(markerArray); var clusters = (getSetting('_markercluster') === 'on') ? true : false;
    // if layers.length === 0, add points to map instead of layer
    if (layers === undefined || layers.length === 0) {map.addLayer(clusters ? L.markerClusterGroup().addLayer(group).addTo(map) : group );
    } else {
      if (clusters) {multilayerClusterSupport = L.markerClusterGroup.layerSupport(); multilayerClusterSupport.addTo(map); // Add multilayer cluster support
        for (i in layers) {multilayerClusterSupport.checkIn(layers[i]); layers[i].addTo(map);} }
      var pos = (getSetting('_pointsLegendPos') == 'off') ? 'topleft' : getSetting('_pointsLegendPos'); var pointsLegend = L.control.layers(null, layers, {collapsed: false, position: pos, });
      if (getSetting('_pointsLegendPos') !== 'off') {pointsLegend.addTo(map); pointsLegend._container.id = 'points-legend'; pointsLegend._container.className += ' ladder'; }    }

    $('#points-legend').prepend('<h6 class="pointer">' + getSetting('_pointsLegendTitle') + '</h6>');
    if (getSetting('_pointsLegendIcon') != '') { $('#points-legend h6').prepend('<span class="legend-icon"><i class="fas ' + getSetting('_pointsLegendIcon') + '"></i></span>'); }
    var displayTable = getSetting('_displayTable') == 'on' ? true : false; // Display table with active points if specified
    var columns = getSetting('_tableColumns').split(',')  .map(Function.prototype.call, String.prototype.trim);

    if (displayTable && columns.length > 1) {tableHeight = trySetting('_tableHeight', 40); if (tableHeight < 10 || tableHeight > 90) {tableHeight = 40;}
      $('#map').css('height', (100 - tableHeight) + 'vh'); map.invalidateSize();
      var colors = getSetting('_tableHeaderColor').split(','); // Set background (and text) color of the table header
      if (colors[0] != '') {$('table.display').css('background-color', colors[0]); if (colors.length >= 2) { $('table.display').css('color', colors[1]); } }
      map.on('moveend', updateTable); map.on('layeradd', updateTable); map.on('layerremove', updateTable); // Update table every time the map is moved/zoomed or point layers are toggled

      function updateTable() {var pointsVisible = []; // Clear table data and add only visible markers to it
        for (i in points) {
          if (map.hasLayer(layers[points[i].Group]) && map.getBounds().contains(L.latLng(points[i].Latitude, points[i].Longitude))) {pointsVisible.push(points[i]);} }
        tableData = pointsToTableData(pointsVisible); table.clear(); table.rows.add(tableData); table.draw();}
      function pointsToTableData(ms) {var data = []; // Convert Leaflet marker objects into DataTable array
        for (i in ms) {var a = []; for (j in columns) {a.push(ms[i][columns[j]]);}
          data.push(a);  }
        return data;  }
      function generateColumnsArray() {// Transform columns array into array of title objects
        var c = []; for (i in columns) {c.push({title: columns[i]});}
        return c;}
      // Initialize DataTable
      var table = $('#maptable').DataTable({paging: false, scrollCollapse: true, scrollY: 'calc(' + tableHeight + 'vh - 40px)', info: false, searching: false, columns: generateColumnsArray(), }); }
    completePoints = true;  return group;  }