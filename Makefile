compile:
	./node_modules/coffee-script/bin/coffee -o ./build -c ./src
docs:
	./node_modules/docco/bin/docco -o ./docs ./src/*.coffee
watch:
	./node_modules/coffee-script/bin/coffee -w -o ./build -c ./src
clean:
	rm -rf ./build ./docs
