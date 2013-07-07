#!/usr/bin/env node

/*
--checks checks.json --url http://warm-refuge-7653.herokuapp.com
*/

var program = require('commander');
var fs = require('fs');
var cheerio = require('cheerio');

var sys = require('util');
var rest = require('restler');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var HTMLCOPY_DEFAULT = "./index.html.cp";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

if(require.main == module) {
    var csvfile = HTMLCOPY_DEFAULT;
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url_file>', 'Path to url')
        .parse(process.argv);

    var checkJson;
    if (program.file) {
	csvfile = program.file;
//	console.log(' program file = %s ', csvfile);
    }
    if (program.url){
//	console.log(' url = %s ', program.url);
	
	rest.get(program.url).on('complete', function(result) {
	    var csvfile = HTMLCOPY_DEFAULT;
	    if (result instanceof Error) {
		sys.puts('Error: ' + result.message);
		this.retry(5000); // try again after 5 sec
	    } else {
		fs.writeFileSync(csvfile, result);
	    }
	});
    }
    checkJson = checkHtmlFile(csvfile, program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);

} else {
    exports.checkHtmlFile = checkHtmlFile;
}

