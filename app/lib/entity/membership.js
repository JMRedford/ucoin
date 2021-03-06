"use strict";
var _ = require('underscore');
var moment = require('moment');
var rawer = require('../rawer');
var dos2unix = require('../dos2unix');

var Membership = function(json) {

  var that = this;

  _(json).keys().forEach(function(key) {
    that[key] = json[key];
  });

  this.blockNumber = this.number;
  this.blockHash = this.fpr;
  this.version = "1";

  this.keyID = function () {
    return this.issuer && this.issuer.length > 24 ? "0x" + this.issuer.substring(24) : "0x?";
  };

  this.copyValues = function(to) {
    var obj = this;
    ["version", "currency", "issuer", "membership", "amNumber", "hash", "signature", "sigDate"].forEach(function (key) {
      to[key] = obj[key];
    });
  };

  this.inline = function() {
    return [this.issuer, this.signature, this.number, this.fpr, moment(this.certts).unix(), this.userid].join(':');
  };

  this.inlineValue = function() {
    return [this.version, this.issuer, this.membership, this.number, this.fpr, this.userid].join(':');
  };

  this.inlineSignature = function() {
    var splits = dos2unix(this.signature).split('\n');
    var signature = "";
    var keep = false;
    splits.forEach(function(line){
      if (keep && !line.match('-----END PGP') && line != '') signature += line + '\n';
      if (line == "") keep = true;
    });
    return signature;
  };

  this.json = function() {
    var obj = this;
    var json = {};
    ["version", "currency", "issuer", "membership"].forEach(function (key) {
      json[key] = obj[key];
    });
    json.date = this.date && moment(this.date).unix();
    json.sigDate = this.sigDate && moment(this.sigDate).unix();
    json.raw = this.getRaw();
    return { signature: this.signature, membership: json };
  };

  this.getRaw = function() {
    return rawer.getMembershipWithoutSignature(this);
  };

  this.getRawSigned = function() {
    return rawer.getMembership(this);
  };
};

Membership.statics = {};

Membership.statics.fromInline = function (inlineMS, type, currency) {
  var sp = inlineMS.split(':');
  return new Membership({
    version:    1,
    currency:   currency,
    issuer:     sp[0],
    membership: type,
    type:       type,
    number:     parseInt(sp[2]),
    fpr:        sp[3],
    block:      [sp[2], sp[3]].join('-'),
    certts:     new Date(parseInt(sp[4])*1000),
    userid:     sp[5],
    signature:  sp[1]
  });
};

Membership.statics.toInline = function (entity) {
  return [entity.issuer, entity.signature, entity.number, entity.fpr, moment(entity.certts).unix(), entity.userid].join(':');
};

module.exports = Membership;
