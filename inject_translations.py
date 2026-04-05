import json
import os
import glob

translations_dir = r"c:\Users\HP\Desktop\bluewave-fullstack\bluewave-frontend\translations"

new_keys = {
    "tour": {
        "title_1": "The Global Pulse",
        "desc_1": "Welcome, Ghost. This is the heart of the Protocol. Watch real-time human activity being processed into social signal across the globe.",
        "title_2": "Social Intelligence",
        "desc_2": "The Signal Feed. Engage with the ecosystem's most vital streams. As a guest, you can Like and Comment to shape the protocol's intelligence.",
        "title_3": "Reward Ecosystem",
        "desc_3": "Earn & Grow. Complete presence and social missions to build your $BWAVE balance. This sector remains encrypted until your wallet is linked.",
        "title_4": "Digital Activation",
        "desc_4": "Finalize your identity. Connect your TON wallet here to activate your permanent BW ID and unlock full protocol features.",
        "init": "Protocol Initialization",
        "next": "Next",
        "finish": "Initialize"
    },
    "ghost": {
        "sector_encrypted": "Sector Encrypted",
        "connect_prompt": "Connect your TON wallet to decrypt the reward ecosystem and activate your BW ID.",
        "connect_btn": "Connect TON Wallet"
    },
    "alerts": {
        "connect_wallet_ref": "Please connect your wallet to generate a referral link.",
        "connect_wallet_blu": "Please connect your wallet to access Blu configurations."
    }
}

for filepath in glob.glob(os.path.join(translations_dir, "*.json")):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Merge new keys safely without overwriting existing structure if it already somehow exists
    for cat, keys in new_keys.items():
        if cat not in data:
            data[cat] = {}
        for k, v in keys.items():
            if k not in data[cat]:
                data[cat][k] = v

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

print("Successfully injected translation keys into all languages.")
