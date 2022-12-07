import Principal "mo:base/Principal";

actor class NFT (name: Text, owner: Principal, content: [Nat8]) = this {
    let itemName = name;
    let nftOwner = owner;
    let imageBytes = content;

    public query func getName () : async Text {
        return itemName;
    };

    public query func getOwner () : async Principal {
        return nftOwner;
    };

    public query func getImage () : async [Nat8] {
        return content;
    };

    public query func getCanisterId () : async Principal {
        return Principal.fromActor(this);
    }
}