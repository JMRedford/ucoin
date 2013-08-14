var should   = require('should');
var assert   = require('assert');
var mongoose = require('mongoose');
var sha1     = require('sha1');
var server   = require('../app/lib/server');


server.database.init();
var Amendment = mongoose.model('Amendment');

var amTest;

describe('Amendment', function(){

  describe('1 of beta_brousouf currency', function(){

    // Loads amTest with its data
    before(function(done) {
      amTest = new Amendment();
      amTest.loadFromFile(__dirname + "/data/amendments/BB-AM1-OK", done);
    });

    it('should be version 1', function(){
      assert.equal(amTest.version, 1);
    });

    it('should have beta_brousouf currency name', function(){
      assert.equal(amTest.currency, 'beta_brousouf');
    });

    it('should be number 1', function(){
      assert.equal(amTest.number, 1);
    });

    it('should have no Universal Dividend', function(){
      should.not.exist(amTest.dividend);
    });

    it('should have no Minimal Coin Power', function(){
      should.not.exist(amTest.coinMinPower);
    });

    it('should have 376C5A6126A4688B18D95043261B2D59867D4047 previous hash', function(){
      assert.equal(amTest.previousHash, '376C5A6126A4688B18D95043261B2D59867D4047');
    });

    it('should have 0 new members', function(){
      var newMembers = amTest.getNewMembers();
      assert.equal(newMembers.length, 0);
      assert.equal(amTest.membersCount, 3);
    });

    it('should have members status root BF5E8C1A8FD9AE05520A4D886846903546207470', function(){
      assert.equal(amTest.membersStatusRoot, 'BF5E8C1A8FD9AE05520A4D886846903546207470');
    });

    it('should have F5ACFD67FC908D28C0CFDAD886249AC260515C90 voters hash', function(){
      assert.equal('F5ACFD67FC908D28C0CFDAD886249AC260515C90', amTest.votersRoot);
    });

    it('should have the following 3 new voters', function(){
      var newVoters = amTest.getNewVoters();
      assert.equal(newVoters.length, 3);
      assert.equal(amTest.votersCount, 3);
      assert.equal(newVoters[0], "2E69197FAB029D8669EF85E82457A1587CA0ED9C");
      assert.equal(newVoters[1], "33BBFC0C67078D72AF128B5BA296CC530126F372");
      assert.equal(newVoters[2], "C73882B64B7E72237A2F460CE9CAB76D19A8651E");
    });

    it('should have voters signatures root DD9485E79D8AF76E5DAA1D689BC96B65792AFE39', function(){
      assert.equal(amTest.votersSigRoot, 'DD9485E79D8AF76E5DAA1D689BC96B65792AFE39');
    });

    it('its computed hash should be 5756AC297C0A536D1AB5BD6DBC1F2ADB5A88769E', function(){
      assert.equal(amTest.hash, '5756AC297C0A536D1AB5BD6DBC1F2ADB5A88769E');
    });

    it('its manual hash should be 5756AC297C0A536D1AB5BD6DBC1F2ADB5A88769E', function(){
      assert.equal(sha1(amTest.getRaw()).toUpperCase(), '5756AC297C0A536D1AB5BD6DBC1F2ADB5A88769E');
    });
  });
});