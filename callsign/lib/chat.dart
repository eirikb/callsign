import 'package:flutter/material.dart';
import 'package:get/get.dart';

class ChatController extends GetxController {
  var count = 0.obs;
}

class Chat extends StatelessWidget {
  const Chat({Key? key}) : super(key: key);

  @override
  Widget build(context) {
    final ChatController c = Get.put(ChatController());

    return Scaffold(
        body: Center(
            child: Column(children: [
      Obx(() => Text("${c.count}")),
      ElevatedButton(child: const Text("+"), onPressed: () => c.count++)
    ])));
  }
}
