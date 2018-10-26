var tabletime;
var link2;
var z;
var tableData = []; //array that will collect data for standard table layout

var coloringColumn = ''; //coloring column to compare

        var cssId = 'semantic-theming';  // you could encode the css path itself to generate id..
        if (!document.getElementById(cssId))
        {
            var head  = document.getElementsByTagName('head')[0];
            var link  = document.createElement('link');
            link2 = document.createElement('link');
            link.id   = cssId;
            link.rel  = 'stylesheet';
            link.type = 'text/css';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/tabulator/4.0.1/css/semantic-ui/tabulator_semantic-ui.min.css';
            link.media = 'all';
            link2.id = 'font-style'
            link2.rel = 'stylesheet';
            link2.type = 'text/css';
            link2.href = 'https://fonts.googleapis.com/css?family=Lato';
            link2.media = 'all';
            head.appendChild(link);
            head.appendChild(link2);
        }

function fontChanger(font) {
    container.style.fontFamily = font;
    var font = font.replace(" ","+");
    // console.log(font);
    var hreflink = 'https://fonts.googleapis.com/css?family=' + font;
    // console.log(hreflink);
    link2.href = hreflink;
}

function themeChanger(theme, invert) {
    var inverted = '';
    if (invert == 'yes') {
        inverted = 'inverted ';
    }
    var tabulatorTheme = "tabulator ui " + inverted + theme + " celled table";
    // console.log(tabulatorTheme);
    container.setAttribute("class",tabulatorTheme);
}

function sorterizer(a, b, aRow, bRow, column, dir, sorterParams) {
    var points =[];
    var columnDef = column.getDefinition().field;
    columnDef = 'sorting_value_' + columnDef;
    var sortValue1 = aRow.getData()[columnDef];
    var sortValue2 = bRow.getData()[columnDef];

    if (typeof sortValue1 === "undefined") {
        sortValue1 = a;
    }
    if (typeof sortValue2 === "undefined") {
        sortValue2 = b;
    }
    if (typeof sortValue1 === "string") {
        return sortValue1.localeCompare(sortValue2);
    } else {
        return sortValue1 - sortValue2;
    }
    
}

function headerSizer(fontSize) {
    var curHeaders = document.getElementsByClassName("tabulator-col");
    for (var i = 0; i < curHeaders.length; i++) {
        curHeaders[i].style.fontSize = fontSize.toString() + "px";
    }
    // document.getElementsByClassName("tabulator-header")[0].style.fontSize = fontSize.toString() + "px";
    tabletime.redraw(true);
}

function numericThreshGetter(value, thresh) {
    try {
        var result = eval(value + thresh);
        return result;
    } catch(err) {
        return false;
    }        
}

function standardTable(data, config) {
            z = 1;
            standardTableData = [];
            for (var row of data){

            var rowDetails = {};
            rowDetails['id'] = z;

            var cellValues = row;
            s=0;
            for (var key in cellValues){
                // console.log("key is: " + key + " and row is: " + cellValues + " and the value is: " + cellValues[key]);
                var properties = Object.keys(cellValues[key]);
                columnLabel = key;
                columnLabel = columnLabel.slice(columnLabel.indexOf(".")+1);
                if (properties.includes('rendered')) {
                    rowDetails[columnLabel] = cellValues[key]['rendered'];
                    rowDetails['sorting_value_'+columnLabel] = cellValues[key]['value'];
                    if (config.comparison_type == 'numeric') {
                        if (columnLabel == coloringColumn) {
                            rowDetails['numericThresh'] = numericThreshGetter(cellValues[key]['value'],config.comparison_value);
                        }
                    }
                } else {
                    rowDetails[columnLabel] = cellValues[key]['value'];
                    if (config.comparison_type == 'numeric') {
                        if (columnLabel == coloringColumn) {
                            rowDetails['numericThresh'] = numericThreshGetter(cellValues[key]['value'],config.comparison_value);
                        }
                    }                    
                }
                rowDetails['links_' + columnLabel] = cellValues[key]['links'];
                s +=1;
            }
            z+=1;

            standardTableData.push(rowDetails);
        }
        return standardTableData;
}

var pivotTableFields = {};

function colWidthFunction(element) {
    console.log(element);
}

