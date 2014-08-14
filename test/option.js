var Cli = require('./../lib/cli'),
	CliError = require('./../lib/error/abstract-error');

exports.testOptionBasic = function (test) {
	var cli = new Cli();
	cli
		.option('test1', 'Just a test parameter', '-t', '--test1', 'string')
		.parse(['cli-test.js', '-t', 'value1']);
	test.equal(cli.params.test1, 'value1');
	test.done();
}

exports.testOptionBasicValidateNumberType = function (test) {
	var cli = new Cli();
	cli
		.option('test1', 'Just a test parameter', '-t', '--test1', 'number')
		.parse(['cli-test.js', '-t', '123.5']);
	test.equal(cli.params.test1, 123.5);
	test.done();
}

exports.testOptionBasicMissingOkay = function (test) {
	var cli = new Cli();
	cli
		.option('test1', 'Just a test parameter', '-t', '--test1', 'string')
		.parse(['cli-test.js']);
	test.strictEqual(cli.params.test1, undefined);
	test.done();
}

exports.testOptionBasicMissingFirstOkay = function (test) {
	var cli = new Cli();
	cli
		.option('test1', 'Just a test parameter', '-t', '--test1', 'string')
		.option('test2', 'Just another test parameter', '-u', '--test2', 'string')
		.parse(['cli-test.js', '--test2', 'value2']);
	test.equal(cli.params.test2, 'value2');
	test.done();
}


function setupMultiple() {
	var cli = new Cli();
	cli
		.option('test1', 'Just a test parameter', '-t', '--test1', 'string')
		.option('test2', 'Just another test parameter', '-u', '--test2', 'string');
	return cli;
}

exports.testOptionMultipleShorts = function (test) {
	var cli = setupMultiple();

	cli.parse(['cli-test.js', '-t', 'value1', '-u', 'hello']);
	test.equal(cli.params.test1, 'value1');
	test.equal(cli.params.test2, 'hello');
	test.done();
}

exports.testOptionMultipleLongs = function (test) {
	var cli = setupMultiple();

	cli.parse(['cli-test.js', '--test1', 'value1', '--test2', 'hello']);
	test.equal(cli.params.test1, 'value1');
	test.equal(cli.params.test2, 'hello');
	test.done();
}

exports.testOptionMultipleLongShort = function (test) {
	var cli = setupMultiple();

	cli.parse(['cli-test.js', '-t', 'value1', '--test2', 'hello']);
	test.equal(cli.params.test1, 'value1');
	test.equal(cli.params.test2, 'hello');
	test.done();
}

exports.testOptionMultipleOutOfOrder = function (test) {
	var cli = setupMultiple();
	//Out of order
	cli.parse(['cli-test.js', '-u', 'hello', '--test1', 'value1']);
	test.equal(cli.params.test1, 'value1');
	test.equal(cli.params.test2, 'hello');
	test.done();
}

exports.testOptionRequired = function (test) {
	var cli = new Cli({helpOnNoArgs: false});
	cli
		.option('test1', 'Just a test parameter', '-t', '--test1', 'string', true)
		.parse(['cli-test.js', '-t', 'value1']);
	test.equal(cli.params.test1, 'value1');

	test.throws(function () {
		cli.parse(['cli-test.js']);
	}, CliError);
	test.done();
}

exports.testOptionReqiuredMultiple = function (test) {
	var cli = new Cli();
	cli
		.option('test1', 'Just a test parameter', '-t', '--test1', 'string', true)
		.option('test2', 'Just another test parameter', '-u', '--test2', 'string', true)
		.parse(['cli-test.js', '-t', 'value1', '-u', 'hello']);
	test.equal(cli.params.test1, 'value1');
	test.equal(cli.params.test2, 'hello');

	test.throws(function () {
		cli.parse(['cli-test.js', '--test1', 'value1', 'hello']);
	});
	test.done();
}

exports.testOptionNumValues1 = function (test) {
	var cli = new Cli();
	cli
		.option('test1', 'Just a test parameter', '-t', '--test1', 'string')
		.option('test2', 'Test with a single', '-u', '--test2', 'string', 1)
		.parse(['cli-test.js', '-u', 'value2']);
	test.equal(cli.params.test2, 'value2');

	cli.parse(['cli-test.js', '-u', 'hello']);
	test.equal(cli.params.test2, 'hello');

	test.throws(function () {
		cli.parse(['cli-test.js', 'hello']);
	});

	test.throws(function () {
		cli.parse(['cli-test.js', '--test1', 'value1', 'hello']);
	});
	test.done();
}

