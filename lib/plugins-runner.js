var inherit = require('inherit'),
    _ = require('lodash'),
    Entity = require('./entity'),
    NonEntity = require('./non-entity');

/**
 * @class
 * @name PluginsRunner
 */
var PluginsRunner = module.exports = inherit({
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
     * @typedef {Tech[]} Techs
     */

    /**
     * @constructor
     * @param {Techs[]} entities
     * @param {Object[]} nonEntities
     */
    __constructor: function(entities, nonEntities) {
        entities = entities || [];

        this._entities = PluginsRunner.initEntities(entities);
        this._nonEntities = PluginsRunner.initNonEntities(nonEntities);
    },

    /**
     * @param {Plugin} plugin
     * @public
     */
    runPlugin: function(plugin) {
        return plugin.run(this._entities, this._nonEntities);
    },

    /**
     * @typedef {Object} Error
     * @property {String} path
     * @property {String} msg
     * @property {Object|String} [value]
     */

    /**
     * @returns {Error[]}
     * @public
     */
    getErrors: function() {
        return _(this._entities)
            .concat(this._nonEntities)
            .map(function(item) {
                return item.getErrors();
            })
            .flatten()
            .value();
    }
}, {
    /**
     * @param {Techs[]} entities
     * @returns {Entity[]}
     * @static
     */
    initEntities: function(entities) {
        return _.map(entities, function(entity) {
            return new Entity(_.find(entity, function(item) {
                return !item.name;
            }), _.filter(entity, 'name'));
        });
    },

    /**
     * @param {Object[]} nonEntities
     * @returns {NonEntity[]}
     */
    initNonEntities: function(nonEntities) {
        return _.map(nonEntities, function(nonEntity) {
            return new NonEntity(nonEntity);
        });
    }
});