function dimensionGetter(queryResponse, config) {
    console.log(config);
    var pivotTableColumns = [];
    for (var g = 0; g < queryResponse.fields.dimension_like.length; g++) {
        var pivotDimensions = {};
        pivotDimensions['title'] = queryResponse.fields.dimension_like[g].label_short;
        if (typeof pivotDimensions['title'] === "undefined") {
            pivotDimensions['title'] = queryResponse.fields.dimension_like[g].label;
        }
        var tempField = queryResponse.fields.dimension_like[g].name; //get normal label for table calcs
        var fieldName = tempField.slice(tempField.indexOf(".")+1);
        pivotDimensions['field'] = fieldName;
        if (pivotDimensions['title'] == config.color_row) {
            console.log('captain ryder sir');
            coloringColumn = fieldName;
        }
        // pivotDimensions['titleFormatter'] = customFormatter;
        pivotTableColumns.push(pivotDimensions);
    }
    return pivotTableColumns;
}


function pivotColumns(data, queryResponse,config) {
    var pivotTableColumns = dimensionGetter(queryResponse,config);

    for (var i = 0; i < queryResponse.fields.measure_like.length; i++) {

        var pivotMeasures = {};
        pivotMeasures['title'] = queryResponse.fields.measure_like[i].label_short;
        if (typeof pivotMeasures['title'] === "undefined") {
            pivotMeasures['title'] = queryResponse.fields.measure_like[i].label
        }
        // pivotMeasures['titleFormatter'] = headerFormatter;
        pivotMeasures['columns'] = [];
        for (var u = 0; u < queryResponse.pivots.length; u++) {
            var pivotTableSubColumns = {};
            var labeler;
            labeler = queryResponse.pivots[u]['key'];
            if (labeler === "$$$_row_total_$$$") {
                labeler = "Total";
            }
            if (labeler.indexOf("|") < 0 ) {
                var indy = labeler.length;
            } else {
                var indy = labeler.indexOf("|");
            }
            pivotTableSubColumns['title'] = labeler.slice(0,indy);
            var fieldNameShort = queryResponse.fields.measure_like[i].name;
            if (queryResponse.pivots[u]['key'] === "$$$_row_total_$$$") {
                pivotTableSubColumns['field'] = fieldNameShort.slice(fieldNameShort.indexOf(".")+1) + "_" + queryResponse.pivots[u]['key'];
            } else {
                pivotTableSubColumns['field'] = fieldNameShort.slice(fieldNameShort.indexOf(".")+1) + "_" + labeler.toLowerCase();
            }
            
            pivotTableSubColumns['sorter'] = sorterizer;
            // pivotTableSubColumns['titleFormatter'] = headerFormatter;
            pivotMeasures['columns'].push(pivotTableSubColumns);

        }
        pivotTableColumns.push(pivotMeasures);
    }
    console.log(pivotTableColumns);
    return pivotTableColumns;
}

function getPivotData(data,queryResponse,config){
    var pivotTableData = [];
    z = 0;
    for (var cell of data) {
        z+=1;
        var pivotCell = {};
        pivotCell['id'] = z;
        for (var key in cell) {
            var properties = Object.keys(cell[key]);
            var fieldref = key.slice(key.indexOf(".")+1);
            if (properties.includes('value')) {
                pivotCell[fieldref] = cell[key].value;
                pivotCell['links_' + fieldref] = cell[key].links;
            } else {
                var arr = cell[key];
                for (pivot in arr) {
                    // if (pivot === '$$$_row_total_$$$') {
                    //     pivot = 'Row Total';
                    // }
                    var pivotlabel = fieldref + "_" + pivot;
                    pivotlabel = pivotlabel.toLowerCase();
                    var subProperties = Object.keys(arr[pivot]);
                    if (subProperties.includes('rendered')) {
                        pivotCell[pivotlabel] = arr[pivot]['rendered'];
                        pivotCell['sorting_value_'+pivotlabel] = arr[pivot]['value'];
                    } else {
                        pivotCell[pivotlabel] = arr[pivot]['value'];
                    }
                    pivotCell['links_' + pivotlabel] = arr[pivot]['links'];
                }
            }            
            
        }

    pivotTableData.push(pivotCell);
    }
    console.log(pivotTableData);
    return pivotTableData;
    
}

function lineFormatter(cell, formatterParams, onRendered) {
    onRendered(function(){
        $(cell.getElement()).sparkline(cell.getValue(), {width:"100%", type:"line", lineColor: table_spark_theme});
    });
}

