var inherit = require('inherit'),
    _ = require('lodash');

/**
 *
 */
module.exports = inherit({
    /**
     *
     */
    __constructor: function(file) {
        this._path = file.path;
        this._content = file.content;

        this._errors = [];
    },

    /**
     *
     */
    getPath: function() {
        return this._path;
    },

    /**
     *
     */
    getContent: function() {
        this._content;
    },

    /**
     *
     */
    addError: function(error) {
        if(!error.msg) {
            throw new Error('The error msg should be specified!');
        }

        this._errors.push(error);
    },

    /**
     *
     */
    getErrors: function() {
        return _.map(this._errors, function(error) {
            return {
                msg: error.msg,
                path: this._path,
                value: error.value
            };
        }, this);
    }
});
