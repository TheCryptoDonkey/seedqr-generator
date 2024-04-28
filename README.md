# SeedQR Generator

This JavaScript will generate a standard and compact SeedQR code

## Building

1. Install [Nix](https://nixos.org/download.html) if you haven't already.
2. Clone the repository:
   ```bash
   git clone https://github.com/TheCryptoDonkey/seedqr-generator.git
   cd seedqr-generator
   ```
3. Enter the Nix shell:
   ```bash
   nix-shell
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run the app:
   ```bash
   node index.js "your BIP39 seed phrase"
   ```
   
for instance
```bash
node index.js "bacon bacon bacon bacon bacon bacon bacon bacon bacon bacon bacon bacon"
```

two images will be created called compactSeedQR.png and standardSeedQR.png