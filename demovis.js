var height = 800
var width = 1200
var padding = {top:0,bottom:50,left:50,right:50}
var appearanceFilterThreshold = 30
var yDomain1 = [0,75]
var xDomain = [1939,2013]
var divisions = {mn:500,nf:550}
var sexDomain = {male:[0,55],female:[0,20],unknown:[0,5]}

var dotRadius = 3
var dotStrokeWidth = 3

var yAxisSwitch = "default"

//this is a test
var testvar = 0;


function parseHairColor(hair) {
  var noneValue = ["no","bald","nan","variable"];
  if (hair != "") {
    result = hair.split(" ")[0].toLowerCase()
    if (result == "blond" || result == "strawberry") {
      result = "gold"
    }
    if (result == "white") {
      result = "lightgrey"
    }
    if (result == "brown") {
      result = "#ac762f"
    }
    if (result == "auburn") {
      result = "brown"
    }
    if (noneValue.includes(result)) {
      result = "grey"
    }
  }
  else {
    result = "grey"
  }
  return result
}

function parseEyeColor(eye) {
  if (eye != "") {
    result = eye.split(" ")[0].toLowerCase()
    if (result == "white") {
      result == "lightgrey"
    }
    if (result == "brown") {
      result = "sienna"
    }
    if (result == "white") {
      result = "lightgrey"
    }
  }
  else {
    result = "grey"
  }
  // console.log(result)
  return result
}

function parseSex(sex) {
  if (sex == "Male Characters") {
    return "M";
  }
  else if (sex == "Female Characters") {
    return "F";
  }
  else {
    return "N";
  }
}

// create svg for graph
var graphSvg = d3.select('#demographic-graph')
      .append('svg')
      .attr('height',height)
      .attr('width',width);

//define tooltip section
var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("z-index","100");

