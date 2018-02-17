
const requestConfig = {
  method: 'GET',
  mode: 'cors'
};

var app = new Vue({
  el: '#app',
  data() {
    return {
      coins: [],
      totalUSDBalance:0,
      qty:{
        "TRX":0, 
        "XVG":23992.81800000,  
        "PAC":20863549.40119760,
        "ADA":1831.82300000,
        "DOGE":(85182.60146374+49965.557622),//-
        "RCN":306.69300000,//-
        "KIN":3863398.244,//--
        "ALG":97.112430663921291054,
        "XRP":625.94600000,//---
        "ETH":(0.04828384+3.94814588), //--
        "POE":(17959.02300000),//-
        "IOTA":184.24200000,
        "FUN":3002.99400000,//33323.78526529
        "FUEL":2061.876, //685--
        "RLC":142.83702000,
        "TRIG":98.90100000,
        "AION": 70.48000000,
        "ARK":47.09000000,
        "BNB":32,
        "STEEM":98.31,
        "SC":15900,
        "ZAP":2000.00000000,
        "ZRX":1002.20000000,
        "LEND":2191.80600000, //281.99425-
        "LINDA":132801.08410630//1193.08493961-
      }
    }
  },
  computed: {
    filterCoins: function() { 
      var that=this; 
      return this.coins.filter(function(coin){
        return true;//(undefined!==that.qty[coin.symbol])
      });
    }
  },
  methods: {
    fetchUpdates: function() {
    var url = "/api";
      var self = this;
      fetch(url, requestConfig)
        .then(
          function(response) {
            if (response.status !== 200) {
              console.log('Looks like there was a problem. Status Code: ' +
                response.status);
              return;
            }
            // Examine the text in the response
            response.json().then(function(coins) {
              var totalBalance=0;
              coins.map(function(coin,index){
                  coin['usdValue']=parseFloat(coin['qty']*coin.price_usd).toFixed(0);
                  //coin['btcValue']=parseFloat(coin['qty']*coin.price_btc).toFixed(0);
                  if(!isNaN(coin['usdValue'])){
                  totalBalance+=parseFloat(coin['usdValue']);
                  coin.price_usd=parseFloat(coin.price_usd).toFixed(4);
                  //coin.price_btc=parseFloat(coin.price_btc).toFixed(16);
                  }
              });
              self.coins = coins;
              self.totalUSDBalance=totalBalance;
            });
          }
        )
        .catch(function(err) {
          console.log('Fetch Error :-S', err);
        });
    }
  }
});
app.fetchUpdates();
setInterval(function(){
  app.fetchUpdates();
},60000)