// Smoke test for the CJS build
var methods = ["each", "waterfall", "queue", "eachSeries"];
var expect = require('chai').expect;
var rollup = require('rollup').rollup;
var rollupPluginNpm = require('rollup-plugin-npm');
var fs = require('fs');
var exec = require('child_process').exec;

describe("async main", function() {
    var async;

    before(function() {
        async = require("../build/");
    });

    it("should have methods", function() {
        methods.forEach(function(methodName) {
            expect(async[methodName]).to.be.a("function");
        });
    });
});

describe("async umd", function() {
    var async;

    before(function() {
        async = require("../build/async.js");
    });

    it("should have methods", function() {
        methods.forEach(function(methodName) {
            expect(async[methodName]).to.be.a("function");
        });
    });
});

describe("async umd minified", function() {
    var async;

    before(function() {
        async = require("../build/async.min.js");
    });

    it("should have methods", function() {
        methods.forEach(function(methodName) {
            expect(async[methodName]).to.be.a("function");
        });
    });
});

methods.forEach(function (methodName) {
    describe("async." + methodName, function () {
        var method;
        before(function () {
            method = require("../build/" + methodName);
        });

        it("should require the individual method", function() {
            expect(method).to.be.a("function");
        });
    });
});

describe("ES Modules", function () {
    var tmpDir = __dirname + "/../tmp";
    var buildFile = __dirname + "/../tmp/es.test.js";

    before(function (done) {
        if (fs.existsSync(tmpDir)) {
            return done();
        }
        fs.mkdir(tmpDir, done);
    });

    before(function () {
        return rollup({
            entry: __dirname + "/es.test.js",
            plugins: [
                rollupPluginNpm()
            ]
        }).then(function (bundle) {
            return bundle.write({
                format: "cjs",
                dest: buildFile
            });
        });
    });

    it("should build a successful bundle", function (done) {
        exec("node " + buildFile, done);
    });
});