function barFormatter(cell, formatterParams, onRendered){
    onRendered(function(){ 
        $(cell.getElement()).sparkline(cell.getValue(), {width:"100%", type:"bar", barWidth:16, barColor: table_spark_theme});
    });
}

function boxFormatter(cell, formatterParams, onRendered){
    onRendered(function(){ 
        $(cell.getElement()).sparkline(cell.getValue(), {width:"100%", type:"box"});
    });
}

var headerSize; //global header variable to access config

var customFormatter = function(cell, formatterParams, onRendered){

    cell.getElement().style.fontSize = "18px";
    console.log(cell.getElement());
    return cell.getValue();
}

function sparkPivot(data, queryResponse, config) {

    console.log("Row total sitch: " + queryResponse.has_row_totals);

    console.log(queryResponse);
    var pivotSparkColumns = dimensionGetter(queryResponse, config);

    for (var p = 0; p < queryResponse.fields.measure_like.length; p++){
        var pivotMeasures = {};
        pivotMeasures['title'] = queryResponse.fields.measure_like[p].label_short;
        if (typeof pivotMeasures['title'] === "undefined") {
            pivotMeasures['title'] = queryResponse.fields.measure_like[p].label;
        }
        // pivotMeasures['titleFormatter'] = headerFormatter;
        console.log(pivotMeasures);
        pivotMeasures['columns'] = [];
        for (var u = 0; u < queryResponse.fields.pivots.length; u++) {
            var pivotSubColumns = {};
            pivotSubColumns['title'] = queryResponse.fields.pivots[u]['label_short'];
            var fieldNameShort = queryResponse.fields.pivots[u].name;
            fieldNameShort = fieldNameShort.slice(fieldNameShort.indexOf(".")+1);
            var measNameShort = queryResponse.fields.measure_like[p].name;
            measNameShort = measNameShort.slice(measNameShort.indexOf(".")+1);
            pivotSubColumns['field'] = measNameShort + "_" + fieldNameShort;
            console.log(queryResponse.fields.pivots[u]);
            var sp = config.spark_type;
            console.log(sp);
            pivotSubColumns['formatter'] = eval(sp);
            pivotMeasures['columns'].push(pivotSubColumns);
            if (queryResponse.has_row_totals == true) {
                var pivTotal = {};
                pivTotal['title'] = "Total";
                pivTotal['field'] = measNameShort + "_row_total";
                pivTotal['sorter'] = sorterizer;
                pivotMeasures['columns'].push(pivTotal);
            }
            

        }
        pivotSparkColumns.push(pivotMeasures);
    }
    console.log(pivotSparkColumns);
    return pivotSparkColumns;
}

function sparkData(data, queryResponse, config) {
    var pivotSparkData = [];
    z = 0;
    for (var cell of data) {
        z+=1;
        var pivotCell = {};
        pivotCell['id'] = z;
        for (var key in cell) {
            var properties = Object.keys(cell[key]);
            var fieldref = key.slice(key.indexOf(".")+1);
            var fieldNameShort = queryResponse.fields.pivots[0].name;
            fieldNameShort = fieldNameShort.slice(fieldNameShort.indexOf(".")+1);
            if (properties.includes('value')) {
                pivotCell[fieldref] = cell[key].value;
                pivotCell['links_' + fieldref] = cell[key].links;
            } else {
                var identifier = fieldref + "_" + fieldNameShort;
                pivotCell[identifier] = [];
                var arr = cell[key];
                for (spark in arr) {
                    if (spark !== "$$$_row_total_$$$") {
                        pivotCell[identifier].push(arr[spark]['value']); 
                    } else if (spark === "$$$_row_total_$$$") {
                        pivotCell[fieldref+"_row_total"] = arr[spark]['rendered'];
                        pivotCell['sorting_value_'+fieldref+"_row_total"] = arr[spark]['value'];
                    }           
                }
            }
        }
        pivotSparkData.push(pivotCell);
    }
    console.log(pivotSparkData);
    console.log(data);
    return pivotSparkData;
}

