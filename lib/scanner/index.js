var _ = require('lodash'),
    q = require('q'),
    qfs = require('q-io/fs'),
    bemWalk = require('./bem-walk');

/**
 * @typedef {Object} Notation
 * @property {String} block
 * @property {String} [elem]
 * @property {String} [modName]
 * @property {String} [modVal]
 */

/**
 * @typedef {Object} Tech
 * @property {Notation} entity
 * @property {String} level
 * @property {String} name
 * @property {String} path
 * @property {String} [content]
 */

/**
 * @typedef {Object} WalkedFile
 * @property {String} path
 * @property {String} level
 * @property {String} [name]
 * @property {Notation} [entity]
 */

/**
 * @typedef {Object} ScannedFile
 * @property {String} path
 * @property {String} level
 * @property {String} [name]
 * @property {Notation} [entity]
 * @property {String} [content]
 */

/**
 * @param {Config} config
 * @returns {ScannedFile[]}
 */
exports.scan = function(config) {
    return config.getLevels()
        .then(bemWalk.walk)
        .then(filterWalkedFiles_)
        .then(loadFilesContent);

    ///
    function filterWalkedFiles_(files) {
        return _.filter(files, function(file) {
            return config.isTargetPath(file.path) && !config.isExcludedPath(file.path);
        });
    }
};

/**
 * @param {WalkedFiles[]} files
 * @returns {ScannedFiles[]}
 */
function loadFilesContent(files) {
    return q.all(files.map(function(file) {
        return qfs.stat(file.path)
            .then(function(stat) {
                if(stat.isDirectory()) {
                    return file;
                }

                return qfs.read(file.path)
                    .then(function(content) {
                        return _.extend(file, {content: content});
                    });
            });
    }));
}
