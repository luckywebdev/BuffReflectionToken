const IUniswapV2Router02 = require("../build/contracts/IUniswapV2Router02.json");
const Contract = require('web3-eth-contract');

const BN = require('bn.js');

const { assert } = require("chai");

const OfficialBuffDoge = artifacts.require("OfficialBuffDoge");


contract('OfficialBuffDoge', (accounts) => {
  let buffTokenInstance;
  let uniswap;
  before(async () => {
    buffTokenInstance = await OfficialBuffDoge.deployed();
    uniswap = new web3.eth.Contract(
      IUniswapV2Router02.abi,
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    );
  });

  it('should be set pause not enable at first', async () => {
    await buffTokenInstance.pausedNotEnable({ from: accounts[0] });

    assert.equal(await buffTokenInstance.name(), "Official BuffDoge", "token name is Official BuffDoge");

    await buffTokenInstance.setReferralOwner(
      accounts[1],
      accounts[2]
    );
    assert.equal(
      await buffTokenInstance.checkReferralOwner(accounts[1]),
      accounts[2],
      "ERR: not same address"
    );
  });

  it('should be set business and reward wallet address', async () => {
    await buffTokenInstance.setBusinessWallet(
      accounts[3],
      { from: accounts[0] }
    );
    const balance = web3.utils.toWei('50', 'Mwei');
    const realBalance = new BN(await buffTokenInstance.balanceOf(accounts[3]));

    console.log("business wallet balance======>",
      web3.utils.fromWei(realBalance.toString(), 'ether'), balance);

    assert.equal(
      web3.utils.fromWei(realBalance.toString(), 'ether'),
      balance,
      "ERR: not same balance"
    );

    await buffTokenInstance.setRewardAddress(
      accounts[4],
      { from: accounts[0] }
    );
    const balance2 = web3.utils.toWei('350', 'Mwei');
    const rewardBalance = new BN(await buffTokenInstance.balanceOf(accounts[4]));

    console.log(
      "reward wallet balance======>",
      web3.utils.fromWei(rewardBalance.toString(), 'ether'),
      balance2
    );

    assert.equal(
      web3.utils.fromWei(rewardBalance.toString(), 'ether'),
      balance2,
      "ERR: not same balance"
    );
  });

  it('should be set tx fees', async () => {
    const fees = ['3', '0', '3', '7', '7', '7'];
    const setFee = await buffTokenInstance.setStandardFee(
      fees,
      { from: accounts[0] }
    );
    console.log("set fee======>", setFee);
  });

  it('should add liquidity buff', async () => {
    const ownerBalance = new BN(await buffTokenInstance.balanceOf(accounts[0]));

    console.log(
      "owner wallet balance======>",
      web3.utils.fromWei(ownerBalance.toString(), 'ether')
    );

    console.log("uniswap router address======>", uniswap.options.address);

    const weth = await uniswap.methods.WETH().call();

    console.log("uniswap weth address======>", weth);

    const amountTokenDesired = web3.utils.toWei('1048550', 'ether');
    const d = new Date();

    const approveAmount0 = new BN(await buffTokenInstance.allowance(accounts[0], uniswap.options.address));

    console.log(
      "approve amount of uniswap router before======>",
      web3.utils.fromWei(approveAmount0.toString(), 'ether')
    );

    const maxValue = web3.utils.toBN('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

    await buffTokenInstance.approve(uniswap.options.address, maxValue, { from: accounts[0] });

    const approveAmount = new BN(await buffTokenInstance.allowance(accounts[0], uniswap.options.address));

    console.log(
      "approve amount of uniswap router after======>",
      web3.utils.fromWei(approveAmount.toString(), 'ether')
    );

    await uniswap.methods.addLiquidityETH(
      buffTokenInstance.address,
      amountTokenDesired,
      amountTokenDesired,
      web3.utils.toWei('1', 'ether'),
      accounts[0],
      d.getTime()
    )
    .send({ from: accounts[0], value: web3.utils.toWei('1', 'ether'), gasLimit: 9999999 })
    .on('receipt', (receipt) => {
      console.log("add liquidity receipt===========>");
    })
    .on('error', (error, receipt) => {
      console.log("add liquidity receipt error===========>", error);
    });

  });

  it('should swap ETH for buff', async () => {
    const d = new Date();
    const weth = await uniswap.methods.WETH().call();
    const path = [weth, buffTokenInstance.address];

    const getAmount = await uniswap.methods.getAmountsIn(
      web3.utils.toWei('10000', 'ether'),
      path
    ).call();

    console.log(
      "get the first token price===========>",
      web3.utils.fromWei(getAmount[0].toString(), 'ether')
    );

    const ownerBalance1 = new BN(await buffTokenInstance.balanceOf(accounts[5]));

    console.log(
      "owner wallet balance before first swap======>",
      web3.utils.fromWei(ownerBalance1.toString(), 'ether')
    );

    await uniswap.methods.swapETHForExactTokens(
      web3.utils.toWei('10000', 'ether'),
      path,
      accounts[5],
      d.getTime()
    )
    .send(
      { 
        from: accounts[5],
        value: getAmount[0],
        gasLimit: 9999999
      }
    )
    .on('receipt', (receipt) => {
      console.log("swap receipt===========>");
    })
    .on('error', (error, receipt) => {
      console.log("swap receipt error===========>", error);
    });

    const ownerBalance2 = new BN(await buffTokenInstance.balanceOf(accounts[5]));

    console.log(
      "owner wallet balance after first swap======>",
      web3.utils.fromWei(ownerBalance2.toString(), 'ether')
    );

  });

  it('should the second swap ETH for buff', async () => {
    const d = new Date();
    const weth = await uniswap.methods.WETH().call();
    const path = [weth, buffTokenInstance.address];

    const getAmount = await uniswap.methods.getAmountsIn(
      web3.utils.toWei('10000', 'ether'),
      path
    ).call();

    console.log(
      "get second token price===========>",
      web3.utils.fromWei(getAmount[0].toString(), 'ether')
    );

    const ownerBalance1 = new BN(await buffTokenInstance.balanceOf(accounts[6]));

    console.log(
      "owner wallet balance before second swap======>",
      web3.utils.fromWei(ownerBalance1.toString(), 'ether')
    );

    await uniswap.methods.swapETHForExactTokens(
      web3.utils.toWei('10000', 'ether'),
      path,
      accounts[6],
      d.getTime()
    )
    .send(
      { 
        from: accounts[6],
        value: getAmount[0],
        gasLimit: 9999999
      }
    )
    .on('receipt', (receipt) => {
      console.log("swap receipt===========>");
    })
    .on('error', (error, receipt) => {
      console.log("swap receipt error===========>", error);
    });

    const ownerBalance2 = new BN(await buffTokenInstance.balanceOf(accounts[6]));

    console.log(
      "owner wallet balance after second swap======>",
      web3.utils.fromWei(ownerBalance2.toString(), 'ether')
    );

  });

  it('should transfer some buff from contract to account7', async () => {
    const ownerBalance1 = new BN(await buffTokenInstance.balanceOf(accounts[7]));
    console.log(
      "owner wallet balance before transfer======>",
      web3.utils.fromWei(ownerBalance1.toString(), 'ether')
    );

    await buffTokenInstance.transferFrom(
      buffTokenInstance.address,
      accounts[7],
      web3.utils.toWei('20000', 'ether'),
      {from: accounts[0]}
    );

    const ownerBalance2 = new BN(await buffTokenInstance.balanceOf(accounts[7]));
    console.log(
      "owner wallet balance after transfer======>",
      web3.utils.fromWei(ownerBalance2.toString(), 'ether')
    );
  });

  it('should swap buff for ETH', async () => {
    const d = new Date();
    const weth = await uniswap.methods.WETH().call();
    const path = [buffTokenInstance.address, weth];

    await buffTokenInstance.swapTokenForEthEnable(
      { from: accounts[0] }
    );

    const getAmountOut = await uniswap.methods.getAmountsOut(
      web3.utils.toWei('10000', 'ether'),
      path
    ).call();

    console.log(
      "get token price for eth after the third swap===========>",
      web3.utils.fromWei(getAmountOut[1].toString(), 'ether')
    );

    const ownerBalance1 = new BN(await buffTokenInstance.balanceOf(accounts[7]));

    const maxValue = web3.utils.toBN('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

    await buffTokenInstance.approve(
      uniswap.options.address,
      maxValue,
      {from: accounts[7]}
    );

    console.log(
      "owner wallet balance before the third swap======>",
      web3.utils.fromWei(ownerBalance1.toString(), 'ether')
    );

    await uniswap.methods.swapExactTokensForETH(
      web3.utils.toWei('10000', 'ether'),
      0,
      path,
      accounts[7],
      d.getTime()
    )
    .send(
      { 
        from: accounts[7], 
        gasLimit: 9999999 
      }
    )
    .on('receipt', (receipt) => {
      console.log("the third swap receipt===========>");
    })
    .on('error', (error, receipt) => {
      console.log("the third swap receipt error===========>", error);
    });

    const ownerBalance2 = new BN(await buffTokenInstance.balanceOf(accounts[7]));

    console.log(
      "owner wallet balance after the third swap======>",
      web3.utils.fromWei(ownerBalance2.toString(), 'ether')
    );
  });

});