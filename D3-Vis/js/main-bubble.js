var size = 1000;

var DATA_FILE, RADIUS_ATTR, COLOR_ATTR, NAME_ATTR, DISTANCE_ATTR, LOAD_FUNC;
var detailMap = {};
var MAX_DATA_NUM = 6000;

// Data Attributes
DATA_FILE = "../data/cleaned-womens-shoe-prices.csv"
RADIUS_ATTR = "price.avg"
COLOR_ATTR = "colors"
DISTANCE_ATTR = "price.avg"
NAME_ATTR = "brand";
//detail map
detailMap[RADIUS_ATTR] = "Price" 
detailMap[DISTANCE_ATTR] = "Price" 
detailMap[COLOR_ATTR] = "Colors"

var pack = d3.pack()
    .size([size, size])
    .padding(5);

var svg;
var bubbles;
var tooltip;

var mouseOnBubble = false;
var margin = {left:0, right:100, top:0, bottom: 0}

// Single function for put chart into specified target
function loadBubbleChart(id) {
    $(function () {
        svg = d3.select("#"+id).append("svg")
                    .attr("width", size + margin.left + margin.right)
                    .attr("height", size + margin.top + margin.bottom);
        tooltip = d3.select("#"+id)
                     .append("div")
                     .attr("class", "vis-tooltip")
                     .style("position","relative")
                     //.style("transform","translate(0,-"+size+")")
                     .style("opacity", "0")

        queue()
                .defer(d3.csv, DATA_FILE, type)
                .await(boot);
    });
}

function type(d) {
  d[RADIUS_ATTR] = parseFloat(d[RADIUS_ATTR])
  d[DISTANCE_ATTR] = parseFloat(d[DISTANCE_ATTR])
  d[COLOR_ATTR] = d[COLOR_ATTR] !== "" ? d[COLOR_ATTR].split(',') : ["default"];
  
  return d;
}

function showDetail(d){
    d3.select(this).attr('stroke','black');
}

function loadSearchBox(){
    d3.select('#hit').select('#search-box').style('display','inline')
    enableSearch()
}

var searchData;


function buildDataStructure(data){

    var bfl = data.length
    //filter
    data = data.filter(function(d){return !(isNaN(d[RADIUS_ATTR]) || isNaN(d[DISTANCE_ATTR]))})
    //sort
    data = data.sort(function(a, b){return a[DISTANCE_ATTR] - b[DISTANCE_ATTR]})
    //then filter out the rest
    data = data.filter(function(d, i){return i < MAX_DATA_NUM})
    console.log("filtered="+(bfl - data.length))

    Array.prototype.unique = function() {
      return this.filter(function (value, index, self) { 
        return self.indexOf(value) === index;
      });
    }

    searchData = data.map(d => d[NAME_ATTR]).unique();

  var root;
  //root = d3.hierarchy({children: [{children: top10}].concat(data)})
  root = d3.hierarchy({children: data})
      // .sum(function(d) { return Math.sqrt(d[RADIUS_ATTR])*1.618 })
      .sum(function(d) { return d[RADIUS_ATTR] })
      .sort(function(a, b) {
        return b.data[DISTANCE_ATTR] - a.data[DISTANCE_ATTR];
      });
  pack(root);

  return root;
}

function showTooltip(d){
    d = d.data['parent']
     tooltip
        .style("top", (d.y + d.r  - size) + "px")
        .style("left", (d.x + 5) + "px")
        .transition()
            .duration(0)
            .style("opacity", 1)
        
        tooltip.html(function() {
            // var percent = Math.round(d.data[DISTANCE_ATTR] * 10000) / 100
            
            return d.data[NAME_ATTR] + "<br/>"
                + detailMap[RADIUS_ATTR] + ": $ " + d.data[RADIUS_ATTR] + "<br/>"
                // + detailMap[COLOR_ATTR] + ": $" + d.data[COLOR_ATTR] + "<br>"
                + "<img src='" + d.data['imageURLStr'] + "'/>"
        });
}


