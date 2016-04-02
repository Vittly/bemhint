var bemWalk = require('bem-walk'),
    _ = require('lodash'),
    q = require('q');

/**
 * @param {String[]} levels
 * @returns {Promise<Object[]>}
 */
exports.walk = function(levels) {
    var walker = bemWalk(levels, {
        defaults: {
            scheme: 'nestedWithNonEntities'
        }
    }),
        defer = q.defer(),
        techs = [];

    walker.on('data', function(data) {
        techs.push(_.omit({
            entity: data.entity,
            level: data.level,
            name: data.tech,
            path: data.path
        }, _.isEmpty));
    });

    walker.on('error', function(err) {
        defer.reject(err);
    });

    walker.on('end', function() {
        defer.resolve(techs);
    });

    return defer.promise;
};