// load csv file
d3.csv("Data/0_marvel-wikia-data.csv",function(error,data){
  if (error) throw error;

  dataGroupByYear = d3.nest().key(function(d){return d.Year;}).entries(data);

  if (yAxisSwitch == "hair") {
    for (row in dataGroupByYear) {
      //console.log(dataGroupByYear[row].values);
      dataGroupByYear[row].values.sort(function(x,y){
        var nameA=x.HAIR.toLowerCase()
        var nameB=y.HAIR.toLowerCase()
        if (nameA < nameB) {return -1;}
        if (nameA > nameB) {return 1;}
        else {return 0;}
      })
    }
  }
  console.log("dataGroupByYear",dataGroupByYear);

  var unnestedData = [];
  var counterForUnnest = 0;
  dataGroupByYear.forEach(function(y) {
    y.values.forEach(function(hero) {
      unnestedData.push({
        name: hero.name,
        year: hero.Year,
        sex: hero.SEX,
        hair: hero.HAIR,
        eye: hero.EYE,
        appearance: hero.APPEARANCES
      });
    });
  });

  // console.log("unnestedData",unnestedData);
  // calculate the y position of item based on counter
  var counter;
  function yPositionCounter(d,counter) {
    //console.log("d",d)
    var year = d.year
    if (Object.keys(counter).includes(year)) {
      counter[year] = counter[year] + 1;
    }
    else {
      counter[year] = 1;
    }
    return counter[year];
  }

  var sexCounter;
  function constructYAxisSex(d,sexCounter) {
    var year = d.year
    if (!Object.keys(sexCounter).includes(year)) {
      sexCounter[year] = {};
    }
    var sex = parseSex(d.sex)
    if (!Object.keys(sexCounter[year]).includes(sex)) {
      sexCounter[year][sex] = 0;
    }
    sexCounter[year][sex] = sexCounter[year][sex] + 1;
    //console.log(sexCounter);
    return sexCounter[year];
  }

  // console.log(divisions.fm)
  var timescaler = d3.scaleLinear().domain(xDomain).range([padding.left,width-padding.right]);
  var yScale1 = d3.scaleLinear().domain(yDomain1).range([height-padding.bottom,padding.top]);
  var yScaleM = d3.scaleLinear().domain(sexDomain.male).range([divisions.mn,padding.top]);
  var yScaleN = d3.scaleLinear().domain(sexDomain.unknown).range([divisions.nf,divisions.mn]);
  var yScaleF = d3.scaleLinear().domain(sexDomain.female).range([divisions.nf,height-padding.bottom]);
  // console.log("yScaleM",yScale1(30))

  var counter = {};
  var items = graphSvg.selectAll('g')
        .data(unnestedData)
        .enter()
        .filter(function(d){return d.appearance >= appearanceFilterThreshold})
        .append('g')
        .attr("transform", function(d, i) {
            //console.log('???',yScale1(yPositionCounter(d,counter)))
			  		return "translate(0," + yScale1(yPositionCounter(d,counter)) + ")";
				});
        //.attr("transform", "translate("+ padding.left + "," + (height-padding.bottom) + ")");

  //console.log("counter",counter);

  function constructYAxis(d) {
    return yPositionCounter(d,counter);
  }

  // set the parameters for the histogram
  // var dotsgram = d3.histogram()
  //     .value(function(d) { return d.date; })
  //     .domain(x.domain())
  //     .thresholds(x.ticks(d3.timeMonth));

  var dots = items.append('circle')
       .attr("cx",function(d){return timescaler(d.year)})
       .attr("cy",function(d,i){
          //return yScale1(i+1);
          //return yScale1(constructYAxis(d));
          return 0;
       })
       .attr("r",dotRadius)
       .attr("class","heroDots")
       .attr("stroke",function(d) {return parseHairColor(d.hair)})
       .attr("stroke-width",dotStrokeWidth)
       .attr("fill",function(d) {return parseEyeColor(d.eye)})
       .on("mouseover", function(d) {
         //console.log("mouseover",d3.select(this).attr("cx"))
         div.transition()
             .duration(100)
             .style("opacity",1);
         div.html(d.name + "<br/>" + d.eye + "<br/>" + d.hair + "<br/>" + d.year + "<br/>" + d.sex + "</br>" + d.appearance)
             .style("left", d3.event.pageX + 10 + "px")
             .style("top", d3.event.pageY + 10 + "px")
       })
       .on("mouseout", function(d) {
         div.transition()
          .duration(100)
          .style("opacity", 0);
       });

  // Define the axes
  var xAxis = d3.axisBottom()
      .scale(timescaler)
      .ticks(xDomain[1]-xDomain[0]);
  graphSvg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + (height-padding.bottom) + ")")
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", "-0.6em")
      .attr("transform", "rotate(-90)");

  //Sorting logic
	d3.select("#sortByHair")
		.on("click", function() {
      document.getElementById("sortByHair").src="public/maggiel_d.svg";
      document.getElementById("sortByEye").src="public/anciento.svg";
      document.getElementById("sortBySex").src="public/christinep.svg";
      counter = {};
      //console.log("sort by hair")
			items.sort(function(a, b) {
						return d3.ascending(a.hair, b.hair);
				})
				.transition()
				.delay(function(d, i) {
					return i * 1;  // gives it a smoother effect
				})
				.duration(2000)
				.attr("transform", function(d, i) {
			  		return "translate(0," + yScale1(constructYAxis(d,counter)) + ")";
				});
      dots
        .attr("stroke",function(d) {return parseHairColor(d.hair)})
        .attr("fill",function(d) {return parseHairColor(d.hair)});
		});

    d3.select("#sortByEye")
  		.on("click", function() {
      document.getElementById("sortByHair").src="public/maggiel.svg";
      document.getElementById("sortByEye").src="public/anciento_d.svg";
      document.getElementById("sortBySex").src="public/christinep.svg";
        counter = {};
        //console.log("sort by eye")
  			items.sort(function(a, b) {
  						return d3.ascending(a.eye, b.eye);
  				})
  				.transition()
  				.delay(function(d, i) {
  					return i * 1;  // gives it a smoother effect
  				})
  				.duration(2000)
  				.attr("transform", function(d, i) {
  			  		return "translate(0," + yScale1(constructYAxis(d,counter)) + ")";
  				});
        dots
          .attr("stroke",function(d) {return parseEyeColor(d.eye)})
          .attr("fill",function(d) {return parseEyeColor(d.eye)});
  		});

  d3.select("#sortBySex")
		.on("click", function() {
      document.getElementById("sortByHair").src="public/maggiel.svg";
      document.getElementById("sortByEye").src="public/anciento.svg";
      document.getElementById("sortBySex").src="public/christinep_d.svg";
      sexCounter = {};
      //console.log("sort by sex")
			items
				.transition()
				.delay(function(d, i) {
					return i * 1;  // gives it a smoother effect
				})
				.duration(2000)
				.attr("transform", function(d, i) {
          if (parseSex(d.sex) == "M") {
			  		return "translate(0," + yScaleM(constructYAxisSex(d,sexCounter).M) + ")";
          }
          if (parseSex(d.sex) == "N") {
			  		return "translate(0," + yScaleN(constructYAxisSex(d,sexCounter).N) + ")";
          }
          if (parseSex(d.sex) == "F") {
			  		return "translate(0," + yScaleF(constructYAxisSex(d,sexCounter).F) + ")";
          }
				});
        dots
        .attr("stroke",function(d) {return parseHairColor(d.hair)})
        .attr("fill",function(d) {return parseEyeColor(d.eye)})
        // console.log(sexCounter)
		});

    // Define the axes
    var xAxis = d3.axisBottom()
        .scale(timescaler)
        .ticks(xDomain[1]-xDomain[0]);
    graphSvg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (height-padding.bottom) + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", "-0.6em")
        .attr("transform", "rotate(-90)");

});