function drawVis(root){

  var groups = svg.selectAll("g")
        .data(root.descendants().slice(1))
        .enter().append("g")
        .attr("transform", function(d) {
            return "translate("+d.x+","+d.y+")";
        })
    
  // draw bubbles
  // bubbles = groups.append("circle")
  //     .attr("r", function(d) { return d.r; })
  //     .attr("cx", 0)
  //     .attr("cy", 0)
  //     .style("fill", "none")
  //     .style("z-index",10)
  //     .classed("bubbles",true)

  var pie = d3.pie()
    .sort(null)
    .value(function(d) { return d['value']; });
  
  var path = d3.arc()
    .outerRadius(function(d) { return d.data['r']; })
    .innerRadius(0);

  var arc = groups.selectAll(".arc")
    .data(function(d) { 
        return pie(d.data['colors'].map(k => ({color:k,value:1, r:d.r, x:d.x, y:d.y, parent:d}))); 
    })
    .enter().append("g")
      .attr("class", "arc")
      .style("z-index",0);

  // var paths = arc.append("path")
  //     .attr("d", path)
  //     .attr("d", function(d) {
  //       return d
  //     })
  //     .attr("fill", function(d) { 
  //       // var color = d.data['color'].toLowerCase();
  //       // return color === "default" ? "gray" : color; 
  //       return "#c994c7"
  //   })
  //     .classed("bubbles", true);

    var paths = groups.selectAll(".arc")
    .append("path")
      .attr("d", function(d) {
        var r = d.data['r'];
        return "M " + (-r) + " " + (r) + " " +
               "L " + (-r) + " " + (-r*0.5) + " " +
               "L " + (-r*0.3) + " " + (-r*0.5) + " " +
               "L " + (0) + " " + (r*0.1) + " " +
               "L " + (r*0.8) + " " + (r*0.6) + " " +
               // "L " + (r) + " " + (r*0.2) + " " +
               "L " + (r) + " " + (r) + " " +
               "L " + (-r*0.5) + " " + (r*0.8) + " " +
               "L " + (-r*0.5) + " " + (r) + " " +
               "L " + (-r) + " " + (r) + " "
      })
      .attr("fill", function(d) { 
        return "#dd3497"//"#c994c7"
    })
      .classed("bubbles", true);



    //Add mouse events to bubbles
    paths.on('mouseover', function(d){
        d3.select(this).style("stroke-width", 2)
            .style("stroke", "black")
        showTooltip(d)
    });
    paths.on("mouseout", function(d){
        d3.select(this).style("stroke-width", 0)
        tooltip.transition()
            .duration(0)
            .style("opacity", 0);
        return 
        })   

    // Draw legend
    var legend = svg.append('g')
                    .classed('legend',true)
    var currentLegendHeight = 40;
    var legendSpaceStep = 20;
    var legendTextStep = 10;

    legend.append('text')
          .attr("x",size + margin.right)
          .attr("y", currentLegendHeight)
          .text("Distance to Center and Shoe Size are mapped to Price")
    currentLegendHeight += legendTextStep + legendSpaceStep


}

function boot(error, data){

    var root = buildDataStructure(data);
    drawVis(root);
    loadSearchBox();
 
}

// Search box
function enableSearch(){

    var searchInput = $("#search-input");

    // Get options for auto complete
    function getSearchOptions(data) {
        var optionsData = []
            if (data && data.length > 0) {
                for (var i = 0; i < data.length; i++) {
                    // optionsData.push(data[i][NAME_ATTR]);
                    optionsData.push(data[i]);
                }
                console.log(optionsData.length)
            }
            initSearchBox(optionsData);
    }
    getSearchOptions(searchData);

    // Init search box with auto complete
    function initSearchBox(options) {
        // Invoke auto complete for search box
        var searchOptions = {
            data: options,
            list: {
                maxNumberOfElments: 0,
                match: {enabled: true},
                onChooseEvent: function () {
                    searchChooseItem();
                }
            }
        };
        searchInput.easyAutocomplete(searchOptions);

        // Start searching when typing in search box
        searchInput.on("input", function (e) {
            e.preventDefault();
            searchChooseItem();
        });
    }
    
    // Search choosen item
    function searchChooseItem() {
        searchFilter(searchInput.val().toLowerCase());
    }

    function searchFilter(value) {

        // Reset and return if empty
        if (value === "") {
            resetSearch();
            return;
        }

        // Start Filtering
        // Fade all lines and boxes
        d3.selectAll(".bubbles").classed("search-selected",false);
        $("#vis").addClass("search-active");

        // Make contains case-insensitive
        $.expr[":"].contains = $.expr.createPseudo(function (arg) {
            return function (elem) {
                return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
            };
        });

        // Unfade selected elements
        var filteredBubbles = d3.selectAll(".bubbles").filter(function(d){
            // console.log(d.data)
            return d.data.parent.data[NAME_ATTR] && d.data.parent.data[NAME_ATTR].toLowerCase().includes(value)
                                                    })

        if (value && filteredBubbles) {
            // Unfade
            // console.log(filteredBubbles)
            filteredBubbles.classed("search-selected",true);
            
        }

        

    }

    // Click button to reset
    $("#search-reset").click(function () {
        resetSearch();
    });

    // Press ESC to reset
    $(document).keydown(function (e) {
        if (e.which === 27) //ESC
            resetSearch();
    });

    function resetSearch() {
        // Reset faded elemnets
        $("#vis").removeClass("search-active");
        $(".bubbles").removeClass("search-selected");
        // Reset search
        currentSearch = null;
        // Clear search input box
        searchInput.val("");
    }
}