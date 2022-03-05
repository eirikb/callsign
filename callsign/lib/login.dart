import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:callsign/cryptomatic.dart' as crypto;

class Controller extends GetxController {
  var status = ''.obs;
  var callsign = TextEditingController();
  var key = TextEditingController();

  setStatus(String status) {
    this.status.value = status;
  }
}

login() async {
  final Controller c = Get.find<Controller>();
  c.setStatus("Importing private sign key...");
  final privateSignKey =
      await crypto.importPrivateSignKey(crypto.Base64String(c.key.text));
  c.setStatus("Fetching key from ${c.callsign.text}...");
  final base64PublicSignKey = await crypto.fetchKey(c.callsign.text);
  c.setStatus("Importing public sign key...");
  final publicSignKey = await crypto.importPublicSignKey(base64PublicSignKey);
  c.setStatus("Got public sign key. Verifying...");
  final signed = await crypto.sign(privateSignKey, 'Hello, world!'.codeUnits);
  final verified =
      await crypto.verify(publicSignKey, signed, 'Hello, world!'.codeUnits);

  if (verified) {
    c.setStatus("Yeah!");
  } else {
    c.setStatus("Verification failed");
  }
}

class LoginApp extends StatelessWidget {
  const LoginApp({Key? key}) : super(key: key);

  void click() {}

  @override
  Widget build(BuildContext context) {
    Controller c = Get.put(Controller());

    return Scaffold(
      body: SingleChildScrollView(
        child: Container(
          height: MediaQuery.of(context).size.height,
          width: MediaQuery.of(context).size.width,
          decoration: const BoxDecoration(
              gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                Colors.lightGreen,
                Colors.tealAccent,
                Colors.greenAccent,
              ])),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              Container(
                width: 300,
                height: 350,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.all(Radius.circular(15)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const Padding(
                        padding: EdgeInsets.all(20),
                        child: Text(
                          "Callsign",
                          style: TextStyle(
                              fontSize: 28, fontWeight: FontWeight.bold),
                        )),
                    Padding(
                      padding: EdgeInsets.only(left: 20, right: 20),
                      child: TextField(
                        controller: c.callsign,
                        decoration: const InputDecoration(
                            // suffix: Icon(FontAwesomeIcons.envelope,color: Colors.red,),
                            labelText: "Callsign (domain)",
                            border: OutlineInputBorder(
                              borderRadius:
                                  BorderRadius.all(Radius.circular(8)),
                            )),
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.all(20),
                      child: TextField(
                        controller: c.key,
                        obscureText: true,
                        decoration: const InputDecoration(
                            // suffix: Icon(FontAwesomeIcons.eyeSlash,color: Colors.red,),
                            labelText: "Key",
                            border: OutlineInputBorder(
                              borderRadius:
                                  BorderRadius.all(Radius.circular(8)),
                            )),
                      ),
                    ),
                    ElevatedButton(
                      child: const Text("Connect"),
                      onPressed: () {
                        login();
                      },
                      style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 80, vertical: 20),
                          textStyle: const TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Obx(() => Text(
                            "${c.status}",
                            style: const TextStyle(
                                fontSize: 16, fontWeight: FontWeight.bold),
                          )),
                    ),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
