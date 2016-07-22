/**
 * Receipt.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
  	id: {
      type: 'string'
    },
    QrCode: {
      type: 'string'
    },
    token: {
      type: 'string'
    },
    origin_shop: {
      type: 'string'
    },
    target_shop: {
      type: 'string'
    },
    activated: {
      type: 'boolean'
    },
    redeemed: {
      type: 'boolean'
    }
  }
};

