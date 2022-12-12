import React, { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import {Actor, HttpAgent} from "@dfinity/agent";
import {idlFactory} from "../../../declarations/nft";
import {Principal} from "@dfinity/principal";
import Button from "./Button";
import { opend } from "../../../declarations/opend";

function Item(props) {
  const [nftName, setName] = useState();
  const [nftOwner, setOwner] = useState();
  const [nftImage, setImage] = useState();
  const [button, setButton] = useState();
  const [priceInput, setPriceInput] = useState();
  const [loaderHidden, setLoaderHidden] = useState(true);
  const [blur, setBlur] =useState();
  const [saleStatus, setSaleStatus] = useState("");

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
    
    const isListed = await opend.isListed(props.id);
    if(isListed){
      setOwner("OpenD");
      setBlur({filter: "blur(4px"});
      setSaleStatus("Listed");
    } else {
      setButton(<Button handleClick={sell} text="Sell"/>);
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

    setButton(<Button handleClick={confirmSell} text="Confirm"/>);
  }

  async function confirmSell(){
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

  return (
    <div className="disGrid-item">
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
