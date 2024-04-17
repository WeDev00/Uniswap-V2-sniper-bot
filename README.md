# Uniswap V2 SniperBot

sniper-bot to buy and sell tokens right after listing

# How use:

1. In project folder, create a .env file
2. Add the following variables:
   PRIVATE_KEY= /_YOUR_PRIVATE_KEY_/
   MAINNET_RPC_URL= /_YOUR_WEBSOCKET_URL_TO_ETHEREUM_MAINNET_/
3. In the "sniper-bot.js" file, edit the "tokenToBuy" object, adding the symbol of the token you want to buy
4. Set your target profit at the "isTimeToSell" method call (line 81), third parameter
5. Run the bot few minutes before the token listing