exports.testOptionNumValuesFixed = function (test) {
	var cli = new Cli();
	cli
		.option('test1', 'Just a test parameter', '-t', '--test1', 'string', 3)
		.parse(['cli-test.js', '-t', 'value1', 'value2', 'value3']);

	var actual = ['value1', 'value2', 'value3'];
	for (var i = 0; i < actual.length; i++) {
		test.equal(cli.params.test1[i], actual[i]);
	}
	test.done();
}

exports.testOptionNumValuesFixedTooFew = function (test) {
	var cli = new Cli();
	cli
		.option('test1', 'Just a test parameter', '-t', '--test1', 'string', 3);

	test.throws(function () {
		cli.parse(['cli-test.js', '-t', 'hello']);
	});

	test.throws(function () {
		cli.parse(['cli-test.js', '-t', 'hello', 'world']);
	});

	test.done();
}

exports.testOptionNumValuesFixedTooMany = function (test) {
	var cli = new Cli();
	cli
		.option('test1', 'Just a test parameter', '-t', '--test1', 'string', 3);

	test.throws(function () {
		cli.parse(['cli-test.js', '-t', 'hello', 'world', 'too', 'many']);
	});
	test.done();
}

exports.testOptionNumValuesStar = function (test) {
	var cli = new Cli();
	cli
		.option('test1', 'Just a test parameter', '-t', '--test1', 'string', '*')
		.parse(['cli-test.js', '-t', 'hello', 'world', 'here', 'are', 'many']);

	var actual = ['hello', 'world', 'here', 'are', 'many'];
	for (var i = 0; i < actual.length; i++) {
		test.equal(cli.params.test1[i], actual[i]);
	}

	cli.option('other', 'Just a test parameter', '-o', '--other', 'string')
		.parse(['cli-test.js', '-t', 'hello', 'world', '-o', 'something']);
	var actual = ['hello', 'world'];
	for (var i = 0; i < actual.length; i++) {
		test.equal(cli.params.test1[i], actual[i]);
	}
	test.equal(cli.params.other, 'something');

	test.done();
}

exports.testOptionNumValuesStarOtherOptions = function (test) {
	var cli = new Cli();
	cli
		.option('otherOpt', 'Here is another option', '-a', '', 'string')
		.option('test1', 'Just a test parameter', '-t', '--test1', 'string', '*')
		.parse(['cli-test.js', '-t', 'hello', 'world', 'here', 'are', 'many', '-a', 'derp']);

	var actual = ['hello', 'world', 'here', 'are', 'many'];
	for (var i = 0; i < actual.length; i++) {
		test.equal(cli.params.test1[i], actual[i]);
	}

	cli.option('other', 'Just a test parameter', '-o', '--other', 'string')
		.parse(['cli-test.js', '-t', 'hello', 'world', '-o', 'something']);
	var actual = ['hello', 'world'];
	for (var i = 0; i < actual.length; i++) {
		test.equal(cli.params.test1[i], actual[i]);
	}
	test.equal(cli.params.other, 'something');

	test.done();
}

exports.testOptionNumValuesStarNoValue = function (test) {
	var cli = new Cli();
	cli
		.option('test1', 'Just a test parameter', '-t', '--test1', 'string', '*')
		.parse(['cli-test.js', '-t']);

	test.equal(cli.params.test1, null);
	test.done();
}

exports.testOptionNumValuesPlus = function (test) {
	var cli = new Cli();
	cli
		.option('test1', 'Just a test parameter', '-t', '--test1', 'string', '+')
		.parse(['cli-test.js', '-t', 'hello', 'world', 'here', 'are', 'many']);

	var actual = ['hello', 'world', 'here', 'are', 'many'];
	for (var i = 0; i < actual.length; i++) {
		test.equal(cli.params.test1[i], actual[i]);
	}
	test.done();
}

exports.testOptionNumValuesPlusNoValue = function (test) {
	var cli = new Cli();
	cli
		.option('test1', 'Just a test parameter', '-t', '--test1', 'string', '+');

	test.throws(function () {
		cli.parse(['cli-test.js', '-t']);
	});
	test.done();
}