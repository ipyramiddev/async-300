PACKAGE = asyncjs
CWD := $(shell pwd)
NODEUNIT = "$(CWD)/node_modules/.bin/nodeunit"
UGLIFY = "$(CWD)/node_modules/.bin/uglifyjs"
JSHINT = "$(CWD)/node_modules/.bin/jshint"
XYZ = node_modules/.bin/xyz --repo git@github.com:caolan/async.git

BUILDDIR = dist

all: clean test build

build: $(wildcard  lib/*.js)
	mkdir -p $(BUILDDIR)
	$(UGLIFY) lib/async.js > $(BUILDDIR)/async.min.js

test:
	$(NODEUNIT) test

clean:
	rm -rf $(BUILDDIR)

lint:
	$(JSHINT) lib/*.js test/*.js perf/*.js

.PHONY: test lint build all clean


.PHONY: release-major release-minor release-patch
release-major release-minor release-patch: all
	git add --force dist
  @$(XYZ) --increment $(@:release-%=%)
