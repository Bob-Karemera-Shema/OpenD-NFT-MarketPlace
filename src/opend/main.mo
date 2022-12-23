import Principal "mo:base/Principal";
import NFTActorClass "../NFT/nft";
import Cycles "mo:base/ExperimentalCycles";
import HashMap "mo:base/HashMap";
import List "mo:base/List";
import Iter "mo:base/Iter";

actor OpenD {

    private type Listing = {
        itemOwner: Principal;
        itemPrice: Nat;
    };

    var mapOfNFTs = HashMap.HashMap<Principal, NFTActorClass.NFT>(1, Principal.equal, Principal.hash);
    var mapOfOwners = HashMap.HashMap<Principal, List.List<Principal>>(1, Principal.equal, Principal.hash);
    var mapOfListings = HashMap.HashMap<Principal, Listing>(1, Principal.equal, Principal.hash);

    public shared(msg) func mint(imgData: [Nat8], name: Text): async Principal {
        let owner : Principal = msg.caller;

        Cycles.add(100_500_000_000);
        let newNFT = await NFTActorClass.NFT(name, owner, imgData);
        let newNFTPrincipal = await newNFT.getCanisterId();
        mapOfNFTs.put(newNFTPrincipal, newNFT);
        addToOwnersMap(owner, newNFTPrincipal);
        
        //return NFT Principal
        return newNFTPrincipal
    };

    private func addToOwnersMap(owner: Principal, nftId: Principal) {
        var ownedNFTs : List.List<Principal> = switch (mapOfOwners.get(owner)) {
            case null List.nil<Principal>();
            case (?list) list;
        };

        ownedNFTs := List.push(nftId, ownedNFTs);
        mapOfOwners.put(owner, ownedNFTs);
    };

    public query func getOwnedNFTs(user: Principal) : async [Principal] {
        var userCollection : List.List<Principal> = switch (mapOfOwners.get(user)) {
            case null List.nil<Principal>();
            case (?list) list;
        };

        return List.toArray(userCollection);
    };

    public query func getListedNFTs() : async [Principal] {
        let listedIds = Iter.toArray(mapOfListings.keys());
        return listedIds;
    };

    public shared(msg) func listItem(id: Principal, price: Nat) : async Text{
        var nft : NFTActorClass.NFT = switch (mapOfNFTs.get(id)) {
            case null return "NFT not found.";
            case (?nft) nft;
        };

        let nftOwner = await nft.getOwner();

        if(Principal.equal(nftOwner, msg.caller)){
            let newListing : Listing = {
                itemOwner = nftOwner;
                itemPrice = price;
            };
            mapOfListings.put(id, newListing);
            return "Success";
        } else {
            return "You do not own the right to list the NFT."
        }
    };

    public query func getOpenDCanisterId() : async Principal {
        return Principal.fromActor(OpenD);
    };

    public query func isListed(id: Principal) : async Bool {
        if(mapOfListings.get(id) == null){
            return false;
        } else {
            return true;
        }
    };

    public query func getOriginalOwner(id: Principal) : async Principal {
        var listing: Listing = switch(mapOfListings.get(id)) {
            case null return Principal.fromText("");
            case (?result) result;
        };

        return listing.itemOwner;
    };

    public query func getListedNFTPrice(id: Principal) : async Nat {
        var listing: Listing = switch(mapOfListings.get(id)) {
            case null return 0;
            case (?result) result;
        };

        return listing.itemPrice;
    };

    public shared(msg) func completePurchase(id: Principal, ownerId: Principal, newOwnerId: Principal) : async Text {
        var purchasedNFT: NFTActorClass.NFT = switch (mapOfNFTs.get(id)){
            case null return "NFT not found";
            case (?nft) nft;
        };

        let transferFeedback = await purchasedNFT.transferOwnership(newOwnerId);
        if(transferFeedback == "Success"){
            mapOfListings.delete(id);  //remove from listing
            var ownedNFTs : List.List<Principal> = switch (mapOfOwners.get(ownerId)){
                case null List.nil<Principal>();
                case (?nfts) nfts;
            };

            //remove purchased nft from owned NFTs list
            ownedNFTs := List.filter(ownedNFTs, func(nftId: Principal) : Bool {
                return nftId != id;
            });

            //update nft ownership map with new nft owner
            addToOwnersMap(newOwnerId, id);

            return "Success";
        } else {
            return transferFeedback;
        }
    }
};
