compile:
	./node_modules/coffee-script/bin/coffee -o ./lib -c ./src
watch:
	./node_modules/coffee-script/bin/coffee -w -o ./lib -c ./src
clean:
	rm -rf ./lib ./docs
