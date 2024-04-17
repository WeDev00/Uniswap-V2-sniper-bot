const { ethers } = require("hardhat");
const ERC20Abi =
  '[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"src","type":"address"},{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"wad","type":"uint256"}],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"deposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"guy","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Withdrawal","type":"event"}]';

let addresses = {
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
  router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  recipient: "0xAF429255F21BC80104fcC0e0Fdb1Bf45b48f86Bd",
};

const onPairCreated = async function (
  token0,
  token1,
  pairAddress,
  tokenToBuy,
  runner
) {
  let weth, targetToken, targetTokenSymbol;

  if (token0 == addresses.WETH) {
    //se token0 è weth
    weth = new ethers.Contract(token0, ERC20Abi, runner);
    targetToken = new ethers.Contract(token1, ERC20Abi, runner);
  }

  if (token1 == addresses.WETH) {
    //se token1 è weth
    weth = new ethers.Contract(token1, ERC20Abi, runner);
    targetToken = new ethers.Contract(token0, ERC20Abi, runner);
  }

  if (typeof weth === "undefined") {
    console.log("La coppia non include WETH");
    return {
      targetCouple: false,
      weth: null,
      targetToken: null,
      pairAddress: null,
    };
  }
  targetTokenSymbol = await targetToken.symbol();
  if (targetTokenSymbol != tokenToBuy.symbol) {
    console.log("La coppia non include il token da acquistare");
    return {
      targetCouple: false,
      weth: null,
      targetToken: null,
      pairAddress: null,
    };
  }

  return {
    targetCouple: true,
    weth: weth,
    targetToken: targetToken,
    pairAddress: pairAddress,
  };
};

///router è l'istanza del router
///amountIn è l'importo (in ether) da acquistare
///weth è l'istanza del token weth
///targetToken è l'istanza del token da acquistare
const buy = async function (router, amountIn, weth, targetToken) {
  const targetAddress = await targetToken.getAddress();
  const amounts = await router.getAmountsOut(amountIn, [
    addresses.WETH,
    targetAddress,
  ]);
  let minimumAmount = BigInt(amounts[1]);
  minimumAmount = minimumAmount - minimumAmount / BigInt(10); //voglio almeno il 90% dei token che mi è concesso acquistare
  console.log("Sto comprando il target token");
  //approva la spesa dei tuoi token da parte del router
  await weth.approve(addresses.router, amountIn);
  await targetToken.approve(routerAddress, amounts[1], {
    gasPrice: 100000000000,
  });
  //esegui la compera
  const tx = await router.swapExactTokensForTokens(
    amountIn,
    minimumAmount,
    [addresses.WETH, targetAddress],
    addresses.recipient,
    Date.now() + 6000, //l'operazione deve essere eseguita entro un minuto da adesso
    { gasPrice: 100000000000, gasLimit: 200000000000 }
  );
  await tx.wait(1);
  return minimumAmount;
};

///target token è l'istanza del token acquistato
///minPurchasedAmount è il numero massimo di token che abbiamo acquistato
///target è un moltiplicatore intero, se sarà 2, significherà che venderemo quando il prezzo è raddoppiato=quando i token che otteniamo con router.getAmountsOut saranno dimezzati
///router è l'istanza del router v2 di uniswap
const isTimeToSell = async function (
  targetToken,
  minPurchasedAmount,
  target,
  router
) {
  const targetTokenAddress = await targetToken.getAddress();
  const actualAmount = router.getAmountsOut(amountIn, [
    addresses.WETH,
    targetTokenAddress,
  ]);
  //se abbiamo raggiunto il target
  if (actualAmount <= minPurchasedAmount / BigInt(target))
    return { isTime: true, amount: actualAmount };
  //se ci stiamo andando sotto (perdita del 30%) BigInt(7)/BigInt(10)
  const lossFactor = BigInt(7) / BigInt(10);
  if (actualAmount >= minPurchasedAmount / lossFactor)
    return { isTime: true, amount: actualAmount };

  return { isTime: false, amount: null };
};

const sell = async function (router, amountToSell, targetAddress) {
  const tx = await router.swapExactTokensForTokens(
    amountToSell,
    amountToSell.sub(amountToSell.div(10)),
    [targetAddress, addresses.WETH],
    addresses.recipient,
    Date.now() + 6000, //l'operazione deve essere eseguita entro un minuto da adesso
    { gasPrice: 100000000000, gasLimit: 200000000000 }
  );
  await tx.wait(1);
};

module.exports = {
  onPairCreated,
  buy,
  isTimeToSell,
  sell,
};
