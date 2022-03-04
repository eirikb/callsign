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

fetchKey(String callsign) async => (await http.get(Uri.parse(
        '''https://$callsign/$callsign.key?inyourfacecache=${DateTime.now().millisecondsSinceEpoch}''')))
    .body;

Future<KeyPair<EcdhPrivateKey, EcdhPublicKey>> generateDeriveKeys() =>
    EcdhPrivateKey.generateKey(curve);

Future<String> exportPrivateKey(EcdhPrivateKey privateKey) async =>
    base64.encode(await privateKey.exportPkcs8Key());

Future<String> exportPublicKey(EcdhPublicKey publicKey) async =>
    base64.encode(await publicKey.exportRawKey());

Future<EcdsaPrivateKey> importPrivateSignKey(String base64PrivateKey) =>
    EcdsaPrivateKey.importPkcs8Key(base64.decode(base64PrivateKey), curve);

Future<AesGcmSecretKey> derive(
        EcdhPrivateKey privateKey, EcdhPublicKey publicKey) async =>
    AesGcmSecretKey.importRawKey(await privateKey.deriveBits(256, publicKey));

Future<EcdsaPublicKey> importPublicKey(String base64PublicKey) =>
    EcdsaPublicKey.importRawKey(base64.decode(base64PublicKey), curve);

Future<EcdhPublicKey> importPublicDeriveKey(String base64PublicKey) =>
    EcdhPublicKey.importRawKey(base64.decode(base64PublicKey), curve);

Future<EcdsaPublicKey> importPublicSignKey(String base64PublicKey) =>
    EcdsaPublicKey.importSpkiKey(base64.decode(base64PublicKey), curve);

Future<KeyPair<EcdsaPrivateKey, EcdsaPublicKey>> generateSignKeys() =>
    EcdsaPrivateKey.generateKey(curve);

Future<String> exportPrivateSignKey(EcdsaPrivateKey privateKey) async =>
    base64.encode(await privateKey.exportPkcs8Key());

Future<String> exportPublicSignKey(EcdsaPublicKey publicKey) async =>
    base64.encode(await publicKey.exportRawKey());

Future<String> exportSecretKey(EcdhPrivateKey privateKey) async =>
    base64.encode(await privateKey.exportPkcs8Key());

Future<String> sign(EcdsaPrivateKey privateKey, List<int> data) async =>
    base64.encode(await privateKey.signBytes(data, Hash.sha384));

Future<bool> verify(
        EcdsaPublicKey publicKey, String signature, List<int> data) =>
    publicKey.verifyBytes(base64.decode(signature), data, Hash.sha384);

Future<Encoded> encrypt(AesGcmSecretKey secretKey, List<int> data) async {
  final iv = Uint8List(12);
  fillRandomBytes(iv);
  return Encoded(iv, await secretKey.encryptBytes(data, iv));
}

Future<Uint8List> decrypt(
        AesGcmSecretKey secretKey, List<int> iv, List<int> data) =>
    secretKey.decryptBytes(data, iv);
