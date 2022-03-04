import 'package:callsign/cryptomatic.dart' as crypt;
import 'package:webcrypto/webcrypto.dart' as webcrypto;

// import 'package:flutter/material.dart';
// import 'package:get/get.dart';
// import './login.dart';
//
// void main() => runApp(const GetMaterialApp(
//       title: "Login App",
//       home: LoginApp(),
//     ));

import 'package:flutter/material.dart';
import './login.dart';

void main() async {
  final deriveKey = await crypt.generateDeriveKeys();

  final aPrivate = await crypt.importPrivateSignKey(
      'MIG2AgEAMBAGByqGSM49AgEGBSuBBAAiBIGeMIGbAgEBBDATcoc3dcDeHMQtFB42L/DLDop2Rh9Fnf8U+M4MbceakB3E5UTp+rYjsFK1WEH7/BahZANiAAQDR+MWvyZ6PqED52UOCB/cqqTY3mBMZUtiRmQLE8ju0BBmKJye048rFHC0It2WaZLogfHOGL/YlLHTwoOcaJcSuaUFQPLprzvDeXIcTVQQ0VpCJplNH0cPvR1B7+QlKeI=');

  final aPublic = await crypt
      .importPublicSignKey(await crypt.fetchKey('a.callsign.network'));

  final aDeriveKeys = await crypt.generateDeriveKeys();

  final bPrivate = await crypt.importPrivateSignKey(
      'MIG2AgEAMBAGByqGSM49AgEGBSuBBAAiBIGeMIGbAgEBBDChEaE/vqbStT039iUpLDPQmPhYI/aNxr5q6W1VaPE/8MdEd4dbSJ9z4EUNDfBQONGhZANiAARCqzTc82hccZKgZmjXrNhEnMh3WcCHEQUQ67eBE56ct6GvjQB1nJ1RvNULiJZr52Mr0+I2qWhxOcWgJqQWNeIUDOYo7hCguVE2q43LwUdvAZQXY47IY94m99SYKaVRoVU=');

  final bPublic = await crypt
      .importPublicSignKey(await crypt.fetchKey('b.callsign.network'));

  final bDeriveKeys = await crypt.generateDeriveKeys();

  final aSecret =
      await crypt.derive(aDeriveKeys.privateKey, bDeriveKeys.publicKey);

  final bSecret =
      await crypt.derive(bDeriveKeys.privateKey, aDeriveKeys.publicKey);

  final aSignature = await crypt.sign(aPrivate, 'Hello, world!'.codeUnits);
  print(await crypt.verify(aPublic, aSignature, 'Hello, world!'.codeUnits));

  final encoded = await crypt.encrypt(aSecret, 'Hello, world!'.codeUnits);
  print(encoded.encoded);

  print(String.fromCharCodes(await crypt.decrypt(bSecret, encoded.iv, encoded.encoded)));



  // final base64PublicSignKey = await crypt.fetchKey('a.callsign.network');
  // final publicSignKey = await crypt.importPublicSignKey(base64PublicSignKey);
  // print(publicSignKey);
  // // print(await crypt.importPrivateSignKey(base64PrivateKey));

  // final pks = await webcrypto.EcdsaPrivateKey.generateKey(curve);
  //
  // final out = await pks.publicKey.exportSpkiKey();
  // print(out);
  // final input = await webcrypto.EcdsaPublicKey.importSpkiKey(out, curve);
  // print(input);

  // final privateSignKey = await crypt.importPrivateSignKey(base64PrivateKey);

  // final signKeys = await crypt.generateSignKeys();

  // print(await crypt.exportPrivateSignKey(signKeys.privateKey));
  // print(await crypt.exportPublicSignKey(signKeys.publicKey));
  // print(base64PrivateKey);
  // print(await crypt.importPrivateSignKey(await crypt.exportPrivateSignKey(signKeys.privateKey)));

  // print(privateSignKey);

  // final signKeys = generateSignKeys();

  // print(await exportPrivateKey(deriveKey.privateKey));
  // print(await exportPublicKey(deriveKey.publicKey));

  // final eh = await deriveKey.privateKey.deriveBits(384, deriveKey.publicKey);
  // print(eh);

  return runApp(const MaterialApp(
    title: "Login App",
    home: LoginApp(),
  ));
}