function normalColumns(data, queryResponse, config){
    var fieldsForTable = [];
    for (var i = 0; i < queryResponse.fields.dimensions.length; i++) {
            var dimensionProperties = {};
            dimensionProperties['title'] = queryResponse.fields.dimension_like[i].label_short;
            if (typeof dimensionProperties['title'] === "undefined") {
                dimensionProperties['title'] = queryResponse.fields.dimension_like[i].label;
            }
            var tempField = queryResponse.fields.dimension_like[i].name; //get normal label for table calcs
            var fieldName = tempField.slice(tempField.indexOf(".")+1);
            dimensionProperties['field'] = fieldName;
            if (dimensionProperties['title'] == config.color_row) {
                coloringColumn = fieldName;
            }
            dimensionProperties['headerFilter'] = 'input';
            dimensionProperties['sorter'] = 'string';
            // dimensionProperties['titleFormatter'] = headerFormatter;
            fieldsForTable.push(dimensionProperties);

        }

        for (var i = 0; i < queryResponse.fields.measure_like.length; i++) {
            var measureProperties = {};
            measureProperties['title'] = queryResponse.fields.measure_like[i].label_short;
            if (typeof measureProperties['title'] === "undefined") {
                measureProperties['title'] = queryResponse.fields.measure_like[i].label;
            }
            var tempMeasure = queryResponse.fields.measure_like[i].name;
            var measureName = tempMeasure.slice(tempMeasure.indexOf(".")+1);
            measureProperties['field'] = measureName;
            measureProperties['sortable'] = true;
            if (measureProperties['title'] == config.color_row) {
            coloringColumn = measureName;
            }
            measureProperties['sorter'] = sorterizer;
            // measureProperties['titleFormatter'] = headerFormatter;
            fieldsForTable.push(measureProperties);
        }
        return fieldsForTable;
}


var table_spark_theme;
        

