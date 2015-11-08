var assert = require('assert'),
	Cli = require('./../lib/Cli'),
	CliError = require('./../lib/error/abstract-error');

describe("Options", function () {

	describe("Basic", function () {
		it("Should parse single basic", function () {
			var cli = new Cli();
			cli
				.option({
					name: 'test1',
					description: 'Just a test parameter',
					shortFlag: '-t',
					longFlag: '--test1',
					type: 'string'
				})
				.parse(['node', 'cli-test.js', '-t', 'value1']);
			assert.equal(cli.params.test1, 'value1');
		});

		it("Should validate number type", function () {
			var cli = new Cli();
			cli
				.option({
					name: 'test1',
					description: 'Just a test parameter',
					shortFlag: '-t',
					longFlag: '--test1',
					type: 'number'
				})
				.parse(['node', 'cli-test.js', '-t', '123.5']);
			assert.equal(cli.params.test1, 123.5);
		});

		it("Should allow missing options", function () {
			var cli = new Cli();
			cli
				.option({
					name: 'test1',
					description: 'Just a test parameter',
					shortFlag: '-t',
					longFlag: '--test1',
					type: 'string'
				})
				.parse(['node', 'cli-test.js']);
			assert.strictEqual(cli.params.test1, undefined);
		});

		it("Should be fine with not required", function () {
			var cli = new Cli();
			cli
				.option({
					name: 'test1',
					description: 'Just a test parameter',
					shortFlag: '-t',
					longFlag: '--test1',
					type: 'number',
					required: false
				})
				.option({
					name: 'test2',
					description: 'Just a test parameter',
					shortFlag: '-u',
					longFlag: '--test2',
					type: 'number'
				})
				.parse(['node', 'cli-test.js', '--test2', 'value2']);
			assert.equal(cli.params.test2, 'value2');
		});
	});

	describe("Multiple", function () {
		it("Should parse multiple short flag", function () {
			var cli = setupMultiple();

			cli.parse(['node', 'cli-test.js', '-t', 'value1', '-u', 'hello']);
			assert.equal(cli.params.test1, 'value1');
			assert.equal(cli.params.test2, 'hello');
		});

		it("Should parse multiple long flag", function () {
			var cli = setupMultiple();

			cli.parse(['node', 'cli-test.js', '--test1', 'value1', '--test2', 'hello']);
			assert.equal(cli.params.test1, 'value1');
			assert.equal(cli.params.test2, 'hello');
		});

		it("Should parse multiple, out of order", function () {
			var cli = setupMultiple();
			//Out of order
			cli.parse(['node', 'cli-test.js', '-u', 'hello', '--test1', 'value1']);
			assert.equal(cli.params.test1, 'value1');
			assert.equal(cli.params.test2, 'hello');
		});
	});

	describe("Required", function () {

		it("Should fail on option required", function () {
			var cli = new Cli({helpOnNoArgs: false});
			cli
				.option({
					name: 'test1',
					description: 'Just a test parameter',
					shortFlag: '-t',
					longFlag: '--test1',
					type: 'string',
					length: 1
				})
				.parse(['node', 'cli-test.js', '-t', 'value1']);
			assert.equal(cli.params.test1, 'value1');

			assert.throws(function () {
				cli.parse(['node', 'cli-test.js']);
			}, CliError);
		});

		it("Should handle multiple required", function () {
			var cli = new Cli();
			cli
				.option({
					name: 'test1',
					description: 'Just a test parameter',
					shortFlag: '-t',
					longFlag: '--test1',
					type: 'string',
					length: 1
				})
				.option({
					name: 'test2',
					description: 'Just a test parameter',
					shortFlag: '-u',
					longFlag: '--test2',
					type: 'string',
					length: 1
				})
				.parse(['node', 'cli-test.js', '-t', 'value1', '-u', 'hello']);
			assert.equal(cli.params.test1, 'value1');
			assert.equal(cli.params.test2, 'hello');

			assert.throws(function () {
				cli.parse(['node', 'cli-test.js', '--test1', 'value1', 'hello']);
			});
		});

	});
	describe("Length", function () {

		it("Should parse with fixed length", function () {
			var cli = new Cli();
			cli
				.option({
					name: 'test1',
					description: 'Just a test parameter',
					shortFlag: '-t',
					longFlag: '--test1',
					type: 'string',
					length: 3
				})
				.parse(['node', 'cli-test.js', '-t', 'value1', 'value2', 'value3']);

			var actual = ['value1', 'value2', 'value3'];
			for (var i = 0; i < actual.length; i++) {
				assert.equal(cli.params.test1[i], actual[i]);
			}
		});

		it("Should fail on too few", function () {
			var cli = new Cli();
			cli
				.option({
					name: 'test1',
					description: 'Just a test parameter',
					shortFlag: '-t',
					longFlag: '--test1',
					type: 'string',
					length: 3
				});

			assert.throws(function () {
				cli.parse(['node', 'cli-test.js', '-t', 'hello']);
			});

			assert.throws(function () {
				cli.parse(['node', 'cli-test.js', '-t', 'hello', 'world']);
			});
		});

		it("Should fail on too many", function () {
			var cli = new Cli();
			cli
				.option({
					name: 'test1',
					description: 'Just a test parameter',
					shortFlag: '-t',
					longFlag: '--test1',
					type: 'string',
					length: 3
				});

			assert.throws(function () {
				cli.parse(['node', 'cli-test.js', '-t', 'hello', 'world', 'too', 'many']);
			});
		});

		it("Should parse star, any length", function () {
			var cli = new Cli(),
				i,
				actual;

			cli
				.option({
					name: 'test1',
					description: 'Just a test parameter',
					shortFlag: '-t',
					longFlag: '--test1',
					type: 'string',
					length: '*'
				})
				.parse(['node', 'cli-test.js', '-t', 'hello', 'world', 'here', 'are', 'many']);

			actual = ['hello', 'world', 'here', 'are', 'many'];
			for (i = 0; i < actual.length; i++) {
				assert.equal(cli.params.test1[i], actual[i]);
			}

			cli
				.option({
					name: 'other',
					description: 'Just a test another parameter',
					shortFlag: '-o',
					longFlag: '--other',
					type: 'string'
				})
				.parse(['node', 'cli-test.js', '-t', 'hello', 'world', '-o', 'something']);
			actual = ['hello', 'world'];
			for (i = 0; i < actual.length; i++) {
				assert.equal(cli.params.test1[i], actual[i]);
			}
			assert.equal(cli.params.other, 'something');
		});

		it("Should parse star, any length, with other options", function () {
			var cli = new Cli(),
				i,
				actual;

			cli
				.option({
					name: 'otherOpt',
					description: 'Here is another option',
					shortFlag: '-a',
					type: 'string',
					required: false
				})
				.option({
					name: 'test1',
					description: 'Just a test parameter',
					shortFlag: '-t',
					longFlag: '--test1',
					type: 'string',
					length: '*'
				})
				.parse(['node', 'cli-test.js', '-t', 'hello', 'world', 'here', 'are', 'many', '-a', 'derp']);

			actual = ['hello', 'world', 'here', 'are', 'many'];
			for (i = 0; i < actual.length; i++) {
				assert.equal(cli.params.test1[i], actual[i]);
			}

			cli
				.option({
					name: 'other',
					description: 'Just a test parameter',
					shortFlag: '-o',
					longFlag: '--other',
					type: 'string'
				})
				.parse(['node', 'cli-test.js', '-t', 'hello', 'world', '-o', 'something']);
			actual = ['hello', 'world'];
			for (i = 0; i < actual.length; i++) {
				assert.equal(cli.params.test1[i], actual[i]);
			}
			assert.equal(cli.params.other, 'something');
		});

		it("Should parse star without any values", function () {
			var cli = new Cli();
			cli
				.option({
					name: 'test1',
					description: 'Just a test parameter',
					shortFlag: '-t',
					longFlag: '--test1',
					type: 'string',
					length: '*'
				})
				.parse(['node', 'cli-test.js', '-t']);

			assert.equal(cli.params.test1, null);
		});

		it("Should parse +, at least one", function () {
			var cli = new Cli();
			cli
				.option({
					name: 'test1',
					description: 'Just a test parameter',
					shortFlag: '-t',
					longFlag: '--test1',
					type: 'string',
					length: '+'
				})
				.parse(['node', 'cli-test.js', '-t', 'hello', 'world', 'here', 'are', 'many']);

			var actual = ['hello', 'world', 'here', 'are', 'many'];
			for (var i = 0; i < actual.length; i++) {
				assert.equal(cli.params.test1[i], actual[i]);
			}
		});

		it("Should parse + without any values", function () {
			var cli = new Cli();
			cli
				.option({
					name: 'test1',
					description: 'Just a test parameter',
					shortFlag: '-t',
					longFlag: '--test1',
					type: 'string',
					length: '+'
				});

			assert.throws(function () {
				cli.parse(['node', 'cli-test.js', '-t']);
			});
		});
	});
});

function setupMultiple() {
	var cli = new Cli();
	cli
		.option({
			name: 'test1',
			description: 'Just a test parameter',
			shortFlag: '-t',
			longFlag: '--test1',
			type: 'number'
		})
		.option({
			name: 'test2',
			description: 'Just a test parameter',
			shortFlag: '-u',
			longFlag: '--test2',
			type: 'number'
		});
	return cli;
}