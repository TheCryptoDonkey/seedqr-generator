import { writeFileSync } from "node:fs";
import {
    getWordIndex, indexToBinary, standardPayload, compactPayload, encodeSeedQr, toPng,
} from "./seedqr.js";

async function main() {
    const mnemonic = process.argv[2]
    const words = mnemonic.split(' ');

    const wordsArray = words.map(word => getWordIndex(word));
    wordsArray.forEach(element => {
        console.log(element);
    })

    writeFileSync('standardSeedQR.png', toPng(encodeSeedQr(standardPayload(words))));
    console.log('QR code generated and saved as standardSeedQR.png');

    // convert each item in the array to a binary number
    wordsArray.map(element => indexToBinary(parseInt(element))).forEach(element => {
        console.log(element);
    })

    const compact = compactPayload(words);
    if (compact === null) {
        console.log("Invalid number of words");
        return;
    }

    writeFileSync('compactSeedQR.png', toPng(encodeSeedQr(compact)));
    console.log('QR code generated and saved as compactSeedQR.png');
}

main().catch(console.error)
