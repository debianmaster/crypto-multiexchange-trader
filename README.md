>  view all your crypto assets across multiple exchanges using api keys.  
>  buy/sell is still work in progress  
>  as of now you need to supply all keys (in-readonly mode DO NOT check the withdraw permissons to be safe.)   
>  USE this repo with caution, im not responsible for any of your financial LOSSES.  This is just for education purpose.  


```sh
git clone https://github.com/debianmaster/crypto-multiexchange-trader
docker build -t crypto-multiexchange-trader .
# Fill your .env  file with exchange api keys (as of now all exchange keys need to be supplied)
docker run -p 8080:8080 crypto-multiexchange-trader
```
```
visit  http://localhost:8080
```
Screenshot
![Multi exchange](https://github.com/debianmaster/crypto-multiexchange-trader/blob/master/public/crypto-exchange.png?raw=true)


# crypto-multiexchange-trader
