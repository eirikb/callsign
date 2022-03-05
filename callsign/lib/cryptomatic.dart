import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:webcrypto/webcrypto.dart';
import 'dart:convert';

class Encoded {
  List<int> iv;
  List<int> encoded;

  Encoded(this.iv, this.encoded);
}

const curve = EllipticCurve.p384;

class Base64String {
  String value;

  Base64String(this.value);
}

Future<Base64String> fetchKey(String callsign) async =>
    Base64String((await http.get(Uri.parse(
            '''https://$callsign/$callsign.key?inyourfacecache=${DateTime.now().millisecondsSinceEpoch}''')))
        .body);

Future<KeyPair<EcdhPrivateKey, EcdhPublicKey>> generateDeriveKeys() =>
    EcdhPrivateKey.generateKey(curve);

Future<Base64String> exportPrivateKey(EcdhPrivateKey privateKey) async =>
    Base64String(base64.encode(await privateKey.exportPkcs8Key()));

Future<Base64String> exportPublicKey(EcdhPublicKey publicKey) async =>
    Base64String(base64.encode(await publicKey.exportRawKey()));

Future<EcdsaPrivateKey> importPrivateSignKey(Base64String privateKey) =>
    EcdsaPrivateKey.importPkcs8Key(base64.decode(privateKey.value), curve);

Future<AesGcmSecretKey> derive(
        EcdhPrivateKey privateKey, EcdhPublicKey publicKey) async =>
    AesGcmSecretKey.importRawKey(await privateKey.deriveBits(256, publicKey));

Future<EcdsaPublicKey> importPublicKey(Base64String publicKey) =>
    EcdsaPublicKey.importRawKey(base64.decode(publicKey.value), curve);

Future<EcdhPublicKey> importPublicDeriveKey(Base64String publicKey) =>
    EcdhPublicKey.importRawKey(base64.decode(publicKey.value), curve);

Future<EcdsaPublicKey> importPublicSignKey(Base64String publicKey) =>
    EcdsaPublicKey.importSpkiKey(base64.decode(publicKey.value), curve);

Future<KeyPair<EcdsaPrivateKey, EcdsaPublicKey>> generateSignKeys() =>
    EcdsaPrivateKey.generateKey(curve);

Future<Base64String> exportPrivateSignKey(EcdsaPrivateKey privateKey) async =>
    Base64String(base64.encode(await privateKey.exportPkcs8Key()));

Future<Base64String> exportPublicSignKey(EcdsaPublicKey publicKey) async =>
    Base64String(base64.encode(await publicKey.exportRawKey()));

Future<Base64String> exportSecretKey(EcdhPrivateKey privateKey) async =>
    Base64String(base64.encode(await privateKey.exportPkcs8Key()));

Future<Base64String> sign(EcdsaPrivateKey privateKey, List<int> data) async =>
    Base64String(base64.encode(await privateKey.signBytes(data, Hash.sha384)));

Future<bool> verify(
        EcdsaPublicKey publicKey, Base64String signature, List<int> data) =>
    publicKey.verifyBytes(base64.decode(signature.value), data, Hash.sha384);

Future<Encoded> encrypt(AesGcmSecretKey secretKey, List<int> data) async {
  final iv = Uint8List(12);
  fillRandomBytes(iv);
  return Encoded(iv, await secretKey.encryptBytes(data, iv));
}

Future<Uint8List> decrypt(
        AesGcmSecretKey secretKey, List<int> iv, List<int> data) =>
    secretKey.decryptBytes(data, iv);
