var async = require('../../dist/async');
var fs = require('fs-extra');
var path = require('path');

var $ = require('cheerio');
var _ = require('lodash');

var docsDir = path.join(__dirname, '../../docs');
var asyncFile = path.join(__dirname, '../../dist/async.js');
var customStyleSheet = path.join(__dirname, './jsdoc-custom.css');

var pageTitle = 'Methods:';

var docFilename = 'docs.html';
var mainModuleFile = 'module-async.html';
var mainSectionId = '#main';
var sectionTitleClass = '.page-title'

var HTMLFileBegin = '<!DOCTYPE html>\n<html lang="en">\n<head>\n';
var HTMLFileHeadBodyJoin = '</head>\n<body>';
var HTMLFileEnd = '</body>';

var pageTitlePadding = '12px';

var additionalFooterText = ' Documentation has been modified from the original. ' +
    ' For more information, please see the <a href="https://github.com/caolan/async">async</a> repository.';

function generateHTMLFile(filename, $page, callback) {
    // generate an HTML file from a cheerio object
    var HTMLdata = HTMLFileBegin + $page.find('head').html()
        + HTMLFileHeadBodyJoin + $page.find('body').html()
        + HTMLFileEnd;

    fs.writeFile(filename, HTMLdata, callback);
}

function extractModuleFiles(files) {
    return _.filter(files, function(file) {
        return _.startsWith(file, 'module') && file !== mainModuleFile;
    });
}

function combineFakeModules(files, callback) {
    var moduleFiles = extractModuleFiles(files);

    fs.readFile(path.join(docsDir, mainModuleFile), 'utf8', function(err, mainModuleData) {
        if (err) return callback(err);

        var $mainPage = $(mainModuleData);
        // each 'module' (category) has a separate page, with all of the
        // important information in a 'main' div. Combine all of these divs into
        // one on the actual module page (async)
        async.eachSeries(moduleFiles, function(file, fileCallback) {
            fs.readFile(path.join(docsDir, file), 'utf8', function(err, moduleData) {
                if (err) return fileCallback(err);
                var $modulePage = $(moduleData);
                var moduleName = $modulePage.find(sectionTitleClass).text();
                $modulePage.find(sectionTitleClass).attr('id', moduleName.toLowerCase());
                $mainPage.find(mainSectionId).append($modulePage.find(mainSectionId).html());
                return fileCallback();
            });
        }, function(err) {
            if (err) return callback(err);

            generateHTMLFile(path.join(docsDir, docFilename), $mainPage, callback);
        });
    });
}

function applyPreCheerioFixes(data, headLinks) {
    var closingHeadTag = '</head>'

    var customScript = '<script src="scripts/jsdoc-custom.js"></script>\n';
    var closingBodyTag = '</body>';

    var rIncorrectCFText = />ControlFlow</g;
    var fixedCFText = '>Control Flow<';

    var rIncorrectModuleText = />module:(\w+)\.(\w+)</g

    // the heading needs additional padding at the top so it doesn't get cutoff
    return data.replace(closingHeadTag, headLinks+closingHeadTag)
        // inject the async library onto each page
        .replace(closingBodyTag, customScript+closingBodyTag)
        // for JSDoc to work, the module needs to be labelled 'ControlFlow', while
        // on the page it should appear as 'Control Flow'
        .replace(rIncorrectCFText, fixedCFText)
        // for return types, JSDoc doesn't allow replacing the link text, so it
        // needs to be done here
        .replace(rIncorrectModuleText, function(match, moduleName, methodName) {
            return '>'+methodName+'<';
        });
};

function addStaticHeader($file, $headerContent) {
    var $body = $file.find('body');
    var $mainContent = $body.find('#main');
    // var $bodyContent = $body.children();
    // $body.children().remove();
    // $body.prepend('<div class="container-fluid"></div>');
    // $body.find('div').prepend($bodyContent);
    $body.prepend($headerContent);
    // $mainContent.wrap('<div id="main-wrapper"></div>');
    // $file.find('nav').wrap('<div class="fix-nav-toc"></div>');
    // $file.find('footer').appendTo($mainContent);
};

function fixToc($page, moduleFiles) {
    // remove `async` listing from toc
    $page.find('li').find('a[href="'+mainModuleFile+'"]').parent().remove();

    // change toc title
    $page.find('nav').children('h3').text(pageTitle);
    $page.find('nav').children('h2').remove();

    // make everything point to the same 'docs.html' page
    _.each(moduleFiles, function(filename) {
        $page.find('[href^="'+filename+'"]').each(function() {
            var $ele = $(this);
            var href = $ele.attr('href');

            // category titles should sections title, while everything else
            // points to the correct listing
            if (href === filename) {
                var moduleName = $ele.text().toLowerCase().replace(/\s/g, '');
                $ele.attr('href', docFilename+'#'+moduleName);
            } else {
                $ele.attr('href', href.replace(filename, docFilename));
            }
        });
    });
}

function fixFooter($page) {
    // add a note to the footer that the documentation has been modified
    var $footer = $page.find('footer');
    var text = $footer.text();
    $footer.append(additionalFooterText);
};

function fixModuleLinks(files, callback) {
    var moduleFiles = extractModuleFiles(files);

    async.map(['head-data.html', 'navbar.html'], function(filename, fileCallback) {
        fs.readFile(path.join(__dirname, filename), 'utf8', function(err, data) {
            if (err) return fileCallback(err);
            return fileCallback(null, data);
        });
    }, function(err, results) {
        if (err) return callback(err);

        var $headerContent = $(results[1]);
        async.each(files, function(file, fileCallback) {
            var filePath = path.join(docsDir, file);
            fs.readFile(filePath, 'utf8', function(err, fileData) {
                if (err) return fileCallback(err);
                var $file = $(applyPreCheerioFixes(fileData, results[0]));

                addStaticHeader($file, $headerContent);
                fixToc($file, moduleFiles);
                fixFooter($file);
                $file.find('[href="'+mainModuleFile+'"]').attr('href', docFilename);
                generateHTMLFile(filePath, $file, fileCallback);
            });
        }, callback);
    });
}

fs.copySync(path.join(__dirname, '../../dist/async.js'), path.join(docsDir, 'scripts/async.js'), { clobber: true });
fs.copySync(path.join(__dirname, './jsdoc-custom.js'), path.join(docsDir, 'scripts/jsdoc-custom.js'), { clobber: true });
fs.copySync(path.join(__dirname, './jsdoc-custom.css'), path.join(docsDir, 'styles/jsdoc-custom.css'), { clobber: true });


fs.readdir(docsDir, function(err, files) {
    if (err) {
        throw err;
    }

    var HTMLFiles = _.filter(files, function(file) {
        return path.extname(file) === '.html';
    });

    combineFakeModules(HTMLFiles, function(err) {
        if (err) throw err;

        HTMLFiles.push(docFilename);

        fixModuleLinks(HTMLFiles, function(err) {
            if (err) throw err;
            console.log('Docs generated successfully');
        });
    });
});
