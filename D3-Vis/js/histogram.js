var colorRange = ['#5e3c99','#b2abd2', '#fdb863','#e66101']
var color = d3.scaleQuantize()
    .range(colorRange)

var size = 720;

var DATA_FILE, RADIUS_ATTR, COLOR_ATTR, NAME_ATTR, DISTANCE_ATTR, LOAD_FUNC;
var detailMap = {};
var MAX_DATA_NUM = 6000;
var COLOR_DIVIDER = 1/18000

// Data Attributes
DATA_FILE = "../data/cleaned-womens-shoe-prices.csv"
RADIUS_ATTR = "price.avg"
COLOR_ATTR = "price.avg"
DISTANCE_ATTR = "price.avg"
NAME_ATTR = "brand";
//detail map
detailMap[RADIUS_ATTR] = "Price" 
detailMap[DISTANCE_ATTR] = "Price" 
detailMap[COLOR_ATTR] = "Price"

var pack = d3.pack()
    .size([size, size])
    .padding(5);

var svg;
var bubbles;
var tooltip;

var mouseOnBubble = false;
var margin = {left:0, right:100, top:0, bottom: 0}

// Single function for put chart into specified target
function loadHistograms(id) {
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
  d[COLOR_ATTR] = parseFloat(d[COLOR_ATTR])
  d[DISTANCE_ATTR] = parseFloat(d[DISTANCE_ATTR])
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

    var orignalLength = data.length
    //filter
    data = data.filter(function(d){return !(isNaN(d[RADIUS_ATTR]) || isNaN(d[COLOR_ATTR]) || isNaN(d[DISTANCE_ATTR]) || d[DISTANCE_ATTR] === 0)})
    //sort
    data = data.sort(function(a, b){return a[DISTANCE_ATTR] - b[DISTANCE_ATTR]})
    //then filter out the rest
    data = data.filter(function(d, i){return i < MAX_DATA_NUM})
    console.log("filtered="+(orignalLength - data.length))

    searchData = data;

  var root;
  var root = d3.nest()
    .key(function(d) { return d['brand']; })
    .entries(data)
  console.log(root)

  return root;
}

function showTooltip(d){
                 tooltip
                    .style("top", (d.y + d.r  - size) + "px")
                    .style("left", (d.x + 5) + "px")
                    .transition()
                        .duration(0)
                        .style("opacity", 1)
                    
                    tooltip.html(function() {
                        var percent = Math.round(d.data[DISTANCE_ATTR] * 10000) / 100
                        
                        return d.data[NAME_ATTR] + "<br/>"
                            + detailMap[DISTANCE_ATTR] + ": " + percent + "%<br>"
                            + detailMap[RADIUS_ATTR] + ": $" + d.data[RADIUS_ATTR] + "<br/>"
                            + detailMap[COLOR_ATTR] + ": $" + d.data[COLOR_ATTR] + "<br>"
                            + "<img src='" + d.data['imageURLStr'] + "'/>"
                    });
}


function drawVis(root){

  var brandGroups = svg.selectAll(".brand-group")
                    .data(root).enter().append("g")
                      .attr("class", "brand-group")
                      .attr("transform", function(d, i) {
                        return "translate(10,"+(50 + i*30)+")";
                      })
    // add brand texts
  brandGroups.append("text")
    .attr("x",-20)
    .style("align", "end")
    .text("aaa")

  // draw bubbles
  bubbles = brandGroups.selectAll("circle")
    .data(function(d) {return d['values']})
    .enter().append("circle")
      .attr("r", 9)
      .attr("cx", function(d) { return d['price.avg']*5; })
      .attr("cy", 0)
      .style("fill", "gray")
      .attr("opacity", 0.5)
      .classed("bubbles",true)


    //Add mouse events to bubbles
    bubbles.on('mouseover', function(d){
        showTooltip(d)
    });
    bubbles.on("mouseout", function(d){

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
          .text("Distance to Center: Admission Rate (%)")
          //.html("<span><strong>Distance to Center</strong>: Admission Rate (%)</span>")
    currentLegendHeight += legendTextStep + legendSpaceStep

    legend.append('text')
          .attr("x",size + margin.right)
          .attr("y", currentLegendHeight)
          .text("Radius: Annual Cost ($)")
    currentLegendHeight += legendTextStep + legendSpaceStep

    legend.append('text')
          .attr("x",size + margin.right)
          .attr("y", currentLegendHeight)
          .text("Color: Median of Earnings ($)")
    currentLegendHeight += legendTextStep + legendSpaceStep

    // color legend
    var colorDomain = color.domain()
    var colorStep = (colorDomain[1] - colorDomain[0])/4
    var colorValues = [
                colorDomain[0], 
                colorDomain[0]+colorStep, 
                colorDomain[0] + 2 * colorStep, 
                colorDomain[0] + 3 * colorStep
                ]
    var colorLegendData = colorRange.map(function(d, i){
        var obj = {}
        obj['color'] = d
        obj['start'] = Math.round(Math.sqrt(colorValues[i])/1000) + "k"
        return obj
    })
    var rectWidth = 40
    var legendColorBlocks = legend.append('g').selectAll('g')
            .data(colorLegendData)
            .enter().append('g')
            .attr('transform',function(d,i){ return 'translate('+(size + margin.right - (4-i) * rectWidth) +','+ currentLegendHeight+' )'})

    legendColorBlocks.append('rect')
            .attr('width', rectWidth)
            .attr('height', 10)
            .attr('fill', function(d){return d['color']})
    legendColorBlocks.append('text')
            .attr('x',10)
            .attr('y', -5)
            .text(function(d){return d['start']})
    currentLegendHeight += 20 + legendSpaceStep

}

function boot(error, data){
    
    data.forEach(type)
    color.domain(d3.extent(data, function(d) { return d[COLOR_ATTR]/COLOR_DIVIDER; }));
    color.domain([Math.pow(13000,2), Math.pow(65000,2)]);

    console.log(d3.extent(data, function(d) { return Math.sqrt(d[COLOR_ATTR]/COLOR_DIVIDER); }))
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
                    optionsData.push(data[i][NAME_ATTR]);
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
                // maxNumberOfElments: 0,
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
                                                        return d.data[NAME_ATTR] && d.data[NAME_ATTR].toLowerCase().includes(value)
                                                    })

        if (value && filteredBubbles) {
            // Unfade
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