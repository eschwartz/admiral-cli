#!/usr/bin/node
var Option = require('./option'),
	Flag = require('./flag'),
	Command = require('./command'),
	CommandGroup = require('./command-group'),
	debug = require('debug')('cli'),

	ConfigError = require('./error/config'),
	InvalidInputError = require('./error/invalid-input');

function Cli(appDescription) {

	this.scriptName = null;

	this.params = {};
	this.options = [];
	this.flags = [];
	this.commandGroups = [];
}

/**
 * Add Command Group
 *
 * Create a command group and add it to the config.
 * @param {String} name
 * @param {String} [description]
 * @param {Command[]|[]} commands
 * @param {Function} [callback]
 * @param {Boolean} [required]
 * @returns {Cli}
 */
Cli.prototype.commandGroup = function (name, description, commands, callback, required) {
	this.commandGroups.push(new CommandGroup(name, description, commands, callback, required));
	return this;
}

Cli.prototype.option = function (name, description, short, long, type, required) {
	this.options.push(new Option(name, description, short, long, type, required));
	return this;
}

Cli.prototype.flag = function (name, description, short, long) {
	this.flags.push(new Flag(name, description, short, long));
	return this;
}

/**
 * Parse
 *
 * Take the arguments (or array passed) and parse it into the params object.
 * @param {String[]} args
 * @returns {Object}
 * @throws ConfigError
 * @throws InvalidInputError
 */
Cli.prototype.parse = function (args) {
	if (args == undefined) {
		args = process.argv;
	}

	//Parse Script Name
	this.scriptName = args.shift();

	this.params = {};

	//Parse Option
	Cli._merge(this.params, this.parseOption(args, this.options));

	//Parse flags
	var flagParams = this.parseFlags(args, this.flags);
	Cli._merge(this.params, flagParams);

	//Parse Commands
	Cli._merge(this.params, this.parseCommands(args, this.commandGroups));

	this.checkForExtras(args);
	
	return this.params;
}

/**
 * Parse Option
 *
 * Parses Options from args, matches Options to args.
 *
 * *NOTE* Modifies args param, removes parsed options.
 * @param {String[]} args
 * @param {Option[]} options
 * @return {Object}
 * @
 */
Cli.prototype.parseOption = function (args, options) {
	var params = {};
	options.forEach(function (option) {
		debug('Testing option: ' + option.short, args);
		var optionIndex = args.indexOf(option.short);
		var optionLongIndex = args.indexOf(option.long);
		if (optionIndex !== -1 || optionLongIndex !== -1) {
			var index = (optionIndex !== -1) ? optionIndex : optionLongIndex;
			params[option.name] = args[index + 1];
			args.splice(index, 2);
		}
		else if (option.required) {
			debug("Option " + option.short + "/" + option.long + " not found");
			throw new InvalidInputError(option.short + "/" + option.long + " is required, and wasn't found");
		}
	}.bind(this));
	debug('Args after option: ' + JSON.stringify(args));
	return params;
}

Cli.prototype.parseFlags = function (args, flags) {
	var params = {};
	for (var i = 0; i < args.length; i++) {
		var arg = args[i];
		if (arg.match(/^\-\-/)) {
			//Long version flags --
			debug("Flag(s) (Long version) found: " + arg);
			var flag = this._findFlag(arg, flags);
			if (flag) {
				params[flag.name] = true;
				args.splice(i, 1);
				i--;
			}
			else {
				throw new ConfigError("Flag '" + arg + "' is unknown");
			}
		}
		else if (arg[0] == "-") {
			//Short version flags -
			debug("Flag(s) found: " + arg);
			arg = arg.substr(1);
			for (var j = 0; j < arg.length; j++) {
				var flag = this._findFlag('-' + arg[j], flags);
				if (flag) {
					params[flag.name] = true;
				}
				else {
					throw new InvalidInputError("Flag '" + arg + "' is unknown");
				}
			}
			args.splice(i, 1);
			i--;
		}

	}
	//Set all other registered flags to false
	flags.forEach(function (flag) {
		if (!params.hasOwnProperty(flag.name)) {
			params[flag.name] = false;
		}
	}.bind(this));
	return params;
}

/**
 * Parse Commands
 *
 * Loop through remaining args, one by one, check each command group
 * @param args
 * @param commandGroups
 */
Cli.prototype.parseCommands = function (args, commandGroups) {
	var params = {};

	for (var i = 0; i < commandGroups.length; i++) {
		debug('Checking on command group: ' + commandGroups[i].name);
		var commandGroup = commandGroups[i],
			found = false,
			command;

		commandGroup.commands.forEach(function (command) {
			if (args[0] == command.name) {
				debug("Command found: " + commandGroup.name + " = " + args[0]);
				params[commandGroup.name] = command.name;
				if (command.callback instanceof Function) {
					command.callback.call(this, this, command);
				}
				if (commandGroup.callback instanceof Function) {
					commandGroup.callback.call(this, this, command);
				}
				found = true;
				args.shift();
				return false;
			}
		}.bind(this));

		if (!found && commandGroup.required) {
			debug('Not found!!');
			throw new InvalidInputError("Command Group " + commandGroup.name + " is required and cannot be omitted");
		}
	}
	return params;
}

Cli.prototype.checkForExtras = function (args) {
	if (args.length) {
		throw new InvalidInputError("Invalid extra params supplied: " + args.join(', '));
	}
}

Cli.prototype.getHelpText = function () {

}

Cli.prototype._findFlag = function (key, flags) {
	debug('_findFlag: ' + key);
	for (var i = 0; i < flags.length; i++) {
		var flag = flags[i];
		if (flag.short == key || flag.long == key) {
			debug('Flag found!', flag);
			return flag;
		}
	}
	debug('returning null');
	return null;
}

/**
 * Merge
 *
 * Just a simple little object merge.
 *
 * @param objectA
 * @param objectB
 * @returns {{}}
 * @private
 */
Cli._merge = function (objectA, objectB) {
	debug('Merging: ', objectA, objectB);
	for (var attrName in objectB) {
		objectA[attrName] = objectB[attrName];
	}
	debug("Merged: ", objectA);
	return objectA;
}

module.exports = Cli;