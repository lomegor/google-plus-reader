all:
	cp -r background.html COPYING icon16.png icon.png options.html styles/ scripts/ icon48.png manifest.json README release/
	zip -r google+reader.zip release/*
	mv google+reader.zip bin/
