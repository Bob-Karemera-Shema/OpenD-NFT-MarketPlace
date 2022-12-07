import Principal "mo:base/Principal";
import NFTActorClass "../NFT/nft";
import Cycles "mo:base/ExperimentalCycles";

actor OpenD {
    public shared(msg) func mint(imgData: [Nat8], name: Text): async Principal {
        let owner : Principal = msg.caller;

        Cycles.add(100_500_000_000);
        let newNFT = await NFTActorClass.NFT(name, owner, imgData);
        
        return await newNFT.getCanisterId();
    }
};
