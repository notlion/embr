compile:
	./node_modules/coffee-script/bin/coffee -bw -o ./build -c ./src
docs:
	./node_modules/docco/bin/docco -o ./docs ./src/*.coffee
clean:
	rm -rf ./build ./docs
