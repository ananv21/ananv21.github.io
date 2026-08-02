document.addEventListener('DOMContentLoaded', init);

console.log("12:42 update.");

async function init() {
    const scenes = ['#scene-0', '#scene-1', '#scene-2', '#scene-3'];
    let currentScene = 0;

    // Load data
    const USBirthsByDayData = await d3.csv("https://raw.githubusercontent.com/ananv21/ananv21.github.io/refs/heads/main/avg_births_by_date_of_month_us.csv");

    const USBirthsByYearData = await d3.csv("https://raw.githubusercontent.com/ananv21/ananv21.github.io/refs/heads/main/avg_births_by_year_us.csv");

    // Initial chart rendering
    updateChartForScene(currentScene);

    const bottomN = [5,10,15];
    const bottomNSelect = d3.select("#bottom-n-select");
    bottomNSelect.selectAll("option")
        .data(bottomN)
        .enter().append("option")
        .attr("value", d => d)
        .text(d => d);

    // Add event listeners to buttons
    document.getElementById('next').addEventListener('click', () => {
        if (currentScene < scenes.length - 1) {
            if (currentScene == 0){
                var active_class = 'active-center';
            }else{
                var active_class = 'active-grid';
            };
            d3.select(scenes[currentScene]).classed(active_class, false);
            currentScene++;
            if (currentScene == 0){
                var active_class = 'active-center';
            }else{
                var active_class = 'active-grid';
            };
            d3.select(scenes[currentScene]).classed(active_class, true);
            updateChartForScene(currentScene);
        }
    });

    document.getElementById('previous').addEventListener('click', () => {
        if (currentScene > 0) {
            if (currentScene == 0){
                var active_class = 'active-center';
            }else{
                var active_class = 'active-grid';
            };
            d3.select(scenes[currentScene]).classed(active_class, false);
            currentScene--;
            if (currentScene == 0){
                var active_class = 'active-center';
            }else{
                var active_class = 'active-grid';
            };
            d3.select(scenes[currentScene]).classed(active_class, true);
            updateChartForScene(currentScene);
        }
    });

    d3.select("#bottom-n-select").on("change", function() {
        const selectedbottomN = d3.select(this).property("value");
        createLollipopChart(USBirthsByDayData, selectedbottomN);
    });

    function createLollipopChart(data, bottomN){
        d3.select("#lollipop-chart").selectAll("*").remove();

        const svg = d3.select("#lollipop-chart").append("svg")
            .attr("width", 800)
            .attr("height", 600);

        const margin = { top: 20, right: 30, bottom: 100, left: 80 };
        const width = +svg.attr("width") - margin.left - margin.right;
        const height = +svg.attr("height") - margin.top - margin.bottom;

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        data.sort(function(a, b) {
            return d3.ascending(a.births, b.births);
        });

        const lowestN = data.slice(0, bottomN);

        const x = d3.scaleLinear()
            .domain([10000, 11400])
            .range([ 0, width]);
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        const y = d3.scaleBand()
            .range([ 0, height ])
            .domain(lowestN.map(function(d) { return d.date_of_month; }))
            .padding(1);
        g.append("g")
            .call(d3.axisLeft(y));

        g.append("text")
            .attr("text-anchor", "end")
            .attr("x", width/2 +50)
            .attr("y", height + margin.top + 40)
            .text("Average # of Births");
        
        g.append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left+40)
            .attr("x", -height/2 + 50)
            .text("Date of Month")

        // create a tooltip        
        const tooltip = d3.select('#tooltip');

        // Three function that change the tooltip when user hover / move / leave a cell
        const pointermoved = function(event,d) {
            const tooltipText = `
                <strong>Avg. # of Births</strong>: ${Math.floor(d.births)} 
                <br> 
                <strong>Date of Month</strong>: ${d.date_of_month}`;
            tooltip
                .style("opacity", 0.9)
                .html(tooltipText)
                .style('display', 'block')
                .style("top", `${event.y}px`)
                .style("left", `${event.x}px`);
            d3.select(this)
                .style("stroke", "black")
                .style("fill", "#4d80ef");
        }
        function pointerleft() {
            tooltip.style("display", "none");
            d3.select(this)
                .style("stroke", "none")
                .style("fill", "#164cca");
        }

        // Lines
        g.selectAll("myline")
        .data(lowestN)
        .enter()
        .append("line")
            .attr("x1", x(10000))
            .attr("x2", x(10000))
            .attr("y1", function(d) { return y(d.date_of_month); })
            .attr("y2", function(d) { return y(d.date_of_month); })
            .attr("stroke", "grey")
            .attr("stroke-width", 2);

        g.selectAll("mycircle")
        .data(lowestN)
        .enter()
        .append("circle")
            .attr("cx", x(10000) )
            .attr("cy", function(d) { return y(d.date_of_month); })
            .attr("r", "10")
            .style("fill", "#164cca")
            .on("pointerenter pointermove", pointermoved)
            .on("pointerleave", pointerleft);

        // Animation
        // g.selectAll("rect")
        // .transition()
        // .duration(800)
        // .attr("width", function(d) { return x(d.births); })
        // .delay(function(d,i){console.log(i) ; return(i*100)});

        // Change the X coordinates of line and circle
        g.selectAll("circle")
        .transition()
        .duration(800)
        .attr("cx", function(d) { return x(d.births); });

        g.selectAll("line")
        .transition()
        .duration(800)
        .attr("x1", function(d) { return x(d.births); });

        // Features of the annotation
        const annotations = [
            {
                note: {
                label: "Dates falling on the 13th of the month had the fourth fewest births on average!",
                },
                x: x(data[3].births),
                y: y(data[3].date_of_month),
                dx: 100,
                dy: 15,
            }
        ];

        // Add annotation to the chart
        // const makeAnnotations = d3.annotation()
        // .annotations(annotations);

        // g.append("g")
        // .call(makeAnnotations);

        setTimeout(() => {
            const makeAnnotations = d3.annotation()
            .annotations(annotations);
                
            g.append("g")
                .call(makeAnnotations);
            }, 800);
    }

    function createLineChart1(data){
        d3.select("#line-chart-1").selectAll("*").remove();

        const svg = d3.select("#line-chart-1").append("svg")
            .attr("width", 800)
            .attr("height", 600);

        const margin = { top: 20, right: 30, bottom: 100, left: 100 };
        const width = +svg.attr("width") - margin.left - margin.right;
        const height = +svg.attr("height") - margin.top - margin.bottom;

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const filter_data = data.filter(function(d){return (d.date_category=="day_13") || (d.date_category=="non_13")});

        const sumstat = d3.group(filter_data, d => d.date_category);

        // Add X axis --> it is a date format
        const x = d3.scaleLinear().range([ 0, width ]).domain(d3.extent(filter_data, function(d) { return d.year; }));
        g.append("g").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(x).tickFormat(d3.format("d")));
    
        // Add Y axis
        const y = d3.scaleLinear().range([ height, 0 ]).domain([9000, d3.max(filter_data, function(d) { return +d.births; })]);
        g.append("g").call(d3.axisLeft(y));

        g.append("text")
            .attr("text-anchor", "end")
            .attr("x", width/2 +20)
            .attr("y", height + margin.top + 30)
            .text("Year");
        
        g.append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left+40)
            .attr("x", -height/2 + 50)
            .text("Average # of Births");

        // color palette
        const groupNames = Array.from(sumstat.keys());
        const color = d3.scaleOrdinal().domain(groupNames).range(d3.schemeDark2);

        // Create the tooltip container.
        const tooltip = d3.select('#tooltip');
        const tooltipLine = g.append('line');

        function formatDateCategory(date_category){
            if (date_category == 'non_13'){
                return 'Dates not on the 13th';
            }else{
                return 'Dates on the 13th';
            }
        };

        function pointermoved(event) {
            const birth_year = Math.floor(x.invert(d3.pointer(event)[0]));
            const filter_data_for_yr = filter_data.filter(function(d){return (d.year==birth_year)});
            filter_data_for_yr.sort((a, b) => {
                return b.births - a.births;
            }) ;

            tooltipLine.attr('stroke', 'black')
                .attr('x1', x(birth_year))
                .attr('x2', x(birth_year))
                .attr('y1', 0)
                .attr('y2', height);

            tooltip.html(`<strong>${birth_year}</strong>`)
                .style('display', 'block')
                .style('left', `${event.x}px`)
                .style('top', `${event.y}px`)
                .selectAll()
                .data(filter_data_for_yr).enter()
                .append('div')
                .style('color', d => color(d.date_category))
                .html(d => `<strong>${formatDateCategory(d.date_category)}</strong>` + ': ' + Math.floor(d.births) + ' births');    
        }

        function pointerleft() {
            tooltip.style("display", "none");
            tooltipLine.attr('stroke', 'none');
        }

        function pointerover() {
            tooltip
            .style("opacity", 0.9)
        }

        // Draw the line
        g.selectAll(".line")
            .data(sumstat)
            .join("path")
                .attr("fill", "none")
                .attr("stroke", function(d){ return color(d[0]) })
                .attr("stroke-width", 2.5)
                .attr("d", function(d){
                return d3.line()
                    .x(function(d) { return x(d.year); })
                    .y(function(d) { return y(+d.births); })
                    (d[1])
                }); 
        
        g.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('opacity', 0)
            .on("pointerenter pointermove", pointermoved)
            .on("pointerover", pointerover)
            .on("pointerleave", pointerleft); 
        
        g.selectAll("mydots")
        .data(groupNames)
        .enter()
        .append("circle")
            .attr("cx", 480)
            .attr("cy", function(d,i){ return 350+i*25}) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("r", 7)
            .style("fill", function(d){ return color(d)});

        // Add one dot in the legend for each name.
        g.selectAll("mylabels")
        .data(groupNames)
        .enter()
        .append("text")
            .attr("x", 500)
            .attr("y", function(d,i){ return 350+i*25}) // 100 is where the first dot appears. 25 is the distance between dots
            .style("fill", function(d){ return color(d)})
            .text(function(d){ return formatDateCategory(d)})
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle");

    }

    function createLineChart2(data){
        d3.select("#line-chart-2").selectAll("*").remove();

        const svg = d3.select("#line-chart-2").append("svg")
            .attr("width", 800)
            .attr("height", 600);

        const margin = { top: 20, right: 30, bottom: 100, left: 100 };
        const width = +svg.attr("width") - margin.left - margin.right;
        const height = +svg.attr("height") - margin.top - margin.bottom;

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const filter_data = data.filter(function(d){return (d.date_category!="day_13") & (d.date_category!="non_13")});

        const sumstat = d3.group(filter_data, d => d.date_category);

        // Add X axis --> it is a date format
        const x = d3.scaleLinear().range([ 0, width ]).domain(d3.extent(filter_data, function(d) { return d.year; }));
        g.append("g").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(x).tickFormat(d3.format("d")));
    
        // Add Y axis
        const y = d3.scaleLinear().range([ height, 0 ]).domain([6000, d3.max(filter_data, function(d) { return +d.births; })]);
        g.append("g").call(d3.axisLeft(y));

        g.append("text")
            .attr("text-anchor", "end")
            .attr("x", width/2 +20)
            .attr("y", height + margin.top + 30)
            .text("Year");
        
        g.append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left+40)
            .attr("x", -height/2 + 50)
            .text("Average # of Births");

        // color palette
        const groupNames = Array.from(sumstat.keys());
        const color = d3.scaleOrdinal().domain(groupNames).range(d3.schemePaired);

        // Create the tooltip container.
        const tooltip = d3.select('#tooltip');
        const tooltipLine = g.append('line');

        function formatDateCategory(date_category){
            return date_category.charAt(0).toUpperCase() + date_category.slice(1,3);
        };

        function pointermoved(event) {
            const birth_year = Math.floor(x.invert(d3.pointer(event)[0]));
            const filter_data_for_yr = filter_data.filter(function(d){return (d.year==birth_year)});
            filter_data_for_yr.sort((a, b) => {
                return b.births - a.births;
            }); 

            tooltipLine.attr('stroke', 'black')
                .attr('x1', x(birth_year))
                .attr('x2', x(birth_year))
                .attr('y1', 0)
                .attr('y2', height);

            tooltip.html(`<strong>${birth_year}</strong>`)
                .style('display', 'block')
                .style('left', `${event.x}px`)
                .style('top', `${event.y}px`)
                .selectAll()
                .data(filter_data_for_yr).enter()
                .append('div')
                .style('color', d => color(d.date_category))
                .html(d => `<strong>${formatDateCategory(d.date_category)}</strong>` + ': ' + Math.floor(d.births) + ' births');    
        }

        function pointerleft() {
            tooltip.style("display", "none");
            tooltipLine.attr('stroke', 'none');
        }

        function pointerover() {
            tooltip
            .style("opacity", 0.9)
        }

        // Draw the line
        g.selectAll(".line")
            .data(sumstat)
            .join("path")
                .attr("fill", "none")
                .attr("stroke", function(d){ return color(d[0]) })
                .attr("stroke-width", 2.5)
                .attr("d", function(d){
                return d3.line()
                    .x(function(d) { return x(d.year); })
                    .y(function(d) { return y(+d.births); })
                    (d[1])
                });
        
        g.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('opacity', 0)
            .on("pointerenter pointermove", pointermoved)
            .on("pointerover", pointerover)
            .on("pointerleave", pointerleft);        

        g.append("line")
        .attr("x1", x(1994))
        .attr("y1", y(10000))
        .attr("x2", x(2014))
        .attr("y2", y(10000))
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "2,4");

        g.selectAll("mydots")
        .data(groupNames)
        .enter()
        .append("circle")
            .attr("cx", function(d,i){return x(1994.5+3*i)})
            .attr("cy", y(6500)) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("r", 7)
            .style("fill", function(d){ return color(d)});

        // Add one dot in the legend for each name.
        g.selectAll("mylabels")
        .data(groupNames)
        .enter()
        .append("text")
            .attr("x", function(d,i){return x(1995+3*i)})
            .attr("y", y(6500)) // 100 is where the first dot appears. 25 is the distance between dots
            .style("fill", function(d){ return color(d)})
            .text(function(d){ return formatDateCategory(d)})
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle");

        // Features of the annotation
        const annotations = [
            {
                note: {
                label: "Avg. # of Births on weekends that fell on the 13th never exceeded 10,000!",
                wrap: 300,
                },
                disable: ["connector"],
                x: x(2014),
                y: y(10000),
                dx: -50,
                dy: 1,
            }
        ];

        // Add annotation to the chart
        const makeAnnotations = d3.annotation()
        .annotations(annotations);

        g.append("g")
        .call(makeAnnotations);

        d3.select("g.annotation-group")
        .transition()
        .delay(500) // Delay start by 500ms
        .duration(2000); // Animation takes 2000ms
    }

    function updateChartForScene(sceneIndex) {
        if (sceneIndex === 1) {
            createLollipopChart(USBirthsByDayData,5);
        } else if (sceneIndex === 2) {
            createLineChart1(USBirthsByYearData);
        } else if (sceneIndex === 3) {
            createLineChart2(USBirthsByYearData);
        }
    }
}