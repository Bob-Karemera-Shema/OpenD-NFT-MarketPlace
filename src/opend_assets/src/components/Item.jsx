import React, { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import {Actor, HttpAgent} from "@dfinity/agent";
import {idlFactory} from "../../../declarations/nft";
import {idlFactory as tokenIdlFactory} from "../../../declarations/token";
import {Principal} from "@dfinity/principal";
import Button from "./Button";
import { opend } from "../../../declarations/opend";
import CURRENT_USER_ID from "../index";
import PriceLabel from "./PriceLabel";

function Item(props) {
  const [nftName, setName] = useState();
  const [nftOwner, setOwner] = useState();
  const [nftImage, setImage] = useState();
  const [button, setButton] = useState();
  const [priceInput, setPriceInput] = useState();
  const [priceLabel, setPriceLabel] = useState();
  const [loaderHidden, setLoaderHidden] = useState(true);
  const [blur, setBlur] =useState();
  const [saleStatus, setSaleStatus] = useState("");
  const [shouldDisplay, setDisplay] = useState(true);

  const id = props.id;
  const localHost = "http://localhost:8080";
  const agent = new HttpAgent({host: localHost});
  //To remove the followinf line while deploying live on the ICP
  agent.fetchRootKey();
  
  let nftActor;
  let price;

  async function loadNFT(){
    nftActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: id
    });

    const imageData = new Uint8Array(await nftActor.getImage());
    const image = URL.createObjectURL(new Blob([imageData.buffer], {type: "image/png"}));

    setName(await nftActor.getName());
    setOwner((await nftActor.getOwner()).toText());
    setImage(image);
    
    if(props.role === "collection"){
      const isListed = await opend.isListed(props.id);
      if(isListed){
        setOwner("OpenD");
        setBlur({filter: "blur(4px"});
        setSaleStatus("Listed");
      } else {
        setButton(<Button handleClick={sell} text="Sell"/>);
      }
    } else if(props.role === "discover"){
      const originalOwner = await opend.getOriginalOwner(props.id);

      if(originalOwner.toText() != CURRENT_USER_ID.toText()){
        setButton(<Button handleClick={buy} text="Buy"/>);
      }

      const price = await opend.getListedNFTPrice(props.id);
      setPriceLabel(<PriceLabel price={price.toString()}/>);
    }
  }

  useEffect(() => {
    loadNFT();
  }, []);

  function sell(){
    setPriceInput(
      <input
            placeholder="Price in BToken"
            type="number"
            className="price-input"
            value={price}
            onChange={(e) => price = e.target.value}
          />
    );

    setButton(<Button handleClick={confirmSale} text="Confirm"/>);
  }

  async function confirmSale(){
    setBlur({filter: "blur(4px"});
    setLoaderHidden(false);
    const listingFeedback = await opend.listItem(props.id, Number(price));
    console.log(listingFeedback);

    if(listingFeedback == "Success"){
      const openDId = await opend.getOpenDCanisterId();
      const transferFeedback = await nftActor.transferOwnership(openDId);
      console.log(transferFeedback);
      
      if(transferFeedback == "Success"){
        setLoaderHidden(true);
        setButton();
        setPriceInput();
        setOwner("OpenD");
        setSaleStatus("Listed");
      }
    }
  }

  async function buy(){
    setLoaderHidden(false);
    const tokenActor = await Actor.createActor(tokenIdlFactory, {
      agent,
      canisterId: Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai")
    });

    const sellerId = await opend.getOriginalOwner(props.id);
    const itemPrice = await opend.getListedNFTPrice(props.id);

    const feedback = await tokenActor.transfer(sellerId, itemPrice);

    if(feedback === "Success"){
      //Transfer ownership
      const transferFeedback = await opend.completePurchase(props.id, sellerId, CURRENT_USER_ID);
      console.log(transferFeedback);
      setLoaderHidden(true);
      setDisplay(false);
    }
  }

  return (
    <div style={{display: shouldDisplay ? "inline" : "none"}} className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={nftImage}
          style={blur}
        />
        <div className="lds-ellipsis" hidden={loaderHidden}>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="disCardContent-root">
          {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {nftName}<span className="purple-text"> {saleStatus}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {nftOwner}
          </p>
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;
