var width = window.innerWidth,
    height = window.innerHeight;

    var OD_PAIRS = [
      ["深圳", "伦敦"],
      ["北京", "纽约"],
      ["上海", "东京"],
      ["广州", "首尔"]
    ];

    var projection = d3.geo.mercator()
      .scale(110)
      .translate([width / 2, height/ 2]);

    var path = d3.geo.path()
      .pointRadius(2)
      .projection(projection);

    var svg = d3.select("#map")
      .append("svg")
      .attr("class", "main")
      .attr("width", width)
      .attr("height", height);


    var airportMap = {};

    function transition(plane, route) {
      var l = route.node().getTotalLength();
      console.log(l)
      plane.transition()
        .duration(l * 50)
        .attrTween("transform", delta(plane, route.node())) // move plane to co
        .each("end", function() { route.remove(); })
        .remove();
    }

    function delta(plane, path) {
      var l = path.getTotalLength();
      var plane = plane;
      return function(i) {
        return function(t) {
          var p = path.getPointAtLength(t * l); // return coordinate
          var t2 = Math.min(t + 0.05, 1);
          var p2 = path.getPointAtLength(t2 * l);
          var x = p2.x - p.x;
          var y = p2.y - p.y;
          var r = 90 - Math.atan2(-y, x) * 180 / Math.PI;
          var s = Math.min(Math.sin(Math.PI * t) * 0.7, 0.3);
          return "translate(" + p.x + "," + p.y + ") scale(" + s + ") rotate(" + r + ")";
        }
      }
    }

    function fly(origin, destination) {
      // Draw flight path
      var route = svg.append("path")
        .datum({type: "LineString", coordinates: [airportMap[origin], airportMap[destination]]})
        .attr("class", "route")
        .attr("d", path);

      // Draw SVG plane
      var plane = svg.append("path")
        .attr("class", "plane")
        .attr("d", "m25.21488,3.93375c-0.44355,0 -0.84275,0.18332 -1.17933,0.51592c-0.33397,0.33267 -0.61055,0.80884 -0.84275,1.40377c-0.45922,1.18911 -0.74362,2.85964 -0.89755,4.86085c-0.15655,1.99729 -0.18263,4.32223 -0.11741,6.81118c-5.51835,2.26427 -16.7116,6.93857 -17.60916,7.98223c-1.19759,1.38937 -0.81143,2.98095 -0.32874,4.03902l18.39971,-3.74549c0.38616,4.88048 0.94192,9.7138 1.42461,13.50099c-1.80032,0.52703 -5.1609,1.56679 -5.85232,2.21255c-0.95496,0.88711 -0.95496,3.75718 -0.95496,3.75718l7.53,-0.61316c0.17743,1.23545 0.28701,1.95767 0.28701,1.95767l0.01304,0.06557l0.06002,0l0.13829,0l0.0574,0l0.01043,-0.06557c0,0 0.11218,-0.72222 0.28961,-1.95767l7.53164,0.61316c0,0 0,-2.87006 -0.95496,-3.75718c-0.69044,-0.64577 -4.05363,-1.68813 -5.85133,-2.21516c0.48009,-3.77545 1.03061,-8.58921 1.42198,-13.45404l18.18207,3.70115c0.48009,-1.05806 0.86881,-2.64965 -0.32617,-4.03902c-0.88969,-1.03062 -11.81147,-5.60054 -17.39409,-7.89352c0.06524,-2.52287 0.04175,-4.88024 -0.1148,-6.89989l0,-0.00476c-0.15655,-1.99844 -0.44094,-3.6683 -0.90277,-4.8561c-0.22699,-0.59493 -0.50356,-1.07111 -0.83754,-1.40377c-0.33658,-0.3326 -0.73578,-0.51592 -1.18194,-0.51592l0,0l-0.00001,0l0,0z")
        .attr("transform", "scale(0.5)");

      transition(plane, route);
    }

    function loaded(error, countries, airports) {
      if (error) {
        return console.log("Error");
      }

      // Load countries
      svg.append("g")
        .attr("class", "countries")
        .selectAll("path")
        .data(topojson.feature(countries, countries.objects.countries).features)
        .enter()
        .append("path")
        .attr("fill", "darkcyan")
        .attr("d", path);

      // Load airports
      var geos = topojson.feature(airports, airports.objects.airports).features;

      svg.append("g")
        .attr("class", "airports")
        .selectAll("path")
        .data(geos)
        .enter()
        .append("path")
        .attr("id", function(d) { return d.id; })
        .attr("d", path);

      for (g in geos) {
        airportMap[geos[g].id] = geos[g].geometry.coordinates;
      }
      var i = 0;
      setInterval(function() {
        if (i > OD_PAIRS.length - 1) {
          i = 0;
        }
        var od = OD_PAIRS[i];
        fly(od[0], od[1]);
        i++;
      }, 150);
    }

    queue()
        .defer(d3.json, "world.json")
        .defer(d3.json, "airports.json")
        .await(loaded);