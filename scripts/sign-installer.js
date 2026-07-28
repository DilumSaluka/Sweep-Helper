// Code signing reference for electron-builder
// Set these env vars before building:
//   WIN_CSC_FILE  — path to .p12 or .pfx certificate file
//   WIN_CSC_KEY_PASSWORD — certificate password
//
// Then remove the following from package.json build.win:
//   "verifyUpdateCodeSignature": false
//   "signAndEditExecutable": false
//   "signDlls": false
//
// electron-builder will auto-detect the env vars and sign.
//
// To convert assets/icon.png → assets/icon.ico:
//   Use any online converter or ImageMagick:
//   magick convert assets/icon.png -define icon:auto-resize=256,64,48,32,16 assets/icon.ico
