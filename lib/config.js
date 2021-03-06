var fs = require('fs'),
    PATH = require('path'),
    inherit = require('inherit'),
    _ = require('lodash'),
    q = require('q'),
    qfs = require('q-io/fs'),
    resolve = require('resolve'),
    defaults = require('./defaults'),
    Plugin = require('./plugin'),
    utils = require('./utils');

/**
 * @class
 * @name Config
 */
module.exports = inherit({
    /**
     * @constructor
     * @param {String[]} targets
     * @param {Object} opts
     * @param {String} opts.basedir
     * @param {String[]} opts.reporters
     * @param {String[]} opts.levels
     * @param {String[]} opts.excludePaths,
     * @param {Object} opts.plugins
     */
    __constructor: function(targets, opts) {
        opts = defaults(opts);

        this._basedir = PATH.resolve(opts.basedir);

        this._targets = this._formatTargets(targets);
        this._levels = opts.levels;

        this._excludePaths = this._formatExcludedPaths(opts.excludePaths);

        this._plugins = opts.plugins;

        this.reporters = opts.reporters;
    },

    /**
     * @param {String[]} targets
     * @returns {String[]}
     * @private
     *
     * @example
     * /some.blocks/some-block/some-block.ext –> /some.block/some-block/some-block.*
     * /some.blocks/some-block/__some-elem –> /some.blocks/some-block/__some-elem/**
     */
    _formatTargets: function(targets) {
        targets = targets || [];

        return _(targets)
            .map(formatTarget_)
            .uniq()
            .value();

        ///
        function formatTarget_(target) {
            return fs.statSync(target).isFile() ? utils.replaceTech(target, '*') : PATH.join(target, '**');
        }
    },

    /**
     * @param {String[]} excludePaths
     * @returns {String[]}
     * @private
     */
    _formatExcludedPaths: function(excludePaths) {
        return _.map(excludePaths, this._resolvePath, this);
    },

    /**
     * @returns {Promise<String[]>}
     * @public
     */
    getLevels: function() {
        return _(this._targets)
            .map(getLevelsFromTarget_.bind(this))
            .thru(q.all).value()
            .then(_.flatten)
            .then(_.compact)
            .then(_.uniq);

        ///
        function getLevelsFromTarget_(target) {
            var lastLevelInTarget = this._getLastLevelInTarget(target);

            if(!utils.hasGlobstarEnding(target)) {
                return [lastLevelInTarget];
            }

            return this._getLevelsInTargetTree(target)
                .then(Array.prototype.concat.bind([lastLevelInTarget]));
        }
    },

    /**
     * @param {String} target
     * @returns {String|undefined}
     * @private
     *
     * @example
     * /some.blocks/block –> /some.blocks
     * /some.blocks/block/block.examples/blocks/example –> /some.blocks/block/block.examples/blocks
     */
    _getLastLevelInTarget: function(target) {
        var splitted = target.split(PATH.sep),
            lastLevelIndex = _.findLastIndex(splitted, this._isLevel.bind(this));

        if(lastLevelIndex === -1) {
            return;
        }

        var lastLevel = _.take(splitted, ++lastLevelIndex).join(PATH.sep);
        return !this.isExcludedPath(lastLevel) && lastLevel;
    },

    /**
     * @param {String} target
     * @returns {Promise<String[]>}
     * @private
     */
    _getLevelsInTargetTree: function(target) {
        return qfs.listTree(PATH.dirname(target), function(path, stat) {
            if(this.isExcludedPath(path)) {
                return null;
            }

            return stat.isDirectory() && this._isLevel(path);
        }.bind(this));
    },

    /**
     * @param {String} path
     * @returns {Boolean}
     * @private
     */
    _isLevel: function(path) {
        return utils.someMinimatch(this._levels, PATH.basename(path));
    },

    /**
     * @param {String} path
     * @returns {Boolean}
     * @public
     */
    isTargetPath: function(path) {
        return utils.someMinimatch(this._targets, path);
    },

    /**
     * @param {String} path
     * @returns {Boolean}
     * @public
     */
    isExcludedPath: function(path) {
        return utils.someMinimatch(this._excludePaths, PATH.resolve(path));
    },

    /**
     * @returns {Function[]}
     * @public
     */
    requirePlugins: function() {
        return _(this._plugins)
            .map(function(userConfig, path) {
                path = resolve.sync(path, {basedir: this._basedir});

                return userConfig && new Plugin(path, {
                    userConfig: userConfig,
                    baseConfig: {configDir: this._basedir}
                });
            }, this)
            .compact()
            .value();
    },

    /**
     * @param {String} path
     * @returns {String}
     * @private
     *
     * @example
     * /config/path/.bemhint, /some/path.ext –> /config/path/some/path.ext
     */
    _resolvePath: function(path) {
        return PATH.resolve(this._basedir, path);
    }
});
