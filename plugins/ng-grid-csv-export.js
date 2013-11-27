// Todo:
// 1) Make the button prettier
// 2) add a config option for IE users which takes a URL.  That URL should accept a POST request with a
//    JSON encoded object in the payload and return a CSV.  This is necessary because IE doesn't let you
//    download from a data-uri link
//
// Notes:  This has not been adequately tested and is very much a proof of concept at this point
function ngGridCsvExportPlugin (opts) {
    opts = opts||{}; // remove need for null checks on opts
    var self = this;
    self.grid = null;
    self.scope = null;
    self.init = function(scope, grid, services) {
        self.grid = grid;
        self.scope = scope;
        self.scope.csvExportFilename = opts.initialFilename||"Export.csv";
        function showDs() {
            var keys = [];
            var fieldNames = {};
            for (var f in grid.config.columnDefs) {
                keys.push(grid.config.columnDefs[f].field);
                fieldNames[grid.config.columnDefs[f].field] = grid.config.columnDefs[f].displayName||grid.config.columnDefs[f].field;
            }
            var csvData = '';
            function csvStringify(str) {
                if (str == null) { // we want to catch anything null-ish, hence just == not ===
                    return '';
                }
                if (typeof(str) === 'number') {
                    return '' + str;
                }
                if (typeof(str) === 'boolean') {
                    return (str ? 'TRUE' : 'FALSE') ;
                }
                if (typeof(str) === 'string') {
                    return str.replace(/"/g,'""');
                }

                return JSON.stringify(str).replace(/"/g,'""');
            }
            function swapLastCommaForNewline(str) {
                var newStr = str.substr(0,str.length - 1);
                return newStr + "\n";
            }
            for (var k in keys) {
                csvData += '"' + csvStringify(fieldNames[keys[k]]) + '",';
            }
            csvData = swapLastCommaForNewline(csvData);
            var gridData = grid.data;
            for (var gridRow in gridData) {
                for ( k in keys) {
                    var curCellRaw = services.UtilityService.evalProperty(gridData[gridRow], keys[k]);
                    if (opts != null && opts.columnOverrides != null && opts.columnOverrides[keys[k]] != null) {
                        curCellRaw = opts.columnOverrides[keys[k]](curCellRaw);
                    }
                    csvData += '"' + csvStringify(curCellRaw) + '",';
                }
                csvData = swapLastCommaForNewline(csvData);
            }
            var fp = grid.$root.find(".ngFooterPanel");
            var csvDataLinkPrevious = grid.$root.find('.ngFooterPanel .csv-data-link-span');
            if (csvDataLinkPrevious != null) {csvDataLinkPrevious.remove() ; }
            var csvDataLinkHtml = "<span class=\"csv-data-link-span\">";
            csvDataLinkHtml += "<br><a href=\"data:text/csv;charset=UTF-8,";
            csvDataLinkHtml += encodeURIComponent(csvData);
            csvDataLinkHtml += "\" download=\""+encodeURIComponent(self.scope.csvExportFilename).replace("'", "%27")+"\">CSV Export</a>";
            if (opts.editableFilename) {
                csvDataLinkHtml += " <input type='text' class='ng-grid-csv-export-filename' value='"+self.scope.csvExportFilename+"'/>";
            }
            csvDataLinkHtml += "</br></span>";
            fp.append(csvDataLinkHtml);
            if (opts.editableFilename) {
                var filenameInput = grid.$root.find(".ngFooterPanel .csv-data-link-span input.ng-grid-csv-export-filename");
                filenameInput.on("change", function(event) {
                    var csvDataLink = grid.$root.find(".ngFooterPanel .csv-data-link-span a");
                    self.scope.csvExportFilename = event.currentTarget.value;
                    csvDataLink.attr("download", self.scope.csvExportFilename);
                });
            }
        }
        setTimeout(showDs, 0);
        scope.catHashKeys = function() {
            var hash = '';
            for (var idx in scope.renderedRows) {
                hash += scope.renderedRows[idx].$$hashKey;
            }
            return hash;
        };
        scope.$watch('catHashKeys()', showDs);
    };
}
