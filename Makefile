NODE = node
TEST = ./node_modules/.bin/vows
TESTS ?= test/*-test.js

JAKE_MODULE = ../../../../.nvm/v0.6.7/lib/node_modules/jake

test:
	@NODE_ENV=test NODE_PATH=lib JAKE_MODULE=$(JAKE_MODULE) $(TEST) $(TEST_FLAGS) $(TESTS)

.PHONY: test
