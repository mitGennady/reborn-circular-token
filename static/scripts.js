var client;
var mainnetNetwork;

async function conenctXrpl(mainnet) {
  mainnetNetwork = mainnet;

  client = new xrpl.Client(mainnet ? "wss://xrplcluster.com/" : "wss://s.altnet.rippletest.net:51233");

  client.on("connected", async () => {
    console.log(`Connected Event`);
  });

  await client.connect();

  const connector = document.getElementById("status-connector");
  connector.innerText = "Connected";
  connector.style.color = "green";

  console.log(`Connected ${mainnet ? "mainnet" : "testnet"}`);
}

async function disconnectXrpl() {
  client.on("disconnected", async () => {
    console.log(`Disconnected Event`);
  });

  client.disconnect();

  const connector = document.getElementById("status-connector");
  connector.innerText = "Disonnected";
  connector.style.color = "red";

  console.log(`Disconnected from XRPL`);
}

async function generateWallets() {
  const accounts = document.getElementById("generated-accounts");
  const amount = document.getElementById("count-accounts");
  const iterations = amount.value ? +amount.value : 2;

  for (let i = 0; i < iterations; i++) {
    const fund_result = await client.fundWallet();
    const test_wallet = fund_result.wallet;

    const publicKey = document.createElement("div");
    publicKey.innerText = test_wallet.classicAddress;
    publicKey.style.fontWeight = "bold";

    const privateKey = document.createElement("div");
    privateKey.innerText = test_wallet.seed;
    privateKey.style.fontWeight = "bold";

    const balance = document.createElement("div");
    const balanceXrp = await client.getBalances(test_wallet.classicAddress);
    balance.innerText = `${balanceXrp[0].value} ${balanceXrp[0].currency}`;
    balance.style.fontWeight = "bold";

    const publicKeyText = document.createElement("div");
    const privateKeyText = document.createElement("div");
    const balanceText = document.createElement("div");
    publicKeyText.innerText = "PublicKey";
    privateKeyText.innerText = "SecretKey";
    balanceText.innerText = "Balance";

    publicKeyText.style.marginBottom = "10px";
    privateKeyText.style.marginBottom = "10px";
    balanceText.style.marginBottom = "10px";

    publicKeyText.style.marginTop = "20px";
    privateKeyText.style.marginTop = "20px";
    balanceText.style.marginTop = "20px";

    accounts.appendChild(publicKeyText);
    accounts.appendChild(publicKey);
    accounts.appendChild(privateKeyText);
    accounts.appendChild(privateKey);
    accounts.appendChild(balanceText);
    accounts.appendChild(balance);

    const hr = document.createElement("hr");
    accounts.appendChild(hr);
  }
}

async function settingsIssuer() {
  const key = document.getElementById("secret-key-issuer");
  const fee = document.getElementById("transfer-rate").value;
  const size = document.getElementById("tick-size").value;
  const tx = document.getElementById("tx-issuer");

  const domainHex = document.getElementById("domain-hex");
  const domain = domainHex.textContent;

  const cold_wallet = await xrpl.Wallet.fromSeed(key.value);

  const cold_settings_tx = {
    TransactionType: "AccountSet",
    Account: cold_wallet.address,
    TransferRate: fee ? fee : 0,
    TickSize: size ? size : 5,
    Domain: domain,
    SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
    Flags: xrpl.AccountSetTfFlags.tfDisallowXRP | xrpl.AccountSetTfFlags.tfRequireDestTag,
  };

  if (!domain) delete cold_settings_tx.Domain;

  const cst_prepared = await client.autofill(cold_settings_tx);
  const cst_signed = cold_wallet.sign(cst_prepared);
  tx.innerText = "Sending cold address AccountSet transaction...";

  const cst_result = await client.submitAndWait(cst_signed.tx_blob);
  if (cst_result.result.meta.TransactionResult == "tesSUCCESS") {
    tx.innerText =
      "Transaction succeeded: " +
      (mainnetNetwork ? `https://livenet.xrpl.org/` : `https://testnet.xrpl.org/`) +
      `transactions/${cst_signed.hash}`;
  } else {
    throw `Error sending transaction: ${cst_result}`;
  }
}

