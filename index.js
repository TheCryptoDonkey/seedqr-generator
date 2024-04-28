import * as bip39 from "bip39";
import qrcode from "qrcode";

function getWordIndex(word) {
    const wordlist = bip39.wordlists.english;
    const index = wordlist.indexOf(word);
    // needs to be zero padded to 4 digits
    const paddedIndex = index.toString().padStart(4, '0');
    return paddedIndex;
}

function indexToBinary(index) {
    if (index < 0) {
        return null;
    }
    return index.toString(2).padStart(11, '0');  // Convert to binary and pad to 11 bits
}

async function main() {
    const mnemonic = process.argv[2]
    const words = mnemonic.split(' ');

    let wordsArray = words.map(word => getWordIndex(word));
    wordsArray.forEach(element => {
        console.log(element);
    })

    const digitStream = wordsArray.map(element => element).join('');

    const options = {
        errorCorrectionLevel: 'L', // Low error correction (L, M, Q, H)
        margin: 4,                // Standard margin
        scale: 10,                // Scale for larger display
        color: {
            dark: "#000000",      // Black modules
            light: "#FFFFFF"      // White background
        }
    };

    qrcode.toFile('standardSeedQR.png', [{data: digitStream, mode: 'byte'}], options, function (error) {
        if (error) throw error;
        console.log('QR code generated and saved as standardSeedQR.png');
    });

    // convert each item in the array to a binary number
    let binaryArray = wordsArray.map(element => indexToBinary(parseInt(element)));
    binaryArray.forEach(element => {
        console.log(element);
    })

    const binaryStream = binaryArray.map(element => element).join('');

    let is12words = false;
    let is24words = false;
    if (binaryStream.length == 132) {
        is12words = true;
    } else if (binaryStream.length == 264) {
        is24words = true;
    } else {
        console.log("Invalid number of words");
        return;
    }


    // if we are using 12 words we need to remove 4 bits from the end, if 24 then 8
    let checksumLength = 0;
    if (is12words) {
        checksumLength = 4;
    } else if (is24words) {
        checksumLength = 8;
    }
    const checksum = binaryStream.slice(-checksumLength);
    const binaryStreamWithoutChecksum = binaryStream.slice(0, -checksumLength);

    let byteStream = [];
    for (let i = 0; i < binaryStreamWithoutChecksum.length; i += 8) {
        byteStream.push(parseInt(binaryStreamWithoutChecksum.slice(i, i + 8), 2));
    }

    const uint8Array = new Uint8ClampedArray(byteStream);

    qrcode.toFile('compactSeedQR.png', [{data: uint8Array, mode: 'byte'}], options, function (error) {
        if (error) throw error;
        console.log('QR code generated and saved as compactSeedQR.png');
    });
}

main().catch(console.error)