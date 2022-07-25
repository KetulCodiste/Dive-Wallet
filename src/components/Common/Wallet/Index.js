import React, { Component } from "react";
import Web3 from "web3";
import cogoToast from "cogo-toast";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { abis } from "../../../smartcontract/index";
import { NETWORK_ID, RPC_URL, INFURA_ID, DIVE_WALLET_CONTRACT } from "../../../config";

const dive_wallet_abi = abis.diveWallet;
export const WalletContext = React.createContext();

class WalletContextProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accountBalance: 0,
      web3RPCProvider: null,
      web3Provider: null,
      accountId: null,
      tokencontract: null,
      balance: 0,
      connectModal: false,
      userUuid: null,
      diveWalletContract: null,
      isWhitelistActive: false,
      isMainSaleActive: false,
    };
  }

  componentDidMount() {
    let RPCProvider = new Web3(RPC_URL);
    this.setState({
      web3RPCProvider: RPCProvider,
    });
    if (window.ethereum) {
      window.ethereum.on("chainChanged", function (networkId) {
        localStorage.setItem("MetaMask", "");
        window.location.reload(true);
      });
      window.ethereum.on("accountsChanged", () => {
        // localStorage.setItem('MetaMask', '');
        this.connectWallet();
      });
      window.ethereum.on("disconnect", function (networkId) {
        localStorage.setItem("MetaMask", "");
        window.location.reload(true);
      });
    }

    if (localStorage.getItem("MetaMask") === "true") {
      this.connectWallet();
    } else if (localStorage.getItem("WalletConnect") === "true") {
      this.connectToWalletConnect();
    }
  }

  connectWallet = async () => {
    if (window.ethereum) {
      let web3 = new Web3(window.ethereum);
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        const accountID = accounts[0];

        const networkId = await web3.eth.net.getId();
        if (networkId === NETWORK_ID) {
          const balance = await web3.eth.getBalance(accountID);
          const accountBalance = await web3.utils.fromWei(balance, "ether");

          this.setState({
            accountBalance: parseFloat(accountBalance).toFixed(4),
          });
          localStorage.setItem("MetaMask", "true");
          web3.eth.defaultAccount = accounts[0];

          this.setState(
            {
              web3Provider: web3,
              accountId: accountID,
              connectModal: false,
            },
            () => {
              this.connectDiveWalletContract();
            }
          );
        } else {
          this.setState({ connectModal: false });
          return cogoToast.error(
            `Please change your network to ${
              networkId !== 97 ? "Binance testnet!" : "Binance mainnet!"
            }`
          );
        }
      } catch (e) {
        console.log(e);
        cogoToast.error(e.message);
      }
    } else if (window.web3) {
      let web3 = new Web3(window.web3.currentProvider);
      this.setState({ web3Provider: web3 });
    } else {
      cogoToast.error("You have to install MetaMask !");
    }
  };

  connectDiveWalletContract = async () => {
    try {
      const { web3Provider } = this.state;

      let web3;
      if (web3Provider) {
        web3 = new Web3(web3Provider);
      } else {
        web3 = new Web3(RPC_URL);
      }
      const contract = await new web3.eth.Contract(dive_wallet_abi, DIVE_WALLET_CONTRACT);
      await this.setState({ diveWalletContract: contract });

      return contract;
    } catch (error) {
      console.log("Cannot connect to contract: ", error);
    }
  };

  connectToWalletConnect =  async () => {
    try {
      const provider = new WalletConnectProvider({
        infuraId: INFURA_ID,
        rpc: {
          56: "https://bsc-dataseed.binance.org",
        },
        chainId: 56,
      });

      // Subscribe to accounts change
      provider.on("accountsChanged", (accounts) => {
        localStorage.setItem("WalletConnect", "");
        this.connectToWalletConnect();
      });

      // Subscribe to chainId change
      provider.on("chainChanged", (chainId) => {
        localStorage.setItem("WalletConnect", "");
        this.connectToWalletConnect();
      });

      // Subscribe to session disconnection
      provider.on("disconnect", (code, reason) => {
        localStorage.setItem("WalletConnect", "");
        this.setState({
          accountBalance: 0,
          web3Provider: null,
          accountId: null,
          balance: 0,
          connectModal: false,
        });
      });

      //  Enable session (triggers QR Code modal)
      await provider.enable();

      //  Create Web3 instance
      const web3 = new Web3(provider);

      const accounts = await web3.eth.getAccounts();
      const accountID = accounts[0];

      const networkId = await web3.eth.net.getId();
      // console.log("networkId",networkId)
      if (networkId !== NETWORK_ID) {
        return cogoToast.error(
          `Please change your network to ${
            networkId !== 97 ? "Binance testnet!" : "Binance mainnet!"
          }`
        );
      }

      this.setState({ accountId: accountID });
      const balance = await web3.eth.getBalance(accountID);
      const accountBalance = await web3.utils.fromWei(balance, "ether");
      // balance = web3.utils.fromWei(balance);
      web3.eth.defaultAccount = accounts[0];
      this.setState({
        accountBalance: parseFloat(accountBalance).toFixed(4),
        web3Provider: web3,
        connectModal: false,
      });
      provider.qrcodeModal.close();
      localStorage.setItem("MetaMask", "");
      localStorage.setItem("WalletConnect", "true");
    } catch (error) {
      console.log(error);
    } finally {
      this.setState({ connectModal: false });
    }
  };

  handleTrustWalletConnected = async (account) => {
    if (!this.trustWalletConnected) {
      this.trustWalletConnected = true;

      if (window.ethereum) {
        let web3 = new Web3(window.ethereum);
        try {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });

          const accountID = accounts[0];

          const networkId = await web3.eth.net.getId();
          if (networkId === NETWORK_ID) {
            const balance = await web3.eth.getBalance(accountID);
            const accountBalance = await web3.utils.fromWei(balance, "ether");

            this.setState({
              accountBalance: parseFloat(accountBalance).toFixed(4),
            });
            localStorage.setItem("MetaMask", "true");
            localStorage.setItem("WalletConnect", "");
            web3.eth.defaultAccount = accounts[0];
            this.setState({
              web3Provider: web3,
              accountId: accountID,
              connectModal: false,
            });
          } else {
            this.setState({ connectModal: false });
            return cogoToast.error(
              `Please change your network to ${
                networkId === 97 ? "Binance testnet!" : "Binance mainnet!"
              }`
            );
          }
        } catch (e) {
          console.log(e);
          cogoToast.error(e.message);
        }
      } else if (window.web3) {
        let web3 = new Web3(window.web3.currentProvider);
        this.setState({ web3Provider: web3 });
      } else {
        cogoToast.error("You have to install Trust wallet!");
      }
    }
  };

  disconnectWallet = async () => {
    localStorage.setItem("MetaMask", "");
    localStorage.setItem("WalletConnect", "");
    this.setState({
      accountId: null,
      web3Provider: null,
      accountBalance: null,
      balance: null,
      userUuid: null,
    });
  };

  getWalletConnectButton = () => {
    return (
      <>
        <div className="wallet_top">
          {this.state.accountId ? (
            <>
              <span className="account_id me-2">{`${
                this.state.accountId.substring(1, 6) +
                "..." +
                this.state.accountId.substring(this.state.accountId.length - 4)
              }`}</span>

              <button
                className="btn btn-primary"
                onClick={() => this.disconnectWallet()}
              >
                Disconnect
              </button>
            </>
          ) : (
            <>
              <a
                className="menu-button"
                type="button"
                onClick={() =>
                  this.setState({ connectModal: !this.state.connectModal })
                }
              >
                Connect Wallet
              </a>
            </>
          )}
        </div>
      </>
    );
  };

  openWalletModel = () => {
    this.setState({ connectModal: !this.state.connectModal });
  };

  hideWalletModal = () => {
    this.setState({
      connectModal: !this.state.connectModal,
    });
  };

  render() {
    const { children } = this.props;
    return (
      <WalletContext.Provider value={{ ...this, ...this.state }}>
        {children}
      </WalletContext.Provider>
    );
  }
}

export default WalletContextProvider;
