  function onMapDataLoad(options, points, polylines) {createDocumentSettings(options); document.title = getSetting('_mapTitle'); addBaseMap();  // Add point markers to the map
    var layers;  var group = ''; if (points && points.length > 0) {layers = determineLayers(points); group = mapPoints(points, layers);} else {completePoints = true;}
    centerAndZoomMap(group);  if (polylines && polylines.length > 0) {processPolylines(polylines); } else {completePolylines = true;} // Add polylines
    if (getPolygonSetting(0, '_polygonsGeojsonURL') && getPolygonSetting(0, '_polygonsGeojsonURL').trim()) {loadAllGeojsons(0);} else {completePolygons = true;}  // Add polygons
    if (getSetting('_mapSearch') !== 'off') { var geocoder = L.Control.geocoder({expand: 'click', position: getSetting('_mapSearch'), // Add Nominatim Search control
        geocoder: L.Control.Geocoder.nominatim({geocodingQueryParams: { viewbox: '',  bounded: 1, }   }),  }).addTo(map); // by default, viewbox is empty
    function updateGeocoderBounds() {var bounds = map.getBounds(); 
      geocoder.options.geocoder.options.geocodingQueryParams.viewbox = [ bounds._southWest.lng, bounds._southWest.lat, bounds._northEast.lng, bounds._northEast.lat].join(',');}
      map.on('moveend', updateGeocoderBounds); } // Update search viewbox coordinates every time the map moves
    // Add location control
    if (getSetting('_mapMyLocation') !== 'off') {var locationControl = L.control.locate({ keepCurrentZoomLevel: true,returnToPrevBounds: true, position: getSetting('_mapMyLocation') }).addTo(map); }
    if (getSetting('_mapZoom') !== 'off') {L.control.zoom({position: getSetting('_mapZoom')}).addTo(map); } // Add zoom control
    map.on('zoomend', function() { togglePolygonLabels(); });  addTitle(); changeAttribution(); // Change Map attribution to include author's info + urls
    // Append icons to categories in markers legend
    $('#points-legend input+span').each(function(i) { var g = $(this).text().trim(); // add to <span> that follows <input>
      var legendIcon =(group2color[ g ].indexOf('.') > 0) ? '<img src="' +group2color[ g ] +'" class="markers-legend-icon">':'&nbsp;<i class="fas fa-map-marker" style="color: '+group2color[ g ] + '"></i>';
      $(this).prepend(legendIcon);  }); showMap(); // When all processing is done, hide the loader and make the map visible
    function showMap() {
      if (completePoints && completePolylines && completePolygons) {$('.ladder h6').append('<span class="legend-arrow"><i class="fas fa-chevron-down"></i></span>'); $('.ladder h6').addClass('minimize');
        for (i in allPolygonLegends) {if (getPolygonSetting(i, '_polygonsLegendIcon') != '') { 
                            $('.polygons-legend' + i + ' h6').prepend('<span class="legend-icon"><i class="fas ' + getPolygonSetting(i, '_polygonsLegendIcon') + '"></i></span>'); }  }
        $('.ladder h6').click(function() {
          if ($(this).hasClass('minimize')) {$('.ladder h6').addClass('minimize'); $('.legend-arrow i').removeClass('fa-chevron-up').addClass('fa-chevron-down');
            $(this).removeClass('minimize') .parent().find('.legend-arrow i') .removeClass('fa-chevron-down') .addClass('fa-chevron-up');
          } else {$(this).addClass('minimize'); $(this).parent().find('.legend-arrow i') .removeClass('fa-chevron-up') .addClass('fa-chevron-down');  }      });
        $('.ladder h6').first().click();  $('#map').css('visibility', 'visible');  $('.loader').hide();
        if (getSetting('_introPopupText') != '') {initIntroPopup(getSetting('_introPopupText'), map.getCenter()); }; // Open intro popup window in the center of the map
        togglePolygonLabels();} else {setTimeout(showMap, 50); }    }
    var ga = getSetting('_googleAnalytics'); console.log(ga) // Add Google Analytics if the ID exists
    if ( ga && ga.length >= 10 ) { var gaScript = document.createElement('script'); gaScript.setAttribute('src','https://www.googletagmanager.com/gtag/js?id=' + ga);
      document.head.appendChild(gaScript); window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date());  gtag('config', ga); }  }

  /** Changes map attribution (author, GitHub repo, email etc.) in bottom-right */
  function changeAttribution() {var attributionHTML = $('.leaflet-control-attribution')[0].innerHTML; var credit = 'View <a href="' + googleDocURL + '" target="_blank">data</a>';
    var name = getSetting('_authorName'); var url = getSetting('_authorURL');
    if (name && url) { if (url.indexOf('@') > 0) { url = 'mailto:' + url; } credit += ' by <a href="' + url + '">' + name + '</a> | '; } else if (name) {  credit += ' by ' + name + ' | ';
    } else {credit += ' | ';}
    credit += 'View <a href="' + getSetting('_githubRepo') + '">code</a>';  if (getSetting('_codeCredit')) credit += ' by ' + getSetting('_codeCredit');  credit += ' with ';

  function addTitle() {var dispTitle = getSetting('_mapTitleDisplay'); /** Adds title and subtitle from the spreadsheet to the map  */
    if (dispTitle !== 'off') {var title = '<h3 class="pointer">' + getSetting('_mapTitle') + '</h3>'; var subtitle = '<h5>' + getSetting('_mapSubtitle') + '</h5>';
      if (dispTitle == 'topleft') {$('div.leaflet-top').prepend('<div class="map-title leaflet-bar leaflet-control leaflet-control-custom">' + title + subtitle + '</div>');
      } else if (dispTitle == 'topcenter') {$('#map').append('<div class="div-center"></div>');
                                            $('.div-center').append('<div class="map-title leaflet-bar leaflet-control leaflet-control-custom">' + title + subtitle + '</div>');  }
      $('.map-title h3').click(function() { location.reload(); });    }  }
  /** Adds polylines to the map  */
  function initIntroPopup(info, coordinates) { // This is a pop-up for mobile device
    if (window.matchMedia("only screen and (max-width: 760px)").matches) {$('body')
        .append('<div id="mobile-intro-popup"><p>' + info +'</p><div id="mobile-intro-popup-close"><i class="fas fa-times"></i></div></div>');
      $('#mobile-intro-popup-close').click(function() {$("#mobile-intro-popup").hide(); });  return;  }
    /* And this is a standard popup for bigger screens */
    L.popup({className: 'intro-popup'}) .setLatLng(coordinates) // this needs to change
      .setContent(info).openOn(map); }

    $('.leaflet-control-attribution')[0].innerHTML = credit + attributionHTML; }
  /** Loads the basemap and adds it to the map */
  function addBaseMap() {var basemap = trySetting('_tileProvider', 'CartoDB.Positron'); L.tileLayer.provider(basemap, {maxZoom: 18,  // Pass the api key to most commonly used parameters
      apiKey: trySetting('_tileProviderApiKey', ''),  apikey: trySetting('_tileProviderApiKey', ''), key: trySetting('_tileProviderApiKey', ''),  accessToken: trySetting('_tileProviderApiKey', '')
    }).addTo(map);
    L.control.attribution({position: trySetting('_mapAttribution', 'bottomright') }).addTo(map); }
  /** Returns the value of a setting s getSetting(s) is equivalent to documentSettings[constants.s] */
  function getSetting(s) {return documentSettings[constants[s]];} /** Returns the value of a setting s getSetting(s) is equivalent to documentSettings[constants.s] */