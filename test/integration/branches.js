"use strict";

var Q         = require('q');
var _         = require('underscore');
var should    = require('should');
var ucoin     = require('./../../index');
var bma       = require('./../../app/lib/streams/bma');
var user      = require('./tools/user');
var constants = require('../../app/lib/constants');
var rp        = require('request-promise');
var httpTest  = require('./tools/http');
var commit    = require('./tools/commit');
var sync      = require('./tools/sync');

var expectJSON     = httpTest.expectJSON;
var expectAnswer   = httpTest.expectAnswer;
var expectHttpCode = httpTest.expectHttpCode;

require('log4js').configure({
  "appenders": [
  ]
});

var MEMORY_MODE = true;
var commonConf = {
  ipv4: '127.0.0.1',
  currency: 'bb',
  httpLogs: true,
  branchesWindowSize: 3,
  parcatipate: false, // TODO: to remove when startGeneration will be an explicit call
  sigQty: 1
};

var s1 = ucoin({
  memory: MEMORY_MODE,
  name: 'bb1'
}, _.extend({
  port: '7778',
  pair: {
    pub: 'HgTTJLAQ5sqfknMq7yLPZbehtuLSsKj9CxWN7k8QvYJd',
    sec: '51w4fEShBk1jCMauWu4mLpmDVfHksKmWcygpxriqCEZizbtERA6de4STKRkQBpxmMUwsKXRjSzuQ8ECwmqN1u2DP'
  }
}, commonConf));

var s2 = ucoin({
  memory: MEMORY_MODE,
  name: 'bb2'
}, _.extend({
  port: '7779',
  pair: {
    pub: 'DKpQPUL4ckzXYdnDRvCRKAm1gNvSdmAXnTrJZ7LvM5Qo',
    sec: '64EYRvdPpTfLGGmaX5nijLXRqWXaVz8r1Z1GtaahXwVSJGQRn7tqkxLb288zwSYzELMEG5ZhXSBYSxsTsz1m9y8F'
  }
}, commonConf));

var s3 = ucoin({
  memory: MEMORY_MODE,
  name: 'bb3'
}, _.extend({
  port: '7780',
  pair: {
    pub: 'DNann1Lh55eZMEDXeYt59bzHbA3NJR46DeQYCS2qQdLV',
    sec: '468Q1XtTq7h84NorZdWBZFJrGkB18CbmbHr9tkp9snt5GiERP7ySs3wM8myLccbAAGejgMRC9rqnXuW3iAfZACm7'
  }
}, commonConf));

var cat = user('cat', { pub: 'HgTTJLAQ5sqfknMq7yLPZbehtuLSsKj9CxWN7k8QvYJd', sec: '51w4fEShBk1jCMauWu4mLpmDVfHksKmWcygpxriqCEZizbtERA6de4STKRkQBpxmMUwsKXRjSzuQ8ECwmqN1u2DP'}, { server: s1 });
var toc = user('toc', { pub: 'DKpQPUL4ckzXYdnDRvCRKAm1gNvSdmAXnTrJZ7LvM5Qo', sec: '64EYRvdPpTfLGGmaX5nijLXRqWXaVz8r1Z1GtaahXwVSJGQRn7tqkxLb288zwSYzELMEG5ZhXSBYSxsTsz1m9y8F'}, { server: s1 });
var tic = user('tic', { pub: 'DNann1Lh55eZMEDXeYt59bzHbA3NJR46DeQYCS2qQdLV', sec: '468Q1XtTq7h84NorZdWBZFJrGkB18CbmbHr9tkp9snt5GiERP7ySs3wM8myLccbAAGejgMRC9rqnXuW3iAfZACm7'}, { server: s1 });

var now = Math.round(new Date().getTime()/1000);