async function settingsHotAddress() {
  const key = document.getElementById("secret-key-hot");
  const tx = document.getElementById("tx-hot");

  const domainHex = document.getElementById("domain-hex-hot");
  const domain = domainHex.textContent;

  const hot_wallet = await xrpl.Wallet.fromSeed(key.value);

  const hot_settings_tx = {
    TransactionType: "AccountSet",
    Account: hot_wallet.address,
    Domain: domain.textContent,
    SetFlag: xrpl.AccountSetAsfFlags.asfRequireAuth,
    Flags: xrpl.AccountSetTfFlags.tfDisallowXRP | xrpl.AccountSetTfFlags.tfRequireDestTag,
  };

  if (!domain) delete hot_settings_tx.Domain;

  const hst_prepared = await client.autofill(hot_settings_tx);
  const hst_signed = hot_wallet.sign(hst_prepared);

  tx.innerText = "Sending cold address AccountSet transaction...";

  const hst_result = await client.submitAndWait(hst_signed.tx_blob);
  if (hst_result.result.meta.TransactionResult == "tesSUCCESS") {
    tx.innerText =
      "Transaction succeeded: " +
      (mainnetNetwork ? `https://livenet.xrpl.org/` : `https://testnet.xrpl.org/`) +
      `transactions/${hst_signed.hash}`;
  } else {
    throw `Error sending transaction: ${hst_result.result.meta.TransactionResult}`;
  }
}

async function trustLineHotTo() {
  const hotKey = document.getElementById("hot-key-trust-line");
  const coldKey = document.getElementById("cold-trust-line");
  const limit = document.getElementById("trust-line-limit").value;
  const tx = document.getElementById("tx-trust-line");

  const hot_wallet = await xrpl.Wallet.fromSeed(hotKey.value);
  const cold_wallet = await xrpl.Wallet.fromSeed(coldKey.value);

  const trust_set_tx = {
    TransactionType: "TrustSet",
    Account: hot_wallet.address,
    LimitAmount: {
      currency: getCurrency(document.getElementById("trust-line-currency-code").value),
      issuer: cold_wallet.address,
      value: limit ? limit : "10000000000", // Large limit, arbitrarily chosen
    },
  };

  const ts_prepared = await client.autofill(trust_set_tx);
  const ts_signed = hot_wallet.sign(ts_prepared);

  tx.innerText = "Sending cold address AccountSet transaction...";

  const ts_result = await client.submitAndWait(ts_signed.tx_blob);
  if (ts_result.result.meta.TransactionResult == "tesSUCCESS") {
    tx.innerText =
      "Transaction succeeded: " +
      (mainnetNetwork ? `https://livenet.xrpl.org/` : `https://testnet.xrpl.org/`) +
      `transactions/${ts_signed.hash}`;
  } else {
    throw `Error sending transaction: ${ts_result.result.meta.TransactionResult}`;
  }
}

async function sendToken() {
  const hotKey = document.getElementById("hot-key-send-token");
  const coldKey = document.getElementById("cold-key-send-token");
  const quontity = document.getElementById("send-token-limit").value;
  const tx = document.getElementById("tx-send-token");

  const hot_wallet = await xrpl.Wallet.fromSeed(hotKey.value);
  const cold_wallet = await xrpl.Wallet.fromSeed(coldKey.value);

  const issueQuontity = "10000000000";
  const currency = getCurrency(document.getElementById("send-token-code").value);
  console.log(currency, quontity ? +quontity : issueQuontity);
  const send_token_tx = {
    TransactionType: "Payment",
    Account: cold_wallet.address,
    Amount: {
      currency,
      value: quontity ? String(quontity) : issueQuontity,
      issuer: cold_wallet.address,
    },
    Destination: hot_wallet.address,
    DestinationTag: 0,
  };

  const pay_prepared = await client.autofill(send_token_tx);
  const pay_signed = cold_wallet.sign(pay_prepared);

  tx.innerText = `Sending ${issueQuontity} ${currency} to ${hot_wallet.address}...`;

  const pay_result = await client.submitAndWait(pay_signed.tx_blob);
  if (pay_result.result.meta.TransactionResult == "tesSUCCESS") {
    tx.innerText =
      "Transaction succeeded: " +
      (mainnetNetwork ? `https://livenet.xrpl.org/` : `https://testnet.xrpl.org/`) +
      `transactions/${pay_signed.hash}`;
  } else {
    throw `Error sending transaction: ${pay_result.result.meta.TransactionResult}`;
  }
}