looker.plugins.visualizations.add({
    create: function(element, config){

        container = element.appendChild(document.createElement("div"));
        container.setAttribute("id","my-table");
        container.setAttribute("class","tabulator ui teal table");
        if (typeof config.table_font != 'undefined') {
            container.style.fontFamily = config.table_font;
        } else {
            container.style.fontFamily = "Lato";
        }
        

    },
    options: {
        color_row: {
          type: "string",
          label: "Choose Field to Color By",
          display: "text",
          section: "Row Coloring",
          order: 1
        },
        comparison_type: {
            type: "string",
            order: 2,
            label: "Choose Comparison Type",
            display: "radio",
            section: "Row Coloring",
            values: [
                {"Exact Match" : "exact"},
                {"Numeric Threshold": "numeric"}
            ]
        },
        comparison_value: {
            type: "string",
            order: 3,
            label: "Value (eg Enter > 10 for Numeric Threshold)",
            display: "text",
            section: "Row Coloring"
        },
        comparison_result: {
            type: "string",
            order: 4,
            label: "Result is:",
            display: "radio",
            default: "negative",
            section: "Row Coloring",
            values: [
                {"Good" : "positive"},
                {"Bad" : "negative"}
            ]
        },
        table_height: {
            type: "number",
            order: 1,
            label: "Height",
            display: "string",
            section: "General Settings",
            default: 311
        },
        table_font: {
            type: "string",
            order: 2,
            label: "Any Sans Serif Google Font",
            display: "text",
            section: "General Settings",
            default: "Lato"
        },
        table_theme: {
            type: "string",
            order: 7,
            label: "Table Color Theme",
            display: "text",
            section: "General Settings",
            default: "teal"
        },
        theme_inverted: {
            type: "string",
            order: 8,
            label: "Invert Color",
            display: "radio",
            values: [
                {"Yes" : "yes"},
                {"No" : "no"}
            ],
            section: "General Settings",
            default: "no"
        },
        header_font_size: {
            type: "number",
            order: 3,
            label: "Table Header Font Size",
            display: "string",
            section: "General Settings",
            default: 14
        },
        body_font_size: {
            type: "string",
            order: 4,
            label: "Table Body Font Size",
            display: "text",
            section: "General Settings",
            default: "14"
        },
        spark_table: {
            type: "string",
            order: 1,
            label: "Sparkline Table",
            display: "radio",
            section: "Spark Line Table",
            default: "no",
            values: [
                {"Yes" : "yes"},
                {"No" : "no"}
            ]
        },
        spark_type: {
            type: "string",
            order: 2,
            label: "Choose Chart Type:",
            display: "radio",
            section: "Spark Line Table",
            default: "barFormatter",
            values: [
                {"Bar" : "barFormatter"},
                {"Line" : "lineFormatter"},
                {"Box Plot" : "boxFormatter"}
            ]
        },
        text_align: {
            type: "string",
            order: 5,
            label: "Align Text:",
            display: "radio",
            section: "General Settings",
            default: "center",
            values: [
                {"Left" : "left"},
                {"Center" : "center"},
                {"Right" : "right"}
            ]
        },
        table_layout: {
            type: "string",
            order: 6,
            label: "Table Layout",
            display: "radio",
            section: "General Settings",
            default: "fitData",
            values: [
                {"Fit to Data" : "fitData"},
                {"Fit the Columns" : "fitColumns"}
            ]
        }
    }, 
    updateAsync: function(data, element, config, queryResponse, details, doneRendering){
        coloringColumn = undefined;
        var measureCount = queryResponse.fields.measure_like.length;
        var dimensionCount = queryResponse.fields.dimension_like.length;
        var pivotCount = queryResponse.fields.pivots.length;

        headerSize = config.header_font_size;
        table_spark_theme = config.table_theme;


        // var coloringColumn; //store field name based on label to color a row by, check queryResponse first, then data for hidden fields

        this.clearErrors();


        var fieldsForTable = [];

        if (pivotCount == 1) {
            if (config.spark_table == "yes") {
                fieldsForTable = sparkPivot(data,queryResponse,config);
            } else {
                fieldsForTable = pivotColumns(data, queryResponse,config);
            }
        } else {
            fieldsForTable = normalColumns(data, queryResponse, config);
        }

        //create Tabulator on DOM element with id "example-table"@
            tabletime = new Tabulator("#my-table", {
            rowFormatter:function(row){
            var rowData = row.getData();
            var currentStyle = row.getElement().className;
            row.getElement().style.fontSize = config.body_font_size + "px";
            row.getElement().style.textAlign = config.text_align;
            if (config.comparison_type == 'exact') {
                if(rowData[coloringColumn] == config.comparison_value){
                    currentStyle = currentStyle + " " + config.comparison_result;
                    // row.getElement().setAttribute("class",currentStyle);
                    }
            } else {
                if(config.comparison_type == 'numeric') {
                    console.log(coloringColumn);
                    console.log(rowData["sorting_value_" + coloringColumn]);
                    console.log(config.comparison_value);
                    var colorTF = numericThreshGetter(rowData["sorting_value_" + coloringColumn],config.comparison_value);
                    console.log(colorTF);
                    if (colorTF == true) {
                        currentStyle = currentStyle + " " + config.comparison_result;
                    }
                } 
            }
            row.getElement().setAttribute("class",currentStyle);
            },
            height:config.table_height, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
            layout:config.table_layout,
            scrollToRowIfVisible: false,
            columnVertAlign: "bottom",
            columns: fieldsForTable,
            cellClick: function(e, cell){
                var linkCol = cell.getField();
                linkCol = 'links_' + linkCol;
                var linkData = cell.getData()[linkCol];
                LookerCharts.Utils.openDrillMenu({
                links: linkData,
                event: e
                });
            },
        }); 

        fontChanger(config.table_font);
        themeChanger(config.table_theme, config.theme_inverted);
        // headerSizer(config.header_font_size);

        
        
        if (typeof coloringColumn === "undefined") {
            coloringColumn = config.color_row.toLowerCase();
            console.log(coloringColumn.replace(/\s/g,"_"));
            coloringColumn = coloringColumn.replace(/\s/g,"_");
        }

        console.log(coloringColumn);
        

        // if (pivotCount == 0) {
        //     standardTable(data, config);
        // } else if (pivotCount == 1) {
        //     getPivotData(data, config);
        // }


        if (pivotCount == 1) {
            if (config.spark_table == "yes") {
                tableData = sparkData(data,queryResponse,config);
            } else {
                tableData = getPivotData(data,queryResponse,config);
            }
        } else {
            tableData = standardTable(data,config);
        }

        console.log(tableData)

        buildTable(tableData,config.body_font_size);

        

  doneRendering()
    }
});

function buildTable(dataset,bodyFont){
    tabletime.setData(dataset);
    tabletime.redraw(true);
    // bodySizer(bodyFont);
    var allMyRows = tabletime.getRows();
    for (rowe in allMyRows) {
        // console.log(rowe);
        // rowe.reformat();
    }
}

