JS_FILES_PLASK = \
	src/main-plask.js

JS_FILES_WEBGL = \
	src/main-webgl.js \
	src/plask-utils.js

JS_FILES = \
	src/core/Util.js \
	src/core/Math.js \
	src/core/Quat.js \
	src/core/Noise.js \
	src/core/Texture.js \
	src/core/Fbo.js \
	src/core/PingPong.js \
	src/core/Vbo.js \
	src/core/Program.js \
	src/mesh/Material.js \
	src/mesh/ColorMaterial.js \
	src/mesh/NormalMaterial.js

JS_COMPILER = \
	java -jar util/compiler-20110502/compiler.jar \
	--charset UTF-8

all: embr-plask.js embr-webgl.js embr-webgl.min.js

%.min.js: %.js
	$(JS_COMPILER) < $^ > $@

embr-plask.js: $(JS_FILES_PLASK) $(JS_FILES) Makefile
	rm -f $@
	cat $(JS_FILES_PLASK) $(JS_FILES) >> $@
	chmod a-w $@

embr-webgl.js: $(JS_FILES_WEBGL) $(JS_FILES) Makefile
	rm -f $@
	cat $(JS_FILES_WEBGL) $(JS_FILES) >> $@
	chmod a-w $@

embr-webgl.min.js: embr-webgl.js
	rm -f $@
	$(JS_COMPILER) < embr-webgl.js >> $@

clean:
	rm -rf embr-plask.js embr-webgl.js embr-webgl.min.js