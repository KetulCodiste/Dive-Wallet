import cogoToast from "cogo-toast";
import { WalletContext } from "components/Common/Wallet/Index";
import React, { useContext, useEffect, useState } from "react";

let hasLoaded = false;
function Mint() {
  const {
    diveWalletContract,
    connectDiveWalletContract,
    web3Provider,
    accountId,
    getWalletConnectButton,
    accountBalance,
  } = useContext(WalletContext);

  console.log(accountId);

  const [state, setState] = useState({
    isWhitelistActive: false,
    isMainSaleActive: false,
    walletLimit: 0,
    claimedNfts: 0,
    nftCount: 1,
    nftPrice: 0,
    totalMinted: 0,
    releasedNfts: 0,
    flag: true,
    psBought: 0,
    loading: false,
    buyLoader: false
  });

  useEffect(() => {
    const getData = async () => {
      try {
        console.log("lsdkgjlak");
        setState((prevState) => ({
          ...prevState,
          loading: true,
        }));
        const contractLoaded = await connectDiveWalletContract();
        const isWhitelistActive = await contractLoaded.methods
          .isWhitelistActive()
          .call();
        const isMainSaleActive = await contractLoaded.methods
          .isSaleActive()
          .call();
        const walletLimit = await contractLoaded.methods.walletLimit().call();
        let nftPrice = await contractLoaded.methods.nftPrice().call();
        const totalMinted = await contractLoaded.methods.totalSupply().call();
        const releasedNfts = await contractLoaded.methods.released().call();

        setState((prevState) => ({
          ...prevState,
          isWhitelistActive,
          isMainSaleActive,
          walletLimit: Number(walletLimit),
          nftPrice: Number(nftPrice),
          totalMinted: Number(totalMinted),
          releasedNfts: Number(releasedNfts),
          loading: false,
        }));
      } catch (error) {
        console.log(error);
      }
    };

    if (!diveWalletContract) getData();
    const getClaimData = async () => {
      hasLoaded = true;
      await getData();
      const timer = setInterval(() => {
        handleTotalMinted();
      }, 10000);

      return () => {
        clearInterval(timer);
      };
    };
    if (diveWalletContract && accountId && !hasLoaded) {
      getClaimData();
    }
  }, [diveWalletContract, accountId]);

  useEffect(() => {
    const getClaimedData = async () => {
      await getData();
    }
    getClaimedData();
  }, [accountId]);

  const getData = async () => {
    try {
      const claimedNfts = await diveWalletContract.methods
        .claimed(accountId)
        .call();
        const psBought = await diveWalletContract.methods.psBought(accountId).call();

      setState((prevState) => ({
        ...prevState,
        claimedNfts: Number(claimedNfts),
        psBought: Number(psBought),
      }));
    } catch(err) {
      console.log(err);
    }
  }

  const handleMint = async () => {
    const { claimedNfts, walletLimit, nftCount, nftPrice } = state;
    if (claimedNfts < walletLimit) {
      const mint = await diveWalletContract.methods.mint(nftCount).send({
        from: accountId,
        // value: web3Provider.utils.toWei((nftCount * nftPrice).toString(), 'ether')
        value: (nftCount * nftPrice).toString(),
      });
      const claimedNfts = await diveWalletContract.methods
        .claimed(accountId)
        .call();
      setState((prevState) => ({
        ...prevState,
        claimedNfts: Number(claimedNfts),
      }));
      handleTotalMinted();

      cogoToast.success(`You successfully purchased ${nftCount} NFT`);
    } else {
      cogoToast.error("You have reached the limit");
    }
  };

  const Mint = async () => {
    try {
      if (state.totalMinted + state.nftCount >= state.releasedNfts) {
        return cogoToast.error("Not enough NFTs to mint");
      }
      setState((prevState) => ({
        ...prevState,
        buyLoader: true
      }));
      const { isWhitelistActive, isMainSaleActive } = state;
      if (isWhitelistActive) {
        const isWhiteListed = await diveWalletContract.methods
          .whitelist(accountId)
          .call();
        if (isWhiteListed) {
          await handleMint();
        } else {
          cogoToast.error("You are not whitelisted");
        }
      } else if (isMainSaleActive) {
        await handleMint();
      } else cogoToast.error("Sale is not active currently");
    } catch (error) {
      console.log(error);
      cogoToast.error("Some error occured");
    } finally {
      setState((prevState) => ({
        ...prevState,
        buyLoader: false
      }));
    }
  };

  const handlePlus = () => {
    if (state.nftCount + 1 > state.walletLimit - state.claimedNfts) {
      return cogoToast.error("You have reached the maximum limit");
    }
    setState((prevState) => ({
      ...prevState,
      nftCount: prevState.nftCount + 1,
    }));
  };

  const handleMinus = () => {
    if (state.nftCount > 1) {
      setState((prevState) => ({
        ...prevState,
        nftCount: prevState.nftCount - 1,
      }));
    }
  };

  const claimNft = async () => {
    try {
      setState((prevState) => ({
        ...prevState,
        buyLoader: true
      }));
      if (state.psBought) {
        const claim = await diveWalletContract.methods.claim().send({
          from: accountId,
        });
        handleTotalMinted();
        if (claim.status) {
          setState((prevState) => ({
            ...prevState,
            psBought: 0,
          }));
        }
        cogoToast.success("Claimed Successfully");
      } else {
        cogoToast.error("Nothing to claim");
      }
    } catch (error) {
      cogoToast.error("Some error occured");
      console.log(error);
    } finally {
      setState((prevState) => ({
        ...prevState,
        buyLoader: false
      }));
    }
  };

  const handleTotalMinted = async () => {
    if (diveWalletContract) {
      const totalMinted = await diveWalletContract.methods.totalSupply().call();
      setState((prevState) => ({
        ...prevState,
        totalMinted: Number(totalMinted),
      }));
    }
  };

  return (
    <>
      <div className="mintpageMain py-5 px-3">
        {/* <span className="bg-orange color-white fw-bold text-uppercase d-inline-block w-100">Coming Soon</span>*/}
        <div className="col-12 col-sm-12 col-md-7 col-lg-6 col-xl-4 mintpageBG">
          <div className="d-flex align-items-center justify-content-between connectMob">
            <div className="color-white font16 col-12 col-sm-auto col-md-auto">
              <p className="mb-0">
                {web3Provider ? "Wallet Connected" : "Wallet Not Connected"}
              </p>
              <p className="mb-0">
                Balance :{" "}
                <span className="color-blue">{accountBalance} BNB</span>
              </p>
            </div>
            <div className="col-12 col-sm-auto col-md-auto mint-connect-wallet">
              {getWalletConnectButton()}
            </div>
          </div>
          <div className="my-4">
            <p className="color-white font16 text-center">
              Total Minted :{" "}
              <span className="color-blue fw-bold">{state.totalMinted}</span>
            </p>
          </div>
          {(state.isMainSaleActive || state.isWhitelistActive) && (
            <div>
              <p className="color-white font14 text-center mb-0">
                Max Mint {state.walletLimit}
              </p>
              <div className="d-flex align-items-center justify-content-center">
                <button
                  type="button"
                  className="addMintBtn"
                  onClick={handleMinus}
                >
                  -
                </button>
                <input
                  type="text"
                  className="mintInput"
                  placeholder="0"
                  value={state.nftCount}
                  readOnly
                ></input>
                <button
                  type="button"
                  className="addMintBtn"
                  onClick={handlePlus}
                >
                  +
                </button>
              </div>
              <p className="color-white font14 text-center mb-0">
                Total Cost :{" "}
                <span className="color-blue fw-bold">
                  {(state.nftCount * state.nftPrice) / 1000000000000000000} BNB
                </span>
              </p>
            </div>
          )}
          <div className="mt-4">
            <div className="progress progressCustom">
              <div
                id="progress-bar"
                className="progress-bar"
                role="progressbar"
                aria-valuenow="10"
                aria-valuemin="0"
                aria-valuemax="100"
                style={{
                  width: `${(state.totalMinted / state.releasedNfts) * 100}%`,
                }}
              ></div>
            </div>
          </div>
          <div className="mt-4 text-center buy-claim-buttons">
            {!state.loading ? (
              (state.isMainSaleActive || state.isWhitelistActive) ? null : (
                <p>Currently the sale is inactive</p>
              )
            ) : (
              <p>Loading...</p>
            )}

            {(state.isMainSaleActive || state.isWhitelistActive) && (
              <button
                className="btn btn-orange"
                type="button"
                disabled={!web3Provider}
                onClick={Mint}
                style={{ marginRight: "12px" }}
              >
                {state.buyLoader ? "Please wait" : "Buy"}
              </button>
            )}
            {state.psBought ? (
              <button
                className="btn btn-orange"
                type="button"
                disabled={!web3Provider}
                onClick={claimNft}
              >
                {state.buyLoader ? "Please wait" : "Claim"}
              </button>
            ) : null}
            {
              <p
                className="color-white font14 text-center mb-0 total-minted"
              >
                Total Minted :{" "}
                <span className="color-blue fw-bold">
                  {state.totalMinted}/{state.releasedNfts}
                </span>
              </p>
            }
          </div>
        </div>
      </div>
    </>
  );
}

export default Mint;
