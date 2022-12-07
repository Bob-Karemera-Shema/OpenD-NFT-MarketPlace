import React, { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import {Actor, HttpAgent} from "@dfinity/agent";
import {idlFactory} from "../../../declarations/nft";
import {Principal} from "@dfinity/principal";

function Item(props) {
  const [nftName, setName] = useState();
  const [nftOwner, setOwner] = useState();
  const [nftImage, setImage] = useState();

  const id = Principal.fromText(props.id);
  const localHost = "http://localhost:8080";
  const agent = new HttpAgent({host: localHost});

  async function loadNFT(){
    const nftActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: id
    });

    const imageData = new Uint8Array(await nftActor.getImage());
    const image = URL.createObjectURL(new Blob([imageData.buffer], {type: "image/png"}));

    setName(await nftActor.getName());
    setOwner((await nftActor.getOwner()).toText());
    setImage(image);
  }

  useEffect(() => {
    loadNFT();
  }, []);

  return (
    <div className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={nftImage}
        />
        <div className="disCardContent-root">
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {nftName}<span className="purple-text"></span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {nftOwner}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Item;