describe("Branches", function() {

  before(function() {

    var commitS1 = commit(s1);
    var commitS2 = commit(s2);
    var commitS3 = commit(s3);

    return Q.all([
      s1.initWithServices().then(bma),
      s2.initWithServices().then(bma),
      s3.initWithServices().then(bma)
    ])

      .then(function(){
        // Server 1
        return Q()
          .then(function() {
            return cat.selfCertPromise(now);
          })
          .then(function() {
            return toc.selfCertPromise(now);
          })
          .then(function() {
            return tic.selfCertPromise(now);
          })
          .then(_.partial(toc.certPromise, cat))
          .then(_.partial(cat.certPromise, toc))
          .then(_.partial(cat.certPromise, tic))
          .then(cat.joinPromise)
          .then(toc.joinPromise)
          .then(tic.joinPromise)
          .then(commitS1)
          .then(commitS1)
          .then(commitS1)
          .then(commitS1)
          .then(commitS1);
      })

      .then(function(){
        // Server 2
        return Q()
          .then(function(){
            return sync(0, 2, s1, s2);
          })
          .then(commitS2)
          .then(commitS2);
      })

      .then(function(){
        // Server 3
        return Q()
          .then(function(){
            return sync(0, 3, s1, s3);
          })
          .then(commitS3);
      })

      .then(function(){
        // Forking S1 from S2
        return Q()
          .then(function(){
            return sync(3, 3, s2, s1);
          });
      })

      .then(function(){
        // Forking S1 from S3
        return Q()
          .then(function(){
            return sync(4, 4, s3, s1);
          });
      })

      .then(function(){
        // Confirmed of S2 from S3
        return Q()
          .then(function(){
            return sync(1, 1, s3, s2)
              .then(function(){
                throw 'Should have thrown an error since it is not forkable';
              })
              .fail(function(err){
                err.should.equal('Block not found');
              });
          });
      })

      .then(function(){
        // Forking S2 from S3
        return Q()
          .then(function(){
            return sync(3, 4, s3, s2);
          });
      })
      ;
  });

  describe("Server 1 /blockchain", function() {

    it('should have a 3 blocks fork window size', function() {
      return expectAnswer(rp('http://127.0.0.1:7778/node/summary', { json: true }), function(res) {
        res.should.have.property('ucoin').property('software').equal('ucoind');
        res.should.have.property('ucoin').property('version').equal('0.11.12');
        res.should.have.property('ucoin').property('forkWindowSize').equal(3);
      });
    });

    it('should have an open websocket on /websocket/block', function() {
      var socket = require('socket.io-client')('http://127.0.0.1:7778/websocket/block');
      return Q.Promise(function(resolve, reject){
        socket.on('block', function(data){
          should.exist(data);
          resolve(data);
        });
        socket.on('error', reject);
      });
    });

    it('/block/0 should exist', function() {
      return expectJSON(rp('http://127.0.0.1:7778/blockchain/block/0', { json: true }), {
        number: 0
      });
    });

    it('/block/1 should exist', function() {
      return expectJSON(rp('http://127.0.0.1:7778/blockchain/block/1', { json: true }), {
        number: 1
      });
    });

    it('/block/88 should not exist', function() {
      return expectHttpCode(404, rp('http://127.0.0.1:7778/blockchain/block/88'));
    });

    it('/current should exist', function() {
      return expectJSON(rp('http://127.0.0.1:7778/blockchain/current', { json: true }), {
        number: 4
      });
    });

    it('should have 3 branch', function() {
      return expectAnswer(rp('http://127.0.0.1:7778/blockchain/branches', { json: true }), function(res) {
        res.should.have.property('blocks').length(3);
      });
    });
  });

  describe("Server 2 /blockchain", function() {

    it('/block/0 should exist', function() {
      return expectJSON(rp('http://127.0.0.1:7779/blockchain/block/0', { json: true }), {
        number: 0
      });
    });

    it('/block/1 should exist', function() {
      return expectJSON(rp('http://127.0.0.1:7779/blockchain/block/1', { json: true }), {
        number: 1
      });
    });

    it('/block/88 should not exist', function() {
      return expectHttpCode(404, rp('http://127.0.0.1:7779/blockchain/block/88'));
    });

    it('/current should exist', function() {
      return expectJSON(rp('http://127.0.0.1:7779/blockchain/current', { json: true }), {
        number: 4
      });
    });

    it('should have 2 branch', function() {
      return expectAnswer(rp('http://127.0.0.1:7779/blockchain/branches', { json: true }), function(res) {
        res.should.have.property('blocks').length(2);
      });
    });
  });

  describe("Server 3 /blockchain", function() {

    it('/block/0 should exist', function() {
      return expectJSON(rp('http://127.0.0.1:7780/blockchain/block/0', { json: true }), {
        number: 0
      });
    });

    it('/block/1 should exist', function() {
      return expectJSON(rp('http://127.0.0.1:7780/blockchain/block/1', { json: true }), {
        number: 1
      });
    });

    it('/block/88 should not exist', function() {
      return expectHttpCode(404, rp('http://127.0.0.1:7780/blockchain/block/88'));
    });

    it('/current should exist', function() {
      return expectJSON(rp('http://127.0.0.1:7780/blockchain/current', { json: true }), {
        number: 4
      });
    });

    it('should have 1 branch', function() {
      return expectAnswer(rp('http://127.0.0.1:7780/blockchain/branches', { json: true }), function(res) {
        res.should.have.property('blocks').length(1);
      });
    });
  });
});
