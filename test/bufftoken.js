const BN = require('bn.js');

const { assert } = require("chai");

const NewBuff = artifacts.require("NewBuff");

contract('NewBuff', (accounts) => {
  let buffTokenInstance;
  before(async () => {
    buffTokenInstance = await NewBuff.deployed();
  });

  it('should be set pause not enable at first', async () => {
    await buffTokenInstance.pausedNotEnable();
    assert.equal(await buffTokenInstance.name(), "$Buff", "token name is $Buff");
    console.log(accounts);
    await buffTokenInstance.setReferralOwner(accounts[1], accounts[2]);
    assert.equal(await buffTokenInstance.checkReferralOwner(accounts[1]), accounts[2], "ERR: not same address");
  });
  it('should be set business wallet address', async () => {
    await buffTokenInstance.setBusinessWallet.call(accounts[3], {from: accounts[0]});
    const balance = web3.utils.toWei('50', 'Mwei');
    console.log(balance);
    console.log(new BN(await buffTokenInstance.balanceOf(accounts[3])));
    assert.equal(await buffTokenInstance.balanceOf(accounts[3]), balance, "ERR: not same balance");
  });

});