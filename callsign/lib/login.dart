import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;

class Controller extends GetxController {
  var status = ''.obs;
  var eh = TextEditingController();

  setStatus(String status) {
    this.status.value = status;
  }
}

fetchKey(String callsign) async {
  return http.get(Uri.parse(
      """https://${callsign}/${callsign}.key?inyourfacecache=${""}"""));
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
                        controller: c.eh,
                        decoration: InputDecoration(
                            // suffix: Icon(FontAwesomeIcons.envelope,color: Colors.red,),
                            labelText: "Callsign (domain)",
                            border: OutlineInputBorder(
                              borderRadius:
                                  BorderRadius.all(Radius.circular(8)),
                            )),
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.all(20),
                      child: TextField(
                        obscureText: true,
                        decoration: InputDecoration(
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
                      onPressed: () async {
                        c.setStatus("Connecting ${c.eh.text}...");
                        // final ok = fetchKey();
                        // print(ok);
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
