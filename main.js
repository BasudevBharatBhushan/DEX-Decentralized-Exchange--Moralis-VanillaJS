/** Connect to Moralis server */
const serverUrl = "https://kxhndbzmonzw.usemoralis.com:2053/server";
const appId = "T2qvFksuOQ8vVaKCnLJA4K6yzDb1J8I3yLJ8dIzN";

let currentTrade = {};
let currentSelectSide;
let tokens;

async function init(){
    console.log("App Initialized");
    await Moralis.start({ serverUrl, appId });
    await await Moralis.initPlugins();
    await Moralis.enableWeb3();
    await listAvailableToken();
    currentUser = Moralis.User.current()
    if (currentUser) {
        document.getElementById("swap_button").disabled = false;
    }
}

async function listAvailableToken(){
    const result = await Moralis.Plugins.oneInch.getSupportedTokens({
        chain:'eth',
    });
    console.log(result)
    tokens = result.tokens;
    let parent = document.getElementById('token_list');
    for(const element in tokens){
        let token = tokens[element];
        let div = document.createElement("div");
        div.className="token_row";
        let html = `
            <img class="token_list_img" src="${token.logoURI}">
            <span class="token_list_text">${token.symbol}</span>
        `;
        div.innerHTML=html;
        parent.appendChild(div);
        
        div.onclick = (()=>{
            selectToken(element);
        })
    }
}

function selectToken(address){
    closeModal();
    // let address = event.target.getAttribute('data-address');
    console.log(address);
    currentTrade[currentSelectSide] = tokens[address];
    console.log(currentTrade);
    renderInterface();
    getQuote();
}

function renderInterface(){
    
    if(currentTrade.from == currentTrade.to){
        alert("Same tokens cannot be swaped")
    }else {
        if(currentTrade.from ){
            document.getElementById('from_token_img').src=currentTrade.from.logoURI;
            document.getElementById('from_token_text').innerHTML=currentTrade.from.symbol;
        }
        if(currentTrade.to ){
            document.getElementById('to_token_img').src=currentTrade.to.logoURI;
            document.getElementById('to_token_text').innerHTML=currentTrade.to.symbol;
        }
    }
    
}


async function login() {
    try {
      currentUser = Moralis.User.current();
      if (!currentUser) {
        currentUser = await Moralis.authenticate();
      }
      document.getElementById("swap_button").disabled = false;
      document.getElementById("login_button").innerText = "Metamask Connected";
      document.getElementById("logout_button").style.visibility="visible";
  
    } catch (error) {
      console.log(error);
    }
  }
  
  async function logOut() {
      await Moralis.User.logOut();
      console.log("Logged out");
      document.getElementById("logout_button").style.visibility = "hidden";
      document.getElementById("login_button").innerText="Sign in with Metamask"
      document.getElementById("swap_button").disabled = true;
    }

function openModal(side){
    currentSelectSide = side;
    console.log(currentSelectSide)
    document.getElementById("token_modal").style.display="block"
}

function closeModal(){
    document.getElementById('token_modal').style.display="none";
}

async function getQuote() {
    if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
  
   let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);
    
    const quote = await Moralis.Plugins.oneInch.quote({
      chain: "eth", // The blockchain you want to use (eth/bsc/polygon)
      fromTokenAddress: currentTrade.from.address, // The token you want to swap
      toTokenAddress: currentTrade.to.address, // The token you want to receive
      amount: amount,
    });
    console.log(quote);
    document.getElementById("gas_estimate").innerHTML = quote.estimatedGas;
    document.getElementById("to_amount").value = quote.toTokenAmount / 10 ** quote.toToken.decimals;
  }

  async function trySwap(){
      let address = Moralis.User.current().get("ethAddress");
      //get allowance
      let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);
      if(currentTrade.from.symbol !== 'ETH'){

        //check allowance
        const allowance = await Moralis.Plugins.oneInch.hasAllowance({
            chain:'eth',
            fromTokenAddress: currentTrade.from.address,
            fromAddress: address,
            amount:amount,
        })
        console.log(allowance);
        if(!allowance){
            await Moralis.Plugins.oneInch.approve({
                chain:'eth',
                tokenAddress: address,
                fromAddress: currentTrade.from.address
            });
        }
      }
      let receipt = doSwap(address, amount);
      alert("Swap Complete");
    }

    function doSwap(userAddress, amount){
        return Moralis.Plugins.oneInch.swap({
            chain: "eth", // The blockchain you want to use (eth/bsc/polygon)
            fromTokenAddress: currentTrade.from.address, // The token you want to swap
            toTokenAddress: currentTrade.to.address, // The token you want to receive
            amount: amount,
            fromAddress: userAddress, // Your wallet address
            slippage: 1,
          });
          console.log(receipt);
    }
        
      
  

init();

document.getElementById("modal_close").onclick= closeModal;
document.getElementById("from_token_select").onclick = ()=> {openModal("from")};
document.getElementById("to_token_select").onclick = ()=> {openModal("to")};
document.getElementById("login_button").onclick = login;
document.getElementById("logout_button").onclick=logOut;
document.getElementById("from_amount").onblur = getQuote;
// document.getElementById("swap_button").onclick = trySwap;



/** Useful Resources  */

// https://docs.moralis.io/moralis-server/users/crypto-login
// https://docs.moralis.io/moralis-server/getting-started/quick-start#user
// https://docs.moralis.io/moralis-server/users/crypto-login#metamask

/** Moralis Forum */

// https://forum.moralis.io/