async function validate() {
  const hotKey = document.getElementById("hot-key-validate");
  const coldKey = document.getElementById("cold-key-validate");

  const hot_wallet = await xrpl.Wallet.fromSeed(hotKey.value);
  const cold_wallet = await xrpl.Wallet.fromSeed(coldKey.value);

  const hot_balances = await client.request({
    command: "account_lines",
    account: hot_wallet.address,
    ledger_index: "validated",
  });

  console.log("Getting cold address balances...");
  const cold_balances = await client.request({
    command: "gateway_balances",
    account: cold_wallet.address,
    ledger_index: "validated",
    hotwallet: [hot_wallet.address],
  });
  console.log(JSON.stringify(cold_balances.result, null, 2));

  const validateData = document.getElementById("validate-data");
  coldBalances = cold_balances.result.balances[hot_wallet.address];

  for (let i = 0; i < coldBalances.length; i++) {
    const symbol = document.createElement("div");
    symbol.innerText = `Symbol: ${coldBalances[i].currency}; Balance: ${coldBalances[i].value}`;
    validateData.appendChild(symbol);
  }

  client.disconnect();
}

function ascii_to_hex(str) {
  var arr1 = [];
  for (var n = 0, l = str.length; n < l; n++) {
    var hex = Number(str.charCodeAt(n)).toString(16);
    arr1.push(hex);
  }
  return arr1.join("");
}

function getCurrency(currency) {
  if (currency.length <= 3) {
    return currency;
  } else {
    return ascii_to_hex(currency).toUpperCase().padEnd(40, "0");
  }
}

window.onload = async () => {
  const domain = document.getElementById("domain");
  const domainHex = document.getElementById("domain-hex");

  domain.oninput = () => {
    domainHex.innerHTML = ascii_to_hex(domain.value).toUpperCase();
  };

  const domainHotAccount = document.getElementById("domain-hot");
  const domainHexHotAccount = document.getElementById("domain-hex-hot");

  domainHotAccount.oninput = () => {
    domainHexHotAccount.innerHTML = ascii_to_hex(domainHotAccount.value).toUpperCase();
  };

  const connector = document.getElementById("connector");
  const disconnector = document.getElementById("disconnector");
  const connectorSelectInput = document.querySelector("#connector_select");

  const generator = document.querySelector("#generator");
  const issuer = document.querySelector("#issuer");
  const hot = document.querySelector("#hot");

  connector.onclick = async () => {
    await conenctXrpl(connectorSelectInput.selectedIndex === 1 ? true : false);
  };

  disconnector.onclick = async () => {
    await disconnectXrpl();
  };

  generator.onclick = async () => {
    await generateWallets();
  };

  issuer.onclick = async () => {
    await settingsIssuer();
  };

  hot.onclick = async () => {
    await settingsHotAddress();
  };

  // Trust line
  const currencyCode = document.getElementById("trust-line-currency-code");
  const currencyHexCode = document.getElementById("trust-line-currency-hex-code");

  currencyCode.oninput = () => {
    currencyHexCode.innerText = getCurrency(currencyCode.value);
  };

  const truustLine = document.getElementById("trust-line-hot-to-cold");
  truustLine.onclick = async () => {
    await trustLineHotTo();
  };

  // Send token

  const currencyCodeSendToken = document.getElementById("send-token-code");
  const currencyHexCodeSendToken = document.getElementById("send-token-hex-code");

  currencyCodeSendToken.oninput = () => {
    currencyHexCodeSendToken.innerText = getCurrency(currencyCodeSendToken.value);
  };

  const sendTokenButton = document.getElementById("send-token-hot-to-cold");
  sendTokenButton.onclick = async () => {
    await sendToken();
  };

  // Validate

  const validateButton = document.getElementById("validate");
  validateButton.onclick = async () => {
    await validate();
  };
};
