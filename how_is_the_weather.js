class weather_class {
  async load_data() {
    this.json = await d3.json(
      "https://raw.githubusercontent.com/TungTh/tungth.github.io/master/data/vn-provinces.json"
    );
    // this.load_weather()
    // for (const d in this.json.features){

    await Promise.all(
      this.json.features.map(async (d) => {
        d.name = d.properties.Name.replace(" Province", "").replace("City", "");
        if (d.name == "Dak Lak") {
          d.name = "Buon Ma Thuot";
          // console.log(d.name)
        }
        if (d.name == "Nghe An") {
          d.name = "Vinh";
          // console.log(d.name)
        }
        if (d.name == "Thua Thien Hue") {
          d.name = "Hue";
          // console.log(d.name)
        }
        if (d.name == "Ba Ria - Vung Tau") {
          d.name = "Vung Tau";
          // console.log(d.name)
        }
        if (d.name == "An Giang") {
          d.name = "Chau Doc";
          // console.log(d.name)
        }
        if (d.name == "Hau Giang") {
          d.name = "Can Tho";
          // console.log(d.name)
        }
        if (d.name == "Quang Ninh") {
          d.name = "Ha Long";
          // console.log(d.name)
        }
        if (d.name == "Dong Thap") {
          d.name = "Cao Lanh";
          // console.log(d.name)
        }

        d.vietnamese_name = d.properties.Ten;
        // console.log(d.name)
        d.country_code = "VN";
        var geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${d.name},${d.country_code}&limit=1&appid=${this.apikey}`;
        var geo_res = await fetch(geoUrl);
        var geo_data = await geo_res.json();
        // console.log(d.name, geo_data)
        d.lat = geo_data[0].lat;
        d.lon = geo_data[0].lon;

        var forecastUrl = `http://api.openweathermap.org/data/2.5/forecast/daily?lat=${d.lat}&lon=${d.lon}&appid=${this.apikey}&units=${this.units}&lang=${this.language}&cnt=${this.amount_of_day}`;
        var res = await fetch(forecastUrl);
        var data = await res.json();
        d.data = data.list;
        // console.log(data)
      })
    );
    this.load_map();
  }

  constructor() {
    this.apikey = "b54ce71b1de11dfd1909564195966b51";
    this.json = null;
    this.load_data();
    this.date = 0;
    this.display_param = "";
    this.amount_of_day = 16;
    this.language = "en";
    this.units = "metric";
    this.temp_mode = "temp";
    this.selected = -9999;

    var map_svg = d3.select("#map_svg");
    this.map_width = map_svg.attr("width");
    this.map_height = map_svg.attr("height");

    this.zoom = d3
      .zoom()
      .scaleExtent([1, 5])
      .translateExtent([
        [0, 0],
        [this.map_width, this.map_height],
      ])
      .on("zoom", this.handleZoom);

    d3.select("#map_svg").call(this.zoom);

    this.init_all_chart();
    // function
  }

  next_date() {
    if (this.date < this.amount_of_day - 1) {
      this.date += 1;
      document.getElementById("date_select").selectedIndex = `${this.date}`;
      this.reload_map();
    } else {
      alert("Out Of Bound");
    }
  }
  prev_date() {
    if (this.date >= 1) {
      this.date -= 1;
      document.getElementById("date_select").selectedIndex = `${this.date}`;
      this.reload_map();
    } else {
      alert("Out Of Bound");
    }
  }
  set_date() {
    let input_int = parseInt(document.getElementById("date_select").value);
    if (input_int >= 0 && input_int <= this.amount_of_day - 1) {
      this.date = input_int;
      console.log(this.date);
      this.reload_map();
    }
  }
  set_temp_mode() {
    this.temp_mode = document.getElementById("temp_mode_select").value;
    console.log(this.temp_mode);
    this.reload_map();
    this.reprocess_temp_chart();
  }

  handleZoom(e) {
    d3.select("#the_map").attr("transform", e.transform);
  }

  zoomIn() {
    d3.select("svg").transition().call(this.zoom.scaleBy, 2);
  }

  zoomOut() {
    d3.select("svg").transition().call(this.zoom.scaleBy, 0.5);
  }

  resetZoom() {
    d3.select("svg").transition().call(this.zoom.scaleTo, 1);
  }

  center() {
    d3.select("svg")
      .transition()
      .call(this.zoom.translateTo, 0.5 * this.map_width, 0.5 * this.map_height);
  }

  panLeft() {
    d3.select("svg").transition().call(this.zoom.translateBy, -50, 0);
  }

  panRight() {
    d3.select("svg").transition().call(this.zoom.translateBy, 50, 0);
  }
  panUp() {
    d3.select("svg").transition().call(this.zoom.translateBy, 0, 50);
  }
  panDown() {
    d3.select("svg").transition().call(this.zoom.translateBy, 0, -50);
  }

  load_map(key) {
    var json = this.json;

    var svg = d3.select("#map_svg");
    var width = svg.attr("width");
    var height = svg.attr("height");

    var center = d3.geoCentroid(json);
    // center = [Math.round(center[0]),Math.round(center[1])]

    var scale = height * 3;

    var offset = [width / 2, height / 2];

    var projection = d3
      .geoMercator()
      .scale(scale)
      .center(center)
      .translate(offset);
    var de_path = d3.geoPath().projection(projection);

    // console.log("provinces_data",provinces_data);
    // console.log("map_dat", json);
    json.features.forEach((d) => {
      // console.log(d)
      d.today_weather = d.data[this.date];
      // Rain handler
      if (d.today_weather.rain) {
        d.today_weather.rain_text = d.today_weather.rain + "mm";
      } else {
        d.today_weather.rain = 0;
        d.today_weather.rain_text = "N/A";
      }
    });
    svg
      .append("g")
      .attr("id", "the_map")
      .selectAll("path")
      .data(json.features)
      .enter()
      .append("path")
      .attr("lat", (d) => d.lat)
      .attr("lon", (d) => d.lon)
      .attr("name", (d) => d.vietnamese_name)
      .attr("day_temp", (d) => d.today_weather[this.temp_mode].day)
      .attr("night_temp", (d) => d.today_weather[this.temp_mode].night)
      .attr("eve_temp", (d) => d.today_weather[this.temp_mode].eve)
      .attr("mor_temp", (d) => d.today_weather[this.temp_mode].morn)

      .attr("humidity", (d) => d.today_weather.humidity)
      .attr("clouds", (d) => d.today_weather.clouds)
      .attr("rain_prob", (d) => d.today_weather.pop)
      .attr("rain", (d) => d.today_weather.rain)
      .attr("rain_text", (d) => d.today_weather.rain_text)

      .attr("weather", (d) => d.today_weather.weather[0].description)

      .attr("d", de_path)
      .attr("idPath", (d, i) => i)
      .attr("fill", (d) => this.temp_color(d.today_weather[this.temp_mode].day))
      .style("stroke", "#000")
      .attr("stroke-width", "0.2");

    var tooltip = d3.select(".toolTip");
    // var svg = d3.select("#map_svg")
    var self = this;
    svg
      .selectAll("path")
      .on("mouseover", function (event) {
        // Show the tooltip
        tooltip.style("visibility", "visible");
        // console.log(d3.select(this).attr("name"));

        d3.select("#name_text").html(
          `${d3.select(this).attr("name")} - ${
            document.getElementById("date_select").options[
              document.getElementById("date_select").selectedIndex
            ].text
          }`
        );

        d3.select("#mor_temp_text").html(
          `Morning : ${d3.select(this).attr("mor_temp")}°C`
        );
        d3.select("#day_temp_text").html(
          `Day : ${d3.select(this).attr("day_temp")}°C`
        );
        d3.select("#eve_temp_text").html(
          `Evening : ${d3.select(this).attr("eve_temp")}°C`
        );
        d3.select("#night_temp_text").html(
          `Night : ${d3.select(this).attr("night_temp")}°C`
        );

        d3.select("#humidity_text").html(
          `Humidity : ${d3.select(this).attr("humidity")}%`
        );
        d3.select("#clouds_text").html(
          `Cloud : ${d3.select(this).attr("clouds")}%`
        );

        d3.select("#rain_text").html(
          `Rain : ${d3.select(this).attr("rain_text")}`
        );
        d3.select("#rain_prob_text").html(
          `Rain Prob : ${parseInt(
            parseFloat(d3.select(this).attr("rain_prob")) * 100
          )}%`
        );

        d3.select("#weather_text").html(
          `Weather : ${d3.select(this).attr("weather")}`
        );

        // Set the tooltip content
        // tooltip.html("<h1>"+d3.select(this).attr("name") + "</h1><h2>Temperature</h2><h3>  Day: " + parseInt(d3.select(this).attr("day_temp")).toLocaleString() + "</h3><h3>  Rain: " + d3.select(this).attr("rain"))+"</h3>";
        // tooltip.html("Country/Region: " );
      })
      .on("click", function (event) {
        self.select_item(d3.select(this).attr("idPath"));

        d3.select("#temp_label").html(
          `${d3.select(this).attr("name")} 16 Days Temperature Chart.`
        );

        d3.select("#stat_label").html(
          `${d3.select(this).attr("name")} 16 Days Statictis Chart.`
        );
        d3.select("#rain_label").html(
          `${d3.select(this).attr("name")} 16 Days Rain Chart.`
        );
        // console.log(d3.select(this).attr("name"));
      })
      .on("mouseout", function (d) {
        // Hide the tooltip
        tooltip.style("visibility", "hidden");
      });
  }

  reload_map() {
    var json = this.json;

    // The svg
    var svg = d3.select("#map_svg");
    var width = svg.attr("width");
    var height = svg.attr("height");

    var center = d3.geoCentroid(json);
    // center = [Math.round(center[0]),Math.round(center[1])]

    var scale = height * 3;

    var offset = [width / 2, height / 2];

    var projection = d3
      .geoMercator()
      .scale(scale)
      .center(center)
      .translate(offset);
    var de_path = d3.geoPath().projection(projection);

    // console.log("provinces_data",provinces_data);
    // console.log("map_dat", json);
    json.features.forEach((d) => {
      // console.log(d)
      d.today_weather = d.data[this.date];

      // Rain handler
      if (d.today_weather.rain) {
        d.today_weather.rain_text = d.today_weather.rain + "mm";
      } else {
        d.today_weather.rain = "0";
        d.today_weather.rain_text = "N/A";
      }
    });
    var the_map = d3.select("#the_map");
    the_map
      .selectAll("path")
      .data(json.features)
      .join("path")

      .attr("lat", (d) => d.lat)
      .attr("lon", (d) => d.lon)
      .attr("name", (d) => d.vietnamese_name)

      .attr("mor_temp", (d) => d.today_weather[this.temp_mode].morn)
      .attr("day_temp", (d) => d.today_weather[this.temp_mode].day)
      .attr("eve_temp", (d) => d.today_weather[this.temp_mode].eve)
      .attr("night_temp", (d) => d.today_weather[this.temp_mode].night)

      .attr("humidity", (d) => d.today_weather.humidity)
      .attr("clouds", (d) => d.today_weather.clouds)
      .attr("rain_prob", (d) => d.today_weather.pop)
      .attr("rain", (d) => d.today_weather.rain)

      .attr("weather", (d) => d.today_weather.weather[0].description)
      .attr("d", de_path)
      .attr("fill", (d) => this.temp_color(d.today_weather[this.temp_mode].day))
      .style("stroke", "#000")
      .attr("stroke-width", "0.2");
  }

  select_item(input_id) {
    // console.log("ID"+input_id);
    this.selected = this.json.features[input_id];
    // console.log(this.selected.data);
    // this.selected.data
    this.selected.processed_data = [];
    this.selected.data.forEach((d) => {
      let datetime = new Date(d.dt * 1000);
      var date = datetime.getDate();
      var month = datetime.getMonth() + 1;
      var year = 1900 + parseInt(datetime.getYear());
      var date_string = `${year}-${month}-${date}`;
      if (!d.rain || d.rain == "N/A") {
        d.rain_ = 0;
      } else {
        d.rain_ = d.rain;
      }
      d.pop_ = parseInt(d.pop * 100);
      var test_subject = {
        date: date_string,
        mor_temp: d[this.temp_mode].morn,
        day_temp: d[this.temp_mode].day,
        eve_temp: d[this.temp_mode].eve,
        night_temp: d[this.temp_mode].night,
        humidity: d.humidity,
        clouds: d.clouds,
        rain_prob: d.pop_,
        rain: d.rain_,
      };
      this.selected.processed_data.push(test_subject);
    });
    // console.log(this.selected.processed_data);
    this.load_other_chart();
  }
  reprocess_temp_chart() {
    if (this.selected != -9999) {
      this.selected.processed_data = [];
      this.selected.data.forEach((d) => {
        let datetime = new Date(d.dt * 1000);
        var date = datetime.getDate();
        var month = datetime.getMonth() + 1;
        var year = 1900 + parseInt(datetime.getYear());
        var date_string = `${year}-${month}-${date}`;
        if (!d.rain || d.rain == "N/A") {
          d.rain_ = 0;
        } else {
          d.rain_ = d.rain;
        }
        d.pop_ = parseInt(d.pop * 100);
        var test_subject = {
          date: date_string,
          mor_temp: d[this.temp_mode].morn,
          day_temp: d[this.temp_mode].day,
          eve_temp: d[this.temp_mode].eve,
          night_temp: d[this.temp_mode].night,
          humidity: d.humidity,
          clouds: d.clouds,
          rain_prob: d.pop_,
          rain: d.rain_,
        };
        this.selected.processed_data.push(test_subject);
      });
      this.load_other_chart();
    }
  }
  init_all_chart() {
    this.temp_chart = Morris.Line({
      xkey: "date",
      ykeys: ["mor_temp", "day_temp", "eve_temp", "night_temp"],
      labels: ["Morning Temp", "Day Temp", "Evening Temp", "Night Temp"],
      fillOpacity: 0.6,
      parseTime: false,
      postUnits: "°C",
      hideHover: "auto",
      behaveLikeLine: true,
      resize: true,
      pointFillColors: ["#C9E4DE", "#FAEDCB", "#F7D9C4", "#6675da"], // Morning, Day, Evening, Night
      pointStrokeColors: ["#000000"],
      lineColors: ["#C9E4DE", "#FAEDCB", "#F7D9C4", "#6675da"], // Morning, Day, Evening, Night
      element: "temp-chart",
    });

    this.stat_chart = Morris.Bar({
      xkey: "date",
      ykeys: ["humidity", "clouds", "rain_prob"],
      labels: ["Humidity", "Clouds", "Rain Probablity"],
      fillOpacity: 0.6,
      parseTime: false,
      postUnits: "%",
      hideHover: "auto",
      behaveLikeLine: true,
      resize: true,
      barColors: ["#daeaf6", "#EEECF4", "#6675da"], //Humidity , Cloud , Rain
      element: "stat-chart",
    });

    this.rain_chart = Morris.Bar({
      xkey: "date",
      ykeys: ["rain"],
      labels: ["Rain"],
      fillOpacity: 0.6,
      parseTime: false,
      postUnits: "mm",
      hideHover: "auto",
      behaveLikeLine: true,
      resize: true,
      barColors: ["#6675da"], // Rain
      element: "rain-chart",
    });
  }

  load_other_chart() {
    this.temp_chart.setData(this.selected.processed_data);
    this.stat_chart.setData(this.selected.processed_data);
    this.rain_chart.setData(this.selected.processed_data);
  }

  temp_color(input_number) {
    if (input_number > 41) {
      return "#a60000";
    }
    if (input_number > 35.1) {
      return "#cf2929";
    }
    if (input_number > 29.1) {
      return "#ea5d45";
    }
    if (input_number > 23.1) {
      return "#f79d54";
    }
    if (input_number > 18.1) {
      return "#fcde69";
    }
    if (input_number > 13.1) {
      return "#cdfe6d";
    }
    if (input_number > 8.1) {
      return "#69fd61";
    }
    if (input_number > 4.1) {
      return "#88f0ca";
    }
    if (input_number > 0) {
      return "#87c2f3";
    } else {
      return "#6675da";
    }
  }
}
