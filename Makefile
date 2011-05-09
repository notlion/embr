JS_FILES_PLASK = \
	src/main-plask.js

JS_FILES = \
	src/core/Fbo.js \
	src/core/Math.js \
	src/core/PingPong.js \
	src/core/Program.js \
	src/core/Quat.js \
	src/core/Texture.js \
	src/core/Vbo.js \
	src/noise.js

JS_COMPILER = \
	java -jar util/compiler-20110502/compiler.jar \
	--charset UTF-8

all: embr-plask.min.js embr-plask.js

%.min.js: %.js
	$(JS_COMPILER) < $^ > $@

embr-plask.min.js: embr-plask.js
	rm -f $@
	$(JS_COMPILER) < embr-plask.js >> $@

embr-plask.js: $(JS_FILES_PLASK) $(JS_FILES) Makefile
	rm -f $@
	cat $(JS_FILES_PLASK) $(JS_FILES) >> $@
	chmod a-w $@

clean:
	rm -rf embr-plask.js embr-plask.min.js