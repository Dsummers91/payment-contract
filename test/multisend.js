const Multisend = artifacts.require("Multisend");
const TestToken = artifacts.require("TestToken");


const DECIMALS = 10^18
const fees = 0.05* DECIMALS;

contract('Multisend', (accounts) => {
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
  let multisend;
  let token1, token2, token3, token4;
  let employer = accounts[0];
  let employee1 = accounts[1];
  let employee2 = accounts[2];
  let employee3 = accounts[3];
  let employee4 = accounts[4];

  beforeEach(async() => {
    multisend = await Multisend.new(web3.utils.toBN(5));
    token1 = await TestToken.new(web3.utils.toBN(1000* DECIMALS))
    token2 = await TestToken.new(web3.utils.toBN(1000* DECIMALS))
    token3 = await TestToken.new(web3.utils.toBN(1000* DECIMALS))
    token4 = await TestToken.new(web3.utils.toBN(1000* DECIMALS))

    await token1.approve(multisend.address, web3.utils.toBN(1000* DECIMALS))
    await token2.approve(multisend.address, web3.utils.toBN(1000* DECIMALS))
    await token3.approve(multisend.address, web3.utils.toBN(1000* DECIMALS))
    await token4.approve(multisend.address, web3.utils.toBN(1000* DECIMALS))
  });

  it("should have an owner", async() => {
    let owner = await multisend.owner();
    assert.equal(owner, employer);
  });

  it("should be able to transfer ownership", async() => {
    let owner = await multisend.owner();
    assert.equal(owner, employer);
    await multisend.transferOwnership(employee1);
    owner = await multisend.owner();
    assert.equal(owner, employee1);
  });

  it("should not allow non-owner to transfer ownership", async() => {
    let owner = await multisend.owner();
    assert.equal(owner, employer);
    try {
      await multisend.transferOwnership(employee1, {from: employee1});
    } catch(e) {
      //noop
    }
    owner = await multisend.owner();
    assert.equal(owner, employer);
  });

  it("should transfer one token to one person", async() =>  {
    let beginning_balance = await token1.balanceOf(employer);
    let allowance = await token1.allowance(employer, multisend.address);
    assert.deepEqual(allowance, web3.utils.toBN(1000*DECIMALS));
    assert.equal(+beginning_balance, web3.utils.toBN(1000* DECIMALS));

    await multisend.depositAndSendPayment(
          [token1.address],
          [5*DECIMALS],
          [token1.address],
          [employee1],
          [web3.utils.toBN(5* DECIMALS)], {from: employer});

    let employer_balance = await token1.balanceOf(employer);
    let employee_balance = await token1.balanceOf(employee1);

    assert.equal(+employer_balance, web3.utils.toBN(web3.utils.toBN(web3.utils.toBN(950* DECIMALS))));
    assert.equal(+employee_balance, web3.utils.toBN(50* DECIMALS));
  });

  xit("should transfer ether to one person", async() =>  {
    let beginning_employee_balance = await web3.eth.getBalance(employee1);

    await multisend.depositAndSendPayment([ZERO_ADDRESS],[employee1], [50* DECIMALS], {from: employer, value: web3.utils.toBN(50* DECIMALS)});

    let employee_balance = await web3.eth.getBalance(employee1);

    assert.notDeepEqual(beginning_employee_balance, employee_balance);
    assert.equal(employee_balance, +beginning_employee_balance + web3.utils.toBN(50* DECIMALS));
  });

  xit("should not be able to transfer more ether than has been sent", async() => {
    try {
      await multisend.depositAndSendPayment([ZERO_ADDRESS],[employee1], [50* DECIMALS], {from: employer, value: 20});
      throw null;
    } catch (e) {
      if (e == null) assert.equal(0, 1, "Transaction did not error");
      assert.isNotNull(e.message.match(/revert/), "Transaction did not revert");
    }
  });

  xit("should transfer one token and ether to one person", async() =>  {
    let beginning_balance = await token1.balanceOf(employer);
    let beginning_ether_balance = await web3.eth.getBalance(employee1);

    assert.equal(+beginning_balance, web3.utils.toBN(1000* DECIMALS));

    await multisend.depositAndSendPayment([token1.address, ZERO_ADDRESS],[employee1, employee1], [50* DECIMALS, web3.utils.toBN(50* DECIMALS)], {from: employer, value: web3.utils.toBN(50* DECIMALS)});

    let employer_balance = await token1.balanceOf(employer);
    let employee_balance = await token1.balanceOf(employee1);
    let employee_ether_balance = await web3.eth.getBalance(employee1);

    assert.equal(+employer_balance, web3.utils.toBN(web3.utils.toBN(950* DECIMALS)));
    assert.equal(+employee_balance, web3.utils.toBN(50* DECIMALS));
    assert.equal(employee_ether_balance, +beginning_ether_balance + web3.utils.toBN(50* DECIMALS));
  });

  xit("should transfer two tokens to one person", async() =>  {
    let beginning_token_balance = await token1.balanceOf(employer);
    let beginning_token2_balance = await web3.eth.getBalance(employee1);

    await multisend.depositAndSendPayment([token1.address, token2.address],[employee1, employee1], [50* DECIMALS, web3.utils.toBN(50* DECIMALS)], {from: employer});

    let employer_token1_balance = await token1.balanceOf(employer);
    let employee_token1_balance = await token1.balanceOf(employee1);
    let employer_token2_balance = await token2.balanceOf(employer);
    let employee_token2_balance = await token2.balanceOf(employee1);

    assert.equal(+employer_token1_balance, web3.utils.toBN(web3.utils.toBN(950* DECIMALS)));
    assert.equal(+employer_token2_balance, web3.utils.toBN(web3.utils.toBN(950* DECIMALS)));
    assert.equal(+employee_token1_balance, web3.utils.toBN(50* DECIMALS));
    assert.equal(+employee_token2_balance, web3.utils.toBN(50* DECIMALS));
  });

  xit("should transfer one tokens to multiple people", async() =>  {
    let beginning_token_balance = await token1.balanceOf(employer);
    let beginning_token2_balance = await web3.eth.getBalance(employee1);

    await multisend.depositAndSendPayment([token1.address, token1.address, token1.address],[employee1, employee2, employee3], [50* DECIMALS, web3.utils.toBN(50* DECIMALS), web3.utils.toBN(50* DECIMALS)], {from: employer});

    let employer_token1_balance = await token1.balanceOf(employer);
    let employee1_token1_balance = await token1.balanceOf(employee1);
    let employee2_token1_balance = await token1.balanceOf(employee2);
    let employee3_token1_balance = await token1.balanceOf(employee3);

    assert.equal(+employer_token1_balance, web3.utils.toBN(850* DECIMALS));
    assert.equal(+employee1_token1_balance, web3.utils.toBN(50* DECIMALS));
    assert.equal(+employee2_token1_balance, web3.utils.toBN(50* DECIMALS));
    assert.equal(+employee3_token1_balance, web3.utils.toBN(50* DECIMALS));
  });

  xit("should revert if sending arrays of different lengths", async() => {

  });

  xit("should transfer two tokens to multiple people", async() =>  {
    let beginning_token_balance = await token1.balanceOf(employer);
    let beginning_token2_balance = await web3.eth.getBalance(employee1);

    await multisend.depositAndSendPayment(
      [token1.address, token2.address, token1.address],
      [employee1, employee2, employee3],
      [50* DECIMALS, web3.utils.toBN(50* DECIMALS), web3.utils.toBN(50* DECIMALS)],
      {from: employer});

    let employer_token1_balance = await token1.balanceOf(employer);
    let employer_token2_balance = await token2.balanceOf(employer);
    let employee1_token1_balance = await token1.balanceOf(employee1);
    let employee2_token2_balance = await token2.balanceOf(employee2);
    let employee3_token1_balance = await token1.balanceOf(employee3);

    assert.equal(+employer_token1_balance, 900);
    assert.equal(+employer_token2_balance, web3.utils.toBN(web3.utils.toBN(950* DECIMALS)));
    assert.equal(+employee1_token1_balance, web3.utils.toBN(50* DECIMALS));
    assert.equal(+employee2_token2_balance, web3.utils.toBN(50* DECIMALS));
    assert.equal(+employee3_token1_balance, web3.utils.toBN(50* DECIMALS));
  });

  xit("should transfer two tokens and ether to multiple people", async() =>  {
    let beginning_token_balance = await token1.balanceOf(employer);
    let beginning_token2_balance = await web3.eth.getBalance(employee1);

    await multisend.depositAndSendPayment([token1.address, token1.address, token1.address],[employee1, employee2, employee3], [50* DECIMALS, web3.utils.toBN(50* DECIMALS), web3.utils.toBN(50* DECIMALS)], {from: employer});

    let employer_token1_balance = await token1.balanceOf(employer);
    let employee1_token1_balance = await token1.balanceOf(employee1);
    let employee2_token1_balance = await token1.balanceOf(employee2);
    let employee3_token1_balance = await token1.balanceOf(employee3);

    assert.equal(+employer_token1_balance, web3.utils.toBN(850* DECIMALS));
    assert.equal(+employee1_token1_balance, web3.utils.toBN(50* DECIMALS));
    assert.equal(+employee2_token1_balance, web3.utils.toBN(50* DECIMALS));
    assert.equal(+employee3_token1_balance, web3.utils.toBN(50* DECIMALS));
  });

  xit("should be able to withdraw tokens", async() => {
  });

  xit("should be able to withdraw ether", async() => {
  });

  xit("should be able to sending multiple tokens", async() => {
    await multisend.depositAndSendPayment(new Array(30).fill(token1.address),
                                new Array(30).fill(employee1),
                                new Array(30).fill(2* DECIMALS),
                                {from: employer});
  });

  async function depositToken(token, amount) {
    await multisend.deposit([token], [amount]);
  }
});